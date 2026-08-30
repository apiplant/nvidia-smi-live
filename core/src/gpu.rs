//! Data model shared across the app. Collection lives in `nvml.rs`.

#[derive(Clone, Debug)]
pub struct Gpu {
    pub index: i64,
    pub uuid: String,
    pub name: String,
    pub fan: Option<i64>,
    pub temp: i64,
    pub power: f64,
    pub power_limit: f64,
    pub mem_used: i64,
    pub mem_total: i64,
    pub util: i64,
    pub driver: String,
}

#[derive(Clone, Debug)]
pub struct Proc {
    pub pid: i64,
    pub name: String,
    pub mem: Option<i64>,
    pub gpu_uuid: Option<String>,
}

#[derive(Clone, Debug)]
pub struct Snapshot {
    pub gpus: Vec<Gpu>,
    pub procs: Vec<Proc>,
    pub timestamp: i64,
}

/// Processes belonging to a given GPU. If processes carry no UUID (older
/// drivers, or single-GPU boxes) we fall back to showing all of them.
pub fn procs_for_gpu<'a>(procs: &'a [Proc], gpu: &Gpu, total_gpus: usize) -> Vec<&'a Proc> {
    let any_tagged = procs.iter().any(|p| p.gpu_uuid.is_some());
    if !any_tagged || total_gpus <= 1 {
        return procs.iter().collect();
    }
    procs.iter()
        .filter(|p| p.gpu_uuid.as_deref() == Some(gpu.uuid.as_str()))
        .collect()
}