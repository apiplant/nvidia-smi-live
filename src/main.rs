//! nvidia-smi-live: live-updating nvidia-smi with a minimal terminal UI.

mod config;
mod export;
mod gpu;
mod nvml;
mod render;
mod term;
mod timefmt;

use std::time::{Duration, Instant};

const VERSION: &str = env!("CARGO_PKG_VERSION");

struct Opts {
    interval_ms: u64,
    filter: Option<String>,
    json: bool,
    watch_json: bool,
    prom: bool,
    version: bool,
    help: bool,
}

fn usage() -> String {
    format!(
        "nvidia-smi-live {VERSION}\n\
         \n\
         Live-updating nvidia-smi.\n\
         \n\
         USAGE:\n\
         \x20 nvidia-smi-live [OPTIONS]\n\
         \n\
         OPTIONS:\n\
         \x20 -i, --interval <ms>      refresh interval in milliseconds (default 1000, minimum 100)\n\
         \x20 -f, --filter <substr>    only show processes whose name contains <substr> (case-insensitive)\n\
         \x20     --json               print one GPU snapshot as JSON and exit\n\
         \x20     --watch-json         stream snapshots as NDJSON, one line per interval\n\
         \x20     --prom               print a Prometheus textfile snapshot and exit\n\
         \x20 -v, --version            print the version and exit\n\
         \x20 -h, --help               print this help and exit\n\
         \n\
         In the live view, press q to quit."
    )
}

fn parse_args(args: &[String]) -> Result<Opts, String> {
    let mut opts = Opts {
        interval_ms: 1000,
        filter: None,
        json: false,
        watch_json: false,
        prom: false,
        version: false,
        help: false,
    };
    let mut i = 0;
    while i < args.len() {
        let a = &args[i];
        match a.as_str() {
            "-h" | "--help" => opts.help = true,
            "-v" | "--version" | "version" => opts.version = true,
            "--json" => opts.json = true,
            "--watch-json" => opts.watch_json = true,
            "--prom" => opts.prom = true,
            "-i" | "--interval" => {
                i += 1;
                let v = args.get(i).ok_or("--interval needs a value")?;
                let n: u64 = v.parse().map_err(|_| format!("invalid interval: {v}"))?;
                if n < 100 {
                    return Err("interval must be >= 100".into());
                }
                opts.interval_ms = n;
            }
            "-f" | "--filter" => {
                i += 1;
                opts.filter = Some(args.get(i).ok_or("--filter needs a value")?.clone());
            }
            other => return Err(format!("unknown option: {other}\n\n{}", usage())),
        }
        i += 1;
    }
    Ok(opts)
}

fn run_tui(interval_ms: u64, filter: Option<String>) -> Result<(), String> {
    let nvml = nvml::Nvml::new()?;
    let term = term::Term::enter();
    let interval = Duration::from_millis(interval_ms);
    let mut showing_error = false;
    let (mut theme, mut unit, mut temp) = config::load();
    loop {
        match nvml.snapshot() {
            Ok(snap) => {
                if snap.gpus.is_empty() {
                    term.write_frame(&render::error_frame(
                        "No GPUs detected.",
                        term.cols,
                        theme,
                    ));
                } else {
                    term.write_frame(&render::render_frame(
                        &snap,
                        filter.as_deref(),
                        term.cols,
                        unit,
                        theme,
                        temp,
                    ));
                }
                showing_error = false;
            }
            Err(e) => {
                if !showing_error {
                    term.write_frame(&render::error_frame(&e, term.cols, theme));
                    showing_error = true;
                }
            }
        }
        // Wait out the interval, watching for keys.
        let deadline = Instant::now() + interval;
        loop {
            if Instant::now() >= deadline {
                break;
            }
            if let Some(key) = term.read_key() {
                if key == b'q' || key == b'Q' || key == 0x03 {
                    return Ok(());
                } else if key == b'u' || key == b'U' {
                    unit = unit.next();
                    config::save(theme, unit, temp);
                } else if key == b't' || key == b'T' {
                    theme = theme.next();
                    config::save(theme, unit, temp);
                } else if key == b'c' || key == b'C' {
                    temp = temp.next();
                    config::save(theme, unit, temp);
                }
            }
        }
    }
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let opts = match parse_args(&args) {
        Ok(o) => o,
        Err(e) => {
            eprintln!("{e}");
            std::process::exit(2);
        }
    };
    if opts.help {
        println!("{}", usage());
        return;
    }
    if opts.version {
        println!("nvidia-smi-live {VERSION}");
        return;
    }

    let result = if opts.json {
        export::run_json(opts.filter.as_deref())
    } else if opts.prom {
        export::run_prom()
    } else if opts.watch_json {
        export::run_watch_json(opts.interval_ms, opts.filter.as_deref())
    } else {
        run_tui(opts.interval_ms, opts.filter)
    };
    if let Err(e) = result {
        eprintln!("nvidia-smi-live: {e}");
        std::process::exit(1);
    }
}