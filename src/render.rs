//! Frame rendering: per-GPU bar panels and a process table, with a switchable
//! color theme and a footer status line (driver info + current date/time).

use crate::gpu::Snapshot;
use crate::timefmt;

mod color {
    pub fn fg(r: u8, g: u8, b: u8) -> String { format!("\x1b[38;2;{r};{g};{b}m") }
    pub fn bg(r: u8, g: u8, b: u8) -> String { format!("\x1b[48;2;{r};{g};{b}m") }
    pub const RESET: &str = "\x1b[0m";
}

/// A full color palette for one theme.
#[derive(Clone, Copy)]
pub struct Palette {
    pub surface: (u8, u8, u8),
    pub border: (u8, u8, u8),
    pub border_hi: (u8, u8, u8),
    pub text: (u8, u8, u8),
    pub bright: (u8, u8, u8),
    pub dim: (u8, u8, u8),
    pub accent: (u8, u8, u8),
    pub cyan: (u8, u8, u8),
    pub green: (u8, u8, u8),
    pub yellow: (u8, u8, u8),
    pub red: (u8, u8, u8),
}

/// Available themes. Toggle with `t` in the live view.
#[derive(Clone, Copy, PartialEq)]
pub enum Theme {
    Catppuccin,
    Dracula,
    Nord,
    Gruvbox,
}

impl Theme {
    pub fn next(self) -> Theme {
        match self {
            Theme::Catppuccin => Theme::Dracula,
            Theme::Dracula => Theme::Nord,
            Theme::Nord => Theme::Gruvbox,
            Theme::Gruvbox => Theme::Catppuccin,
        }
    }
    pub fn label(self) -> &'static str {
        match self {
            Theme::Catppuccin => "Catppuccin",
            Theme::Dracula => "Dracula",
            Theme::Nord => "Nord",
            Theme::Gruvbox => "Gruvbox",
        }
    }
    pub fn palette(self) -> Palette {
        match self {
            Theme::Catppuccin => Palette {
                surface: (30, 33, 54),
                border: (88, 98, 140),
                border_hi: (137, 180, 250),
                text: (205, 214, 244),
                bright: (240, 244, 255),
                dim: (108, 112, 134),
                accent: (137, 180, 250),
                cyan: (148, 226, 213),
                green: (166, 227, 161),
                yellow: (249, 226, 175),
                red: (243, 139, 168),
            },
            Theme::Dracula => Palette {
                surface: (40, 42, 54),
                border: (88, 91, 112),
                border_hi: (189, 147, 249),
                text: (248, 248, 242),
                bright: (255, 255, 255),
                dim: (85, 88, 111),
                accent: (189, 147, 249),
                cyan: (88, 190, 255),
                green: (80, 250, 123),
                yellow: (255, 184, 108),
                red: (255, 85, 104),
            },
            Theme::Nord => Palette {
                surface: (46, 52, 64),
                border: (66, 74, 89),
                border_hi: (136, 192, 208),
                text: (216, 222, 233),
                bright: (229, 233, 245),
                dim: (76, 86, 106),
                accent: (136, 192, 208),
                cyan: (176, 215, 224),
                green: (133, 169, 120),
                yellow: (220, 177, 74),
                red: (191, 97, 106),
            },
            Theme::Gruvbox => Palette {
                surface: (40, 40, 40),
                border: (60, 56, 54),
                border_hi: (250, 189, 47),
                text: (211, 211, 211),
                bright: (250, 234, 217),
                dim: (102, 92, 84),
                accent: (250, 189, 47),
                cyan: (132, 204, 220),
                green: (131, 198, 63),
                yellow: (249, 226, 175),
                red: (204, 36, 29),
            },
        }
    }
}

/// Memory display unit. Toggle with `u` in the live view.
#[derive(Clone, Copy, PartialEq)]
pub enum MemUnit {
    Mib,
    Gib,
    Tib,
}

impl MemUnit {
    pub fn next(self) -> MemUnit {
        match self {
            MemUnit::Mib => MemUnit::Gib,
            MemUnit::Gib => MemUnit::Tib,
            MemUnit::Tib => MemUnit::Mib,
        }
    }
    pub fn label(self) -> &'static str {
        match self {
            MemUnit::Mib => "MiB",
            MemUnit::Gib => "GiB",
            MemUnit::Tib => "TiB",
        }
    }
}

/// Temperature display unit. Toggle with `c` in the live view.
#[derive(Clone, Copy, PartialEq)]
pub enum TempUnit {
    Celsius,
    Fahrenheit,
}

