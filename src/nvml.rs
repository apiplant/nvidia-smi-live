//! Data collection via NVML (NVIDIA Management Library), the C library that
//! backs nvidia-smi. We link against `libnvidia-ml` and query it directly
//! instead of parsing nvidia-smi stdout (whose format has changed before).
//!
//! Struct layouts below mirror `nvml.h` exactly (repr(C)).

use std::os::raw::c_void;
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

#[link(name = "nvidia-ml")]
extern "C" {
    fn nvmlInit_v2() -> u32;
    fn nvmlShutdown() -> u32;
    fn nvmlDeviceGetCount_v2(count: *mut u32) -> u32;
    fn nvmlDeviceGetHandleByIndex_v2(index: u32, device: *mut *mut c_void) -> u32;
    fn nvmlDeviceGetName(device: *mut c_void, name: *mut u8, length: u32) -> u32;
    fn nvmlDeviceGetUUID(device: *mut c_void, uuid: *mut u8, length: u32) -> u32;
    fn nvmlDeviceGetFanSpeed(device: *mut c_void, speed: *mut u32) -> u32;
    fn nvmlDeviceGetTemperature(device: *mut c_void, sensor: u32, temp: *mut u32) -> u32;
    fn nvmlDeviceGetPowerUsage(device: *mut c_void, mw: *mut u32) -> u32;
    fn nvmlDeviceGetPowerManagementLimit(device: *mut c_void, mw: *mut u32) -> u32;
    fn nvmlDeviceGetMemoryInfo(device: *mut c_void, mem: *mut NvmlMemory) -> u32;
    fn nvmlDeviceGetUtilizationRates(device: *mut c_void, util: *mut NvmlUtilization) -> u32;
    fn nvmlSystemGetDriverVersion(version: *mut u8, length: u32) -> u32;
    fn nvmlDeviceGetComputeRunningProcesses_v3(
        device: *mut c_void,
        count: *mut u32,
        info: *mut NvmlProcessInfo,
    ) -> u32;
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
/// init/shutdown lifecycle: `new()` initializes, `Drop` shuts down.
pub struct Nvml;

impl Nvml {
    pub fn new() -> Result<Nvml, String> {
        let rc = unsafe { nvmlInit_v2() };
        if rc != NVML_SUCCESS {
            return Err(format!("NVML init failed: {}", err_str(rc)));
        }
        Ok(Nvml)
    }

    /// Query every GPU and its running compute processes into a Snapshot.
    pub fn snapshot(&self) -> Result<Snapshot, String> {
        let count = unsafe {
            let mut c: u32 = 0;
            if nvmlDeviceGetCount_v2(&mut c) != NVML_SUCCESS {
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
        unsafe {
            nvmlShutdown();
        }
    }
}

fn device_handle(index: u32) -> Option<*mut c_void> {
    let mut h: *mut c_void = std::ptr::null_mut();
    if unsafe { nvmlDeviceGetHandleByIndex_v2(index, &mut h) } == NVML_SUCCESS {
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
    if unsafe { nvmlDeviceGetName(device, buf.as_mut_ptr(), buf.len() as u32) } == NVML_SUCCESS {
        cstr(&buf)
    } else {
        String::new()
    }
}

fn get_uuid(device: *mut c_void) -> String {
    let mut buf = [0u8; UUID_BUF];
    if unsafe { nvmlDeviceGetUUID(device, buf.as_mut_ptr(), buf.len() as u32) } == NVML_SUCCESS {
        cstr(&buf)
    } else {
        String::new()
    }
}

fn driver_version() -> String {
    let mut buf = [0u8; DRIVER_BUF];
    if unsafe { nvmlSystemGetDriverVersion(buf.as_mut_ptr(), buf.len() as u32) } == NVML_SUCCESS {
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
        match unsafe { nvmlDeviceGetFanSpeed(device, &mut s) } {
            NVML_SUCCESS => Some(s as i64),
            _ => None,
        }
    };
    let temp = {
        let mut t: u32 = 0;
        if unsafe { nvmlDeviceGetTemperature(device, NVML_TEMPERATURE_GPU, &mut t) }
            == NVML_SUCCESS
        {
            t as i64
        } else {
            0
        }
    };
    let power = {
        let mut mw: u32 = 0;
        if unsafe { nvmlDeviceGetPowerUsage(device, &mut mw) } == NVML_SUCCESS {
            mw as f64 / 1000.0
        } else {
            0.0
        }
    };
    let power_limit = {
        let mut mw: u32 = 0;
        if unsafe { nvmlDeviceGetPowerManagementLimit(device, &mut mw) } == NVML_SUCCESS {
            mw as f64 / 1000.0
        } else {
            0.0
        }
    };
    let (mem_used, mem_total) = {
        let mut m = NvmlMemory::default();
        if unsafe { nvmlDeviceGetMemoryInfo(device, &mut m) } == NVML_SUCCESS {
            // NVML reports bytes; the rest of the app uses MiB.
            ((m.used / 1024 / 1024) as i64, (m.total / 1024 / 1024) as i64)
        } else {
            (0, 0)
        }
    };
    let util = {
        let mut u = NvmlUtilization::default();
        if unsafe { nvmlDeviceGetUtilizationRates(device, &mut u) } == NVML_SUCCESS {
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
    let rc =
        unsafe { nvmlDeviceGetComputeRunningProcesses_v3(device, &mut count, buf.as_mut_ptr()) };
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