//! Persistence for the (theme, unit) preference in the XDG config directory.
//! The file is a single line: `theme,unit` (e.g. `Catppuccin,GiB`).

use std::path::PathBuf;

use crate::render::{MemUnit, TempUnit, Theme};

/// Path to the config file: `$XDG_CONFIG_HOME/nvidia-smi-live`,
/// falling back to `~/.config/nvidia-smi-live`.
pub fn path() -> PathBuf {
    let base = std::env::var("XDG_CONFIG_HOME")
        .ok()
        .filter(|s| !s.is_empty())
        .map(PathBuf::from)
        .or_else(home_config_dir)
        .unwrap_or_else(|| PathBuf::from(".config"));
    base.join("nvidia-smi-live")
}

fn home_config_dir() -> Option<PathBuf> {
    std::env::var("HOME")
        .ok()
        .filter(|s| !s.is_empty())
        .map(|h| PathBuf::from(h).join(".config"))
}

/// Load the persisted (theme, unit, temp). Falls back to (Catppuccin, GiB, C).
pub fn load() -> (Theme, MemUnit, TempUnit) {
    const DEFAULT: (Theme, MemUnit, TempUnit) =
        (Theme::Catppuccin, MemUnit::Gib, TempUnit::Celsius);
    let Ok(content) = std::fs::read_to_string(path()) else {
        return DEFAULT;
    };
    let line = content.lines().next().unwrap_or("");
    let mut parts = line.split(',');
    let theme = theme_from_str(parts.next().unwrap_or("")).unwrap_or(DEFAULT.0);
    let unit = unit_from_str(parts.next().unwrap_or("")).unwrap_or(DEFAULT.1);
    let temp = temp_from_str(parts.next().unwrap_or("")).unwrap_or(DEFAULT.2);
    (theme, unit, temp)
}

/// Persist the (theme, unit, temp) as a single `theme,unit,temp` line.
pub fn save(theme: Theme, unit: MemUnit, temp: TempUnit) {
    let p = path();
    if let Some(parent) = p.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let _ = std::fs::write(
        &p,
        format!("{},{},{}\n", theme.label(), unit.label(), temp.label()),
    );
}

fn theme_from_str(s: &str) -> Option<Theme> {
    match s {
        "Catppuccin" => Some(Theme::Catppuccin),
        "Dracula" => Some(Theme::Dracula),
        "Nord" => Some(Theme::Nord),
        "Gruvbox" => Some(Theme::Gruvbox),
        _ => None,
    }
}

fn unit_from_str(s: &str) -> Option<MemUnit> {
    match s {
        "MiB" => Some(MemUnit::Mib),
        "GiB" => Some(MemUnit::Gib),
        "TiB" => Some(MemUnit::Tib),
        _ => None,
    }
}

fn temp_from_str(s: &str) -> Option<TempUnit> {
    match s {
        "C" => Some(TempUnit::Celsius),
        "F" => Some(TempUnit::Fahrenheit),
        _ => None,
    }
}