impl TempUnit {
    pub fn next(self) -> TempUnit {
        match self {
            TempUnit::Celsius => TempUnit::Fahrenheit,
            TempUnit::Fahrenheit => TempUnit::Celsius,
        }
    }
    pub fn label(self) -> &'static str {
        match self {
            TempUnit::Celsius => "C",
            TempUnit::Fahrenheit => "F",
        }
    }
}

const W: usize = 91; // total frame width, same as nvidia-smi

fn repeat(c: char, n: usize) -> String {
    c.to_string().repeat(n)
}

fn pad(s: &str, w: usize) -> String {
    let n = s.chars().count();
    if n >= w {
        s.to_string()
    } else {
        format!("{s}{}", " ".repeat(w - n))
    }
}

fn trunc(s: &str, w: usize) -> String {
    s.chars().take(w).collect()
}

fn fg(c: (u8, u8, u8)) -> String {
    color::fg(c.0, c.1, c.2)
}

/// Count visible characters, skipping ANSI escape sequences.
fn visible_len(s: &str) -> usize {
    let mut n = 0;
    let mut it = s.chars().peekable();
    while let Some(c) = it.next() {
        if c == '\x1b' {
            while let Some(&nc) = it.peek() {
                it.next();
                if nc == 'm' {
                    break;
                }
            }
        } else {
            n += 1;
        }
    }
    n
}

/// Pad a (possibly colored) string to a visible width.
fn pad_visible(s: &str, w: usize) -> String {
    let n = visible_len(s);
    if n >= w {
        s.to_string()
    } else {
        format!("{s}{}", " ".repeat(w - n))
    }
}

/// Wrap a line in the theme's surface background.
fn with_bg(line: impl AsRef<str>, p: &Palette) -> String {
    let (r, g, b) = p.surface;
    format!("{}{}{}", color::bg(r, g, b), line.as_ref(), color::RESET)
}

fn sev_pct(pct: f64, p: &Palette) -> (u8, u8, u8) {
    if pct >= 85.0 {
        p.red
    } else if pct >= 60.0 {
        p.yellow
    } else {
        p.green
    }
}
fn sev_temp(t: f64, p: &Palette) -> (u8, u8, u8) {
    if t >= 80.0 {
        p.red
    } else if t >= 70.0 {
        p.yellow
    } else {
        p.green
    }
}

// --- memory formatting (values are stored in MiB) ---
fn fmt_mem(mib: i64, unit: MemUnit) -> String {
    match unit {
        MemUnit::Mib => format!("{mib} MiB"),
        MemUnit::Gib => format!("{:.1} GiB", mib as f64 / 1024.0),
        MemUnit::Tib => format!("{:.2} TiB", mib as f64 / 1024.0 / 1024.0),
    }
}
fn fmt_mem_range(used: i64, total: i64, unit: MemUnit) -> String {
    match unit {
        MemUnit::Mib => format!("{used}/{total} MiB"),
        MemUnit::Gib => format!(
            "{:.1}/{:.1} GiB",
            used as f64 / 1024.0,
            total as f64 / 1024.0
        ),
        MemUnit::Tib => format!(
            "{:.2}/{:.2} TiB",
            used as f64 / 1024.0 / 1024.0,
            total as f64 / 1024.0 / 1024.0
        ),
    }
}
/// Format a Celsius temperature in the requested unit.
fn fmt_temp(c: i64, unit: TempUnit) -> String {
    match unit {
        TempUnit::Celsius => format!("{}°C", c),
        TempUnit::Fahrenheit => format!("{}°F", (c as f64 * 9.0 / 5.0 + 32.0).round() as i64),
    }
}

// --- wide box lines ---
fn wide_top(p: &Palette) -> String {
    with_bg(format!("{}┌{}┐", fg(p.border_hi), repeat('─', W - 2)), p)
}
fn wide_eq(p: &Palette) -> String {
    with_bg(format!("{}├{}┤", fg(p.border), repeat('═', W - 2)), p)
}
fn wide_bot(p: &Palette) -> String {
    with_bg(format!("{}└{}┘", fg(p.border_hi), repeat('─', W - 2)), p)
}
/// Wide content row; `inner` may contain inline colors, padded to W-2.
fn wide_row(inner: &str, p: &Palette) -> String {
    let b = fg(p.border);
    with_bg(format!("{}│{}{}│", b, pad_visible(inner, W - 2), b), p)
}

fn bar_chars(pct: f64, w: usize) -> (String, String) {
    let clamped = pct.clamp(0.0, 100.0);
    let filled = ((clamped / 100.0) * w as f64).round() as usize;
    let filled = filled.min(w);
    ("█".repeat(filled), "░".repeat(w - filled))
}

