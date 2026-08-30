//! Non-interactive export modes: one-shot JSON, Prometheus textfile, and
//! streaming NDJSON.

use std::time::Duration;

use crate::gpu::{self, Gpu, Proc, Snapshot};
use crate::nvml;

fn json_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out
}

fn pct1(used: f64, total: f64) -> String {
    if total > 0.0 {
        format!("{:.1}", used / total * 100.0)
    } else {
        "0.0".into()
    }
}

fn filtered<'a>(procs: &[&'a Proc], filter: Option<&str>) -> Vec<&'a Proc> {
    let mut out = Vec::new();
    for p in procs {
        if let Some(f) = filter {
            if !p.name.to_lowercase().contains(&f.to_lowercase()) {
                continue;
            }
        }
        out.push(*p);
    }
    out
}

pub fn snapshot_to_json(snap: &Snapshot, filter: Option<&str>) -> String {
    let mut out = String::new();
    out.push_str("{\n");
    out.push_str(&format!("  \"timestamp\": {},\n", snap.timestamp));
    out.push_str(&format!("  \"gpuCount\": {},\n", snap.gpus.len()));
    out.push_str("  \"gpus\": [\n");
    for (i, g) in snap.gpus.iter().enumerate() {
        let procs = filtered(&gpu::procs_for_gpu(&snap.procs, g, snap.gpus.len()), filter);
        out.push_str("    {\n");
        out.push_str(&format!("      \"index\": {},\n", g.index));
        out.push_str(&format!("      \"uuid\": \"{}\",\n", json_escape(&g.uuid)));
        out.push_str(&format!("      \"name\": \"{}\",\n", json_escape(&g.name)));
        out.push_str(&format!("      \"utilizationGpu\": {},\n", g.util));
        out.push_str(&format!("      \"memoryUsedMb\": {},\n", g.mem_used));
        out.push_str(&format!("      \"memoryTotalMb\": {},\n", g.mem_total));
        out.push_str(&format!(
            "      \"memoryPercent\": {},\n",
            pct1(g.mem_used as f64, g.mem_total as f64)
        ));
        out.push_str(&format!("      \"temperatureC\": {},\n", g.temp));
        out.push_str(&format!("      \"powerDrawW\": {},\n", g.power));
        out.push_str(&format!("      \"powerLimitW\": {},\n", g.power_limit));
        out.push_str(&format!(
            "      \"powerPercent\": {},\n",
            pct1(g.power, g.power_limit)
        ));
        out.push_str(&format!(
            "      \"fanSpeedPct\": {},\n",
            g.fan.unwrap_or(0)
        ));
        out.push_str(&format!(
            "      \"driver\": \"{}\",\n",
            json_escape(&g.driver)
        ));
        out.push_str("      \"processes\": [\n");
        for (j, p) in procs.iter().enumerate() {
            out.push_str("        {\n");
            out.push_str(&format!("          \"pid\": {},\n", p.pid));
            out.push_str(&format!("          \"name\": \"{}\",\n", json_escape(&p.name)));
            out.push_str(&format!(
                "          \"memoryUsedMb\": {}\n",
                p.mem.map(|m| m.to_string()).unwrap_or_else(|| "null".into())
            ));
            out.push_str(if j + 1 < procs.len() { "        },\n" } else { "        }\n" });
        }
        out.push_str("      ]\n");
        out.push_str(if i + 1 < snap.gpus.len() { "    },\n" } else { "    }\n" });
    }
    out.push_str("  ]\n");
    out.push('}');
    out
}

pub fn snapshot_to_prom(snap: &Snapshot) -> String {
    type Metric<'a> = (&'a str, &'a str, fn(&'a Gpu) -> f64);
    let metrics: [Metric<'_>; 7] = [
        ("gpu_utilization_percent", "GPU compute utilization (percent).", |g| g.util as f64),
        ("gpu_memory_used_bytes", "VRAM used (bytes).", |g| g.mem_used as f64 * 1024.0 * 1024.0),
        (
            "gpu_memory_total_bytes",
            "VRAM total (bytes).",
            |g| g.mem_total as f64 * 1024.0 * 1024.0,
        ),
        ("gpu_temperature_celsius", "GPU core temperature (Celsius).", |g| g.temp as f64),
        ("gpu_power_watts", "GPU power draw (watts).", |g| g.power),
        ("gpu_power_limit_watts", "GPU power limit (watts).", |g| g.power_limit),
        (
            "gpu_fan_speed_percent",
            "GPU fan speed (percent).",
            |g| g.fan.map(|f| f as f64).unwrap_or(0.0),
        ),
    ];
    let mut out = String::new();
    for (name, help, f) in &metrics {
        out.push_str(&format!("# HELP {name} {help}\n"));
        out.push_str(&format!("# TYPE {name} gauge\n"));
        for g in &snap.gpus {
            out.push_str(&format!(
                "{}{{gpu=\"{}\",uuid=\"{}\",name=\"{}\"}} {}\n",
                name,
                g.index,
                json_escape(&g.uuid),
                json_escape(&g.name),
                f(g)
            ));
        }
    }
    out
}

pub fn run_json(filter: Option<&str>) -> Result<(), String> {
    let nvml = nvml::Nvml::new()?;
    let snap = nvml.snapshot()?;
    println!("{}", snapshot_to_json(&snap, filter));
    Ok(())
}

pub fn run_prom() -> Result<(), String> {
    let nvml = nvml::Nvml::new()?;
    let snap = nvml.snapshot()?;
    print!("{}", snapshot_to_prom(&snap));
    Ok(())
}

pub fn run_watch_json(interval_ms: u64, filter: Option<&str>) -> Result<(), String> {
    let nvml = nvml::Nvml::new()?;
    loop {
        match nvml.snapshot() {
            Ok(snap) => println!("{}", snapshot_to_json(&snap, filter)),
            Err(e) => eprintln!("nvidia-smi-live: {e}"),
        }
        std::thread::sleep(Duration::from_millis(interval_ms));
    }
}