//! Terminal handling with no dependencies: raw mode via hand-rolled termios
//! FFI, terminal size via the TIOCGWINSZ ioctl, and frame output through std.

use std::io::{Read, Write};
use std::os::raw::c_int;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

#[cfg(target_os = "macos")]
const NCCS: usize = 20;
#[cfg(not(target_os = "macos"))]
const NCCS: usize = 32;

#[repr(C)]
#[derive(Clone, Copy, Default)]
struct Termios {
    c_iflag: u32,
    c_oflag: u32,
    c_cflag: u32,
    c_lflag: u32,
    c_line: u8,
    c_cc: [u8; NCCS],
    #[cfg(not(target_os = "macos"))]
    c_ispeed: u32,
    #[cfg(not(target_os = "macos"))]
    c_ospeed: u32,
}

#[repr(C)]
struct WinSize {
    row: u16,
    col: u16,
    xpixel: u16,
    ypixel: u16,
}

extern "C" {
    fn tcgetattr(fd: c_int, termios: *mut Termios) -> c_int;
    fn tcsetattr(fd: c_int, optional_actions: c_int, termios: *const Termios) -> c_int;
    fn ioctl(fd: c_int, request: u64, ...) -> c_int;
    fn signal(signum: c_int, handler: usize) -> usize;
    fn write(fd: c_int, buf: *const u8, n: usize) -> isize;
}

const ICANON: u32 = 0x02;
const ECHO: u32 = 0x08;
const TCSANOW: c_int = 0;
const VMIN: usize = 6;
const VTIME: usize = 5;

#[cfg(target_os = "macos")]
const TIOCGWINSZ: u64 = 0x2008;
#[cfg(not(target_os = "macos"))]
const TIOCGWINSZ: u64 = 0x5413;

/// Original termios, stored once when raw mode is entered and read back on
/// drop / signal. `OnceLock` is `Sync` and `get()` is lock-free, which matters
/// because the signal handler reads it.
static ORIG: std::sync::OnceLock<Termios> = std::sync::OnceLock::new();
static RAW: AtomicBool = AtomicBool::new(false);
/// Set by the SIGWINCH handler when the terminal is resized.
static RESIZED: AtomicBool = AtomicBool::new(true);

const SIGWINCH: c_int = 28;

extern "C" fn on_winch(_sig: c_int) {
    RESIZED.store(true, Ordering::Relaxed);
}

/// SIGINT/SIGTERM handler: restore the terminal and leave the alt screen.
/// Only async-signal-safe calls in here.
extern "C" fn on_signal(_sig: c_int) {
    if RAW.load(Ordering::Relaxed) {
        let orig = *ORIG.get().unwrap();
        unsafe { tcsetattr(0, TCSANOW, &orig); }
    }
    let leave: &[u8] = b"\x1b[?25l\x1b[?1049l";
    unsafe { write(1, leave.as_ptr(), leave.len()); }
    std::process::exit(0);
}

pub struct Term {
    raw: bool,
    pub cols: i64,
}

impl Term {
    /// Enter the alt screen, hide the cursor, and put stdin in raw mode.
    pub fn enter() -> Term {
        let mut raw = false;
        let mut orig = unsafe { std::mem::zeroed::<Termios>() };
        if unsafe { tcgetattr(0, &mut orig) } == 0 {
            let mut t = orig;
            t.c_lflag &= !(ICANON | ECHO);
            t.c_cc[VMIN] = 0;
            t.c_cc[VTIME] = 1; // 100ms read timeout
            if unsafe { tcsetattr(0, TCSANOW, &t) } == 0 {
                ORIG.get_or_init(|| orig);
                RAW.store(true, Ordering::Relaxed);
                let handler: extern "C" fn(c_int) = on_signal;
                unsafe {
                    signal(2, handler as usize);
                    signal(15, handler as usize);
                    let winch: extern "C" fn(c_int) = on_winch;
                    signal(SIGWINCH, winch as usize);
                }
                raw = true;
            }
        }
        if raw {
            let enter: &[u8] = b"\x1b[?1049h\x1b[2J\x1b[H\x1b[?25l";
            let mut out = std::io::stdout();
            let _ = out.write_all(enter);
            let _ = out.flush();
        }
        let cols = Self::winsize_cols();
        Term { raw, cols }
    }

    /// If a SIGWINCH arrived since the last call, re-read the terminal width
    /// and return `true` so the caller can redraw immediately.
    pub fn poll_resize(&mut self) -> bool {
        if RESIZED.swap(false, Ordering::Relaxed) {
            self.cols = Self::winsize_cols();
            true
        } else {
            false
        }
    }

    fn winsize_cols() -> i64 {
        let mut ws: WinSize = unsafe { std::mem::zeroed() };
        if unsafe { ioctl(1, TIOCGWINSZ, &mut ws as *mut WinSize as *mut u8) } == 0 {
            ws.col as i64
        } else {
            0
        }
    }

    /// Clear the whole screen (used after a resize to drop stale cells).
    pub fn clear(&self) {
        if self.raw {
            let mut out = std::io::stdout();
            let _ = out.write_all(b"\x1b[2J\x1b[H");
            let _ = out.flush();
        }
    }

    /// Move home, overwrite, and clear to end of screen.
    pub fn write_frame(&self, frame: &str) {
        if !self.raw {
            return;
        }
        let mut out = std::io::stdout();
        let _ = out.write_all(b"\x1b[H");
        let _ = out.write_all(frame.as_bytes());
        let _ = out.write_all(b"\x1b[J");
        let _ = out.flush();
    }

    /// Read one key byte; blocks at most ~100ms and returns None on timeout.
    pub fn read_key(&self) -> Option<u8> {
        if !self.raw {
            std::thread::sleep(Duration::from_millis(100));
            return None;
        }
        let mut buf = [0u8; 16];
        let n = std::io::stdin().read(&mut buf).unwrap_or(0);
        if n == 0 {
            return None;
        }
        Some(buf[0])
    }
}

impl Drop for Term {
    fn drop(&mut self) {
        if self.raw {
            let orig = *ORIG.get().unwrap();
            unsafe { tcsetattr(0, TCSANOW, &orig); }
            RAW.store(false, Ordering::Relaxed);
            let leave: &[u8] = b"\x1b[?25l\x1b[?1049l";
            let mut out = std::io::stdout();
            let _ = out.write_all(leave);
            let _ = out.flush();
        }
    }
}