type BarRow<'a> = (&'a str, f64, (u8, u8, u8), String);

/// The bar panel for one GPU: utilization, VRAM, temperature, power, fan.
fn bar_box(g: &crate::gpu::Gpu, box_w: usize, unit: MemUnit, temp: TempUnit, p: &Palette) -> Vec<String> {
    let inner = box_w - 2;
    let bar_w = (box_w - 43).max(10);
    let mut out = Vec::new();
    let bhi = fg(p.border_hi);
    out.push(with_bg(format!("{}┌{}┐", bhi, repeat('─', inner)), p));
    out.push(with_bg(
        format!(
            "{}│ {}{}{} │",
            fg(p.border),
            fg(p.accent),
            pad(&format!("GPU {}  {}", g.index, g.name), inner - 2),
            fg(p.border)
        ),
        p,
    ));

    let mem_pct = if g.mem_total > 0 {
        g.mem_used as f64 / g.mem_total as f64 * 100.0
    } else {
        0.0
    };
    let pwr_pct = if g.power_limit > 0.0 {
        g.power / g.power_limit * 100.0
    } else {
        0.0
    };
    let fan_pct = g.fan.unwrap_or(0) as f64;
    let fan_value = g
        .fan
        .map(|f| format!("{f}%"))
        .unwrap_or_else(|| "N/A".into());

    let bars: [BarRow<'_>; 5] = [
        (
            "GPU Utilization",
            g.util as f64,
            sev_pct(g.util as f64, p),
            format!("{}%", g.util),
        ),
        (
            "VRAM",
            mem_pct,
            sev_pct(mem_pct, p),
            fmt_mem_range(g.mem_used, g.mem_total, unit),
        ),
        (
            "Temp",
            g.temp as f64,
            sev_temp(g.temp as f64, p),
            fmt_temp(g.temp, temp),
        ),
        (
            "Power",
            pwr_pct,
            sev_pct(pwr_pct, p),
            format!(
                "{}/{} W",
                g.power.round() as i64,
                g.power_limit.round() as i64
            ),
        ),
        ("Fan", fan_pct, p.cyan, fan_value),
    ];
    for (label, pct, sev, value) in &bars {
        let (filled, empty) = bar_chars(*pct, bar_w);
        let value_str = format!("{:>17}", value);
        let row = format!(
            "{}│ {}{}  [{}{}{}{}]  {}{}{} │",
            fg(p.border),
            fg(p.dim),
            pad(label, 16),
            fg(*sev),
            filled,
            fg(p.dim),
            empty,
            fg(*sev),
            value_str,
            fg(p.border)
        );
        out.push(with_bg(&row, p));
    }
    out.push(with_bg(format!("{}└{}┘", bhi, repeat('─', inner)), p));
    out
}

/// The process table, laid out like nvidia-smi's.
fn proc_table(snap: &Snapshot, filter: Option<&str>, unit: MemUnit, p: &Palette) -> Vec<String> {
    let mut out = Vec::new();
    out.push(wide_top(p));
    out.push(wide_row(&format!("{} Processes:", fg(p.accent)), p));
    let dim = fg(p.dim);
    out.push(wide_row(
        &format!(
            "{}  GPU   GI   CI              PID   Type   Process name                        GPU Memory ",
            dim
        ),
        p,
    ));
    out.push(wide_eq(p));
    for pr in &snap.procs {
        if let Some(f) = filter {
            if !pr.name.to_lowercase().contains(&f.to_lowercase()) {
                continue;
            }
        }
        let idx = snap
            .gpus
            .iter()
            .position(|g| g.uuid == pr.gpu_uuid.as_deref().unwrap_or(""))
            .unwrap_or(0);
        let mem = pr
            .mem
            .map(|m| fmt_mem(m, unit))
            .unwrap_or_else(|| "N/A".into());
        let mem_w = mem.chars().count();
        let name_w = (44 - mem_w).max(1);
        let row = format!(
            "{}│{}{:>5}{}{:>6}{}{:>5}{}{:>16}{}{:>7}{}   {}  {}{}{} │",
            fg(p.border),
            fg(p.accent),
            idx,
            fg(p.dim),
            "N/A",
            fg(p.dim),
            "N/A",
            fg(p.bright),
            pr.pid,
            fg(p.dim),
            "N/A",
            fg(p.text),
            pad(&trunc(&pr.name, name_w), name_w),
            fg(p.cyan),
            mem,
            fg(p.border)
        );
        out.push(with_bg(&row, p));
    }
    out.push(wide_bot(p));
    out
}

