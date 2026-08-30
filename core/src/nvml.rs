//! Data collection via NVML (NVIDIA Management Library), the C library that
//! backs nvidia-smi. We query NVML directly instead of parsing nvidia-smi
//! stdout (whose format has changed before).
//!
//! `libnvidia-ml.so.1` is loaded at runtime with `dlopen`, not linked at
//! build time. The NVIDIA driver ships that library and the driver packages
//! differ per vendor and generation, so there is nothing portable to link
//! or depend on. Loading it lazily also means `--version`, `--help` and the
//! rest of the process start on a machine with no driver at all — only the
//! first NVML call fails, with a readable message instead of the dynamic
//! loader aborting the process.
//!
//! Struct layouts below mirror `nvml.h` exactly (repr(C)).

use std::os::raw::{c_char, c_int, c_void};
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::gpu::{Gpu, Proc, Snapshot};

// --- NVML return codes (nvmlReturn_t) ---
const NVML_SUCCESS: u32 = 0;
const NVML_ERROR_NOT_SUPPORTED: u32 = 8;

// --- NVML enums ---
const NVML_TEMPERATURE_GPU: u32 = 0;

// --- Struct sizes from nvml.h ---
const NAME_BUF: usize = 64; // NVML_DEVICE_NAME_BUFFER_SIZE
const UUID_BUF: usize = 80; // NVML_DEVICE_UUID_BUFFER_SIZE
const DRIVER_BUF: usize = 80; // NVML_SYSTEM_DRIVER_VERSION_BUFFER_SIZE

#[repr(C)]
#[derive(Clone, Copy, Default)]
struct NvmlMemory {
    total: u64,
    free: u64,
    used: u64,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
struct NvmlUtilization {
    gpu: u32,
    memory: u32,
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
struct NvmlProcessInfo {
    pid: u32,
    used_gpu_memory: u64,
    gpu_instance_id: u32,
    compute_instance_id: u32,
}

// --- dlopen, from libdl (folded into libc since glibc 2.34; the build
// targets glibc 2.35, so no extra link flag is needed). ---
extern "C" {
    fn dlopen(filename: *const c_char, flag: c_int) -> *mut c_void;
    fn dlsym(handle: *mut c_void, symbol: *const c_char) -> *mut c_void;
    fn dlclose(handle: *mut c_void) -> c_int;
}
const RTLD_NOW: c_int = 2;
const RTLD_LOCAL: c_int = 0;

/// The subset of NVML this crate calls, resolved out of `libnvidia-ml.so.1`
/// at runtime. Field names track the C symbols so the two stay easy to
/// diff against `nvml.h`.
struct Api {
    // Kept so the library stays mapped for the life of the process; NVML
    // init is process-global and we never unload.
    _lib: *mut c_void,
    init_v2: unsafe extern "C" fn() -> u32,
    shutdown: unsafe extern "C" fn() -> u32,
    device_get_count_v2: unsafe extern "C" fn(*mut u32) -> u32,
    device_get_handle_by_index_v2: unsafe extern "C" fn(u32, *mut *mut c_void) -> u32,
    device_get_name: unsafe extern "C" fn(*mut c_void, *mut u8, u32) -> u32,
    device_get_uuid: unsafe extern "C" fn(*mut c_void, *mut u8, u32) -> u32,
    device_get_fan_speed: unsafe extern "C" fn(*mut c_void, *mut u32) -> u32,
    device_get_temperature: unsafe extern "C" fn(*mut c_void, u32, *mut u32) -> u32,
    device_get_power_usage: unsafe extern "C" fn(*mut c_void, *mut u32) -> u32,
    device_get_power_management_limit: unsafe extern "C" fn(*mut c_void, *mut u32) -> u32,
    device_get_memory_info: unsafe extern "C" fn(*mut c_void, *mut NvmlMemory) -> u32,
    device_get_utilization_rates: unsafe extern "C" fn(*mut c_void, *mut NvmlUtilization) -> u32,
    system_get_driver_version: unsafe extern "C" fn(*mut u8, u32) -> u32,
    device_get_compute_running_processes_v3:
        unsafe extern "C" fn(*mut c_void, *mut u32, *mut NvmlProcessInfo) -> u32,
}

// The library handle and function pointers are plain addresses into a
// permanently-mapped library; sharing them across threads is sound and NVML
// itself is thread-safe.
unsafe impl Send for Api {}
unsafe impl Sync for Api {}

static API: OnceLock<Api> = OnceLock::new();

fn load_api() -> Result<Api, String> {
    unsafe {
        let lib = dlopen(c"libnvidia-ml.so.1".as_ptr(), RTLD_NOW | RTLD_LOCAL);
        if lib.is_null() {
            return Err(
                "could not load libnvidia-ml.so.1 — is the NVIDIA driver installed?".into(),
            );
        }

        // Resolve one symbol or unload and bail. `transmute` turns the
        // `void*` from dlsym into the typed function pointer.
        macro_rules! sym {
            ($name:literal) => {{
                let s = dlsym(lib, concat!($name, "\0").as_ptr().cast());
                if s.is_null() {
                    dlclose(lib);
                    return Err(format!("libnvidia-ml.so.1 is missing {}", $name));
                }
                std::mem::transmute(s)
            }};
        }

        Ok(Api {
            _lib: lib,
            init_v2: sym!("nvmlInit_v2"),
            shutdown: sym!("nvmlShutdown"),
            device_get_count_v2: sym!("nvmlDeviceGetCount_v2"),
            device_get_handle_by_index_v2: sym!("nvmlDeviceGetHandleByIndex_v2"),
            device_get_name: sym!("nvmlDeviceGetName"),
            device_get_uuid: sym!("nvmlDeviceGetUUID"),
            device_get_fan_speed: sym!("nvmlDeviceGetFanSpeed"),
            device_get_temperature: sym!("nvmlDeviceGetTemperature"),
            device_get_power_usage: sym!("nvmlDeviceGetPowerUsage"),
            device_get_power_management_limit: sym!("nvmlDeviceGetPowerManagementLimit"),
            device_get_memory_info: sym!("nvmlDeviceGetMemoryInfo"),
            device_get_utilization_rates: sym!("nvmlDeviceGetUtilizationRates"),
            system_get_driver_version: sym!("nvmlSystemGetDriverVersion"),
            device_get_compute_running_processes_v3: sym!(
                "nvmlDeviceGetComputeRunningProcesses_v3"
            ),
        })
    }
}

/// The loaded NVML entry points. Only reachable once `Nvml::new()` has
/// populated `API`, so the `expect` never fires in practice.
fn api() -> &'static Api {
    API.get().expect("NVML library is loaded before it is used")
}

fn err_str(rc: u32) -> String {
    match rc {
        NVML_SUCCESS => "success".into(),
        2 => "NVML not initialized".into(),
        3 => "invalid argument".into(),
        5 => "function not found".into(),
        6 => "library not found".into(),
        7 => "driver not loaded".into(),
        NVML_ERROR_NOT_SUPPORTED => "not supported".into(),
        10 => "insufficient size".into(),
        11 => "no permission".into(),
        100 => "GPU is lost".into(),
        _ => format!("NVML error {rc}"),
    }
}

/// A live NVML handle. NVML init is process-global, so this owns the
/// init/shutdown lifecycle: `new()` loads the library and initializes,
/// `Drop` shuts down.
pub struct Nvml;

impl Nvml {
    pub fn new() -> Result<Nvml, String> {
        if API.get().is_none() {
            // First caller wins; a loser drops its handle, which only leaks
            // the mapping (we never unload anyway).
            let loaded = load_api()?;
            let _ = API.set(loaded);
        }
        let rc = unsafe { (api().init_v2)() };
        if rc != NVML_SUCCESS {
            return Err(format!("NVML init failed: {}", err_str(rc)));
        }
        Ok(Nvml)
    }

