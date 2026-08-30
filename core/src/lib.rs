//! Shared core for nvidia-smi-live: the data model (`gpu`), NVML data
//! collection (`nvml`), non-interactive export formats (`export`), and the
//! nvidia-smi-style timestamp line (`timefmt`).
//!
//! Both the terminal UI (`nvidia-smi-live`) and the web server
//! (`nvidia-smi-live-web`) build on this crate.

pub mod export;
pub mod gpu;
pub mod nvml;
pub mod timefmt;