fn push_lines(out: &mut String, lines: &[String]) {
    for l in lines {
        out.push_str(l);
        out.push('\n');
    }
}

fn hint_line(unit: MemUnit, theme: Theme, temp: TempUnit, p: &Palette) -> String {
    let line = format!(
        "  u: memory (now {})   t: theme (now {})   c: temp (now {})   q: quit",
        unit.label(),
        theme.label(),
        temp.label()
    );
    format!("{}{}", fg(p.dim), pad_visible(&line, W))
}

/// Footer status line: driver info on the left, current date/time on the right.
fn footer_line(driver: &str, p: &Palette) -> String {
    let ts = timefmt::timestamp_line();
    let left = format!(
        "{}NVIDIA-SMI {}  {}KMD Version: {}",
        fg(p.accent),
        driver,
        fg(p.dim),
        driver
    );
    let right = format!("{}{}", fg(p.cyan), ts);
    let l = visible_len(&left);
    let r = visible_len(&right);
    let gap = if l + r <= W {
        " ".repeat(W - l - r)
    } else {
        String::new()
    };
    format!("{}{}{}{}", left, gap, right, color::RESET)
}

pub fn render_frame(
    snap: &Snapshot,
    filter: Option<&str>,
    cols: i64,
    unit: MemUnit,
    theme: Theme,
    temp: TempUnit,
) -> String {
    let p = theme.palette();
    let mut out = String::new();
    let box_w = if (60..W as i64).contains(&cols) {
        cols as usize
    } else {
        W
    };
    for g in &snap.gpus {
        push_lines(&mut out, &bar_box(g, box_w, unit, temp, &p));
        out.push('\n');
    }
    push_lines(&mut out, &proc_table(snap, filter, unit, &p));
    out.push('\n');
    out.push_str(&hint_line(unit, theme, temp, &p));
    out.push('\n');
    let driver = snap
        .gpus
        .first()
        .map(|g| g.driver.clone())
        .unwrap_or_default();
    out.push_str(&footer_line(&driver, &p));
    out
}

pub fn error_frame(msg: &str, _cols: i64, theme: Theme) -> String {
    let p = theme.palette();
    let w = W;
    let mut out = String::new();
    out.push_str(&format!(
        "{}{}\n",
        fg(p.cyan),
        timefmt::timestamp_line()
    ));
    let bhi = fg(p.border_hi);
    out.push_str(&with_bg(format!("{}┌{}┐", bhi, repeat('─', w - 2)), &p));
    out.push('\n');
    out.push_str(&with_bg(
        format!(
            "{}│ {}{}{} │",
            fg(p.border),
            fg(p.red),
            pad(&trunc(&format!("error: {msg}"), w - 4), w - 4),
            fg(p.border)
        ),
        &p,
    ));
    out.push('\n');
    out.push_str(&with_bg(
        format!(
            "{}│ {}{}{} │",
            fg(p.border),
            fg(p.dim),
            pad("q to quit", w - 4),
            fg(p.border)
        ),
        &p,
    ));
    out.push('\n');
    out.push_str(&with_bg(format!("{}└{}┘", bhi, repeat('─', w - 2)), &p));
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frame_widths() {
        let p = Theme::Catppuccin.palette();
        assert_eq!(visible_len(&wide_top(&p)), W);
        assert_eq!(visible_len(&wide_eq(&p)), W);
        assert_eq!(visible_len(&wide_bot(&p)), W);

        // Process table header row
        assert_eq!(
            "  GPU   GI   CI              PID   Type   Process name                        GPU Memory "
                .chars()
                .count(),
            W - 2
        );

        // Process table data row
        let mem = "23722MiB";
        let mem_w = mem.chars().count();
        let name_w = 44 - mem_w;
        assert_eq!(
            format!(
                "│{:>5}{:>6}{:>5}{:>16}{:>7}   {:<name_w$}  {:>mem_w$} │",
                0, "N/A", "N/A", 0, "N/A", "n", mem,
                name_w = name_w, mem_w = mem_w
            )
            .chars()
            .count(),
            W
        );

        // Bar box rows (label field is 16 wide; bar_w = box_w - 43)
        let box_w = W;
        let bar_w = box_w - 43;
        assert_eq!(
            format!(
                "│ {}  [{}]  {} │",
                pad("GPU Utilization", 16),
                "█".repeat(bar_w),
                format!("{:>17}", "v")
            )
            .chars()
            .count(),
            box_w
        );
    }
}