    /// Query every GPU and its running compute processes into a Snapshot.
    pub fn snapshot(&self) -> Result<Snapshot, String> {
        let count = unsafe {
            let mut c: u32 = 0;
            if (api().device_get_count_v2)(&mut c) != NVML_SUCCESS {
                0
            } else {
                c
            }
        };
        let driver = driver_version();
        let mut gpus = Vec::with_capacity(count as usize);
        let mut procs = Vec::new();
        for i in 0..count {
            let handle = match device_handle(i) {
                Some(h) => h,
                None => continue,
            };
            let gpu = query_gpu(i as i64, handle, &driver);
            let uuid = gpu.uuid.clone();
            procs.extend(query_procs(handle, &uuid));
            gpus.push(gpu);
        }
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);
        Ok(Snapshot {
            gpus,
            procs,
            timestamp,
        })
    }
}

impl Drop for Nvml {
    fn drop(&mut self) {
        if let Some(a) = API.get() {
            unsafe {
                (a.shutdown)();
            }
        }
    }
}

fn device_handle(index: u32) -> Option<*mut c_void> {
    let mut h: *mut c_void = std::ptr::null_mut();
    if unsafe { (api().device_get_handle_by_index_v2)(index, &mut h) } == NVML_SUCCESS {
        Some(h)
    } else {
        None
    }
}

/// Read a NUL-terminated C string out of a buffer.
fn cstr(buf: &[u8]) -> String {
    let len = buf.iter().position(|&b| b == 0).unwrap_or(buf.len());
    String::from_utf8_lossy(&buf[..len]).into_owned()
}

fn get_name(device: *mut c_void) -> String {
    let mut buf = [0u8; NAME_BUF];
    if unsafe { (api().device_get_name)(device, buf.as_mut_ptr(), buf.len() as u32) } == NVML_SUCCESS
    {
        cstr(&buf)
    } else {
        String::new()
    }
}

fn get_uuid(device: *mut c_void) -> String {
    let mut buf = [0u8; UUID_BUF];
    if unsafe { (api().device_get_uuid)(device, buf.as_mut_ptr(), buf.len() as u32) } == NVML_SUCCESS
    {
        cstr(&buf)
    } else {
        String::new()
    }
}

fn driver_version() -> String {
    let mut buf = [0u8; DRIVER_BUF];
    if unsafe { (api().system_get_driver_version)(buf.as_mut_ptr(), buf.len() as u32) }
        == NVML_SUCCESS
    {
        cstr(&buf)
    } else {
        String::new()
    }
}

fn query_gpu(index: i64, device: *mut c_void, driver: &str) -> Gpu {
    let uuid = get_uuid(device);
    let name = get_name(device);

    let fan = {
        let mut s: u32 = 0;
        match unsafe { (api().device_get_fan_speed)(device, &mut s) } {
            NVML_SUCCESS => Some(s as i64),
            _ => None,
        }
    };
    let temp = {
        let mut t: u32 = 0;
        if unsafe { (api().device_get_temperature)(device, NVML_TEMPERATURE_GPU, &mut t) }
            == NVML_SUCCESS
        {
            t as i64
        } else {
            0
        }
    };
    let power = {
        let mut mw: u32 = 0;
        if unsafe { (api().device_get_power_usage)(device, &mut mw) } == NVML_SUCCESS {
            mw as f64 / 1000.0
        } else {
            0.0
        }
    };
    let power_limit = {
        let mut mw: u32 = 0;
        if unsafe { (api().device_get_power_management_limit)(device, &mut mw) } == NVML_SUCCESS {
            mw as f64 / 1000.0
        } else {
            0.0
        }
    };
    let (mem_used, mem_total) = {
        let mut m = NvmlMemory::default();
        if unsafe { (api().device_get_memory_info)(device, &mut m) } == NVML_SUCCESS {
            // NVML reports bytes; the rest of the app uses MiB.
            ((m.used / 1024 / 1024) as i64, (m.total / 1024 / 1024) as i64)
        } else {
            (0, 0)
        }
    };
    let util = {
        let mut u = NvmlUtilization::default();
        if unsafe { (api().device_get_utilization_rates)(device, &mut u) } == NVML_SUCCESS {
            u.gpu as i64
        } else {
            0
        }
    };
    Gpu {
        index,
        uuid: if uuid.is_empty() { "unknown".into() } else { uuid },
        name: if name.is_empty() { "Unknown GPU".into() } else { name },
        fan,
        temp,
        power,
        power_limit,
        mem_used,
        mem_total,
        util,
        driver: if driver.is_empty() { "N/A".into() } else { driver.to_string() },
    }
}

fn query_procs(device: *mut c_void, uuid: &str) -> Vec<Proc> {
    const MAX: usize = 256;
    let mut buf = vec![NvmlProcessInfo::default(); MAX];
    let mut count = MAX as u32;
    let rc = unsafe {
        (api().device_get_compute_running_processes_v3)(device, &mut count, buf.as_mut_ptr())
    };
    if rc != NVML_SUCCESS {
        return Vec::new();
    }
    let mut out = Vec::new();
    for info in buf.iter().take(count as usize) {
        let pid = info.pid as i64;
        if pid <= 0 {
            continue;
        }
        out.push(Proc {
            pid,
            name: proc_name(info.pid),
            mem: Some((info.used_gpu_memory / 1024 / 1024) as i64),
            gpu_uuid: Some(uuid.to_string()),
        });
    }
    out
}

fn basename(p: &str) -> String {
    p.rsplit(['/', '\\'])
        .next()
        .filter(|s| !s.is_empty())
        .unwrap_or(p)
        .to_string()
}

/// NVML reports PIDs only; resolve the name from /proc (Linux).
fn proc_name(pid: u32) -> String {
    if let Ok(comm) = std::fs::read_to_string(format!("/proc/{pid}/comm")) {
        let name = comm.trim();
        if !name.is_empty() {
            return name.to_string();
        }
    }
    if let Ok(cmd) = std::fs::read(format!("/proc/{pid}/cmdline")) {
        if let Some(first) = cmd.split(|&b| b == 0).next() {
            let s = String::from_utf8_lossy(first);
            if !s.is_empty() {
                return basename(&s);
            }
        }
    }
    format!("(pid {pid})")
}
