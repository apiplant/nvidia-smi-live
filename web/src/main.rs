use ntex::web::{self, App, HttpResponse, HttpServer};
use std::fmt;
use std::sync::{Mutex, OnceLock};

use nvidia_smi_live_core::{export, nvml};

const DEFAULT_PORT: u16 = 7680;
/// Loopback by default: the monitor shows local GPU state, so it is only
/// reachable from the machine itself unless `--host` says otherwise.
const DEFAULT_HOST: &str = "127.0.0.1";

/// One NVML handle shared by all workers. NVML init is process-global, so we
/// initialize once and serialize snapshot calls (each takes a few ms).
static NVML: OnceLock<Mutex<nvml::Nvml>> = OnceLock::new();

fn snapshot_json() -> Result<String, String> {
    let guard = NVML.get_or_init(|| {
        Mutex::new(nvml::Nvml::new().expect("NVML init failed at startup"))
    });
    let nvml = guard.lock().unwrap_or_else(|p| p.into_inner());
    let snap = nvml.snapshot()?;
    Ok(export::snapshot_to_json(&snap, None))
}

#[derive(Debug, PartialEq, Eq)]
enum Args {
    Run { host: String, port: u16 },
    Version,
}

#[derive(Debug, PartialEq, Eq)]
enum ArgsError {
    Help,
    MissingPortValue,
    MissingHostValue,
    InvalidPort(String),
    EmptyHost,
    UnexpectedArgument(String),
}

impl fmt::Display for ArgsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ArgsError::Help => write!(f, "help requested"),
            ArgsError::MissingPortValue => write!(f, "missing value for -p/--port"),
            ArgsError::MissingHostValue => write!(f, "missing value for --host"),
            ArgsError::InvalidPort(value) => {
                write!(f, "invalid port '{value}': expected a number from 1 to 65535")
            }
            ArgsError::EmptyHost => write!(f, "--host must not be empty"),
            ArgsError::UnexpectedArgument(arg) => write!(f, "unexpected argument '{arg}'"),
        }
    }
}

fn parse_port(value: &str) -> Result<u16, ArgsError> {
    let port = value
        .parse::<u16>()
        .map_err(|_| ArgsError::InvalidPort(value.to_string()))?;
    if port == 0 {
        return Err(ArgsError::InvalidPort(value.to_string()));
    }
    Ok(port)
}

fn parse_args<I>(args: I) -> Result<Args, ArgsError>
where
    I: IntoIterator<Item = String>,
{
    let mut host = DEFAULT_HOST.to_string();
    let mut port = DEFAULT_PORT;
    let mut args = args.into_iter();

    while let Some(arg) = args.next() {
        match arg.as_str() {
            "version" | "--version" | "-V" => return Ok(Args::Version),
            "--help" | "-h" => return Err(ArgsError::Help),
            "-p" | "--port" => {
                let value = args.next().ok_or(ArgsError::MissingPortValue)?;
                port = parse_port(&value)?;
            }
            "--host" => {
                let value = args.next().ok_or(ArgsError::MissingHostValue)?;
                if value.is_empty() {
                    return Err(ArgsError::EmptyHost);
                }
                host = value;
            }
            _ => {
                if let Some(value) = arg.strip_prefix("--port=") {
                    port = parse_port(value)?;
                } else if let Some(value) = arg.strip_prefix("--host=") {
                    if value.is_empty() {
                        return Err(ArgsError::EmptyHost);
                    }
                    host = value.to_string();
                } else {
                    return Err(ArgsError::UnexpectedArgument(arg));
                }
            }
        }
    }

    Ok(Args::Run { host, port })
}

fn print_usage() {
    eprintln!("Usage: nvidia-smi-live-web [-p PORT] [--host HOST]");
    eprintln!("       nvidia-smi-live-web version");
    eprintln!("");
    eprintln!("  -p, --port PORT   port to bind (default {DEFAULT_PORT})");
    eprintln!("  --host HOST       interface to bind (default {DEFAULT_HOST}, loopback);");
    eprintln!("                    use 0.0.0.0 to expose the monitor on the network");
}

async fn api_snapshot() -> HttpResponse {
    match snapshot_json() {
        Ok(json) => HttpResponse::Ok()
            .content_type("application/json; charset=utf-8")
            .body(json),
        Err(e) => HttpResponse::InternalServerError().json(&serde_json::json!({
            "error": e,
        })),
    }
}

async fn index() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(include_str!("../static/index.html"))
}

async fn favicon() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("image/svg+xml")
        .body(include_str!("../static/favicon.svg"))
}

macro_rules! vendor_route {
    ($fn_name:ident, $file:literal) => {
        async fn $fn_name() -> HttpResponse {
            HttpResponse::Ok()
                .content_type("text/javascript; charset=utf-8")
                .body(include_str!($file))
        }
    };
}

// solid-js.mjs, web.mjs and the signals/ tree import each other by relative
// path, so they must be served under those exact names from the same
// directory to share a single reactive core instance.
vendor_route!(vendor_solid_js, "../static/vendor/solid-js.mjs");
vendor_route!(vendor_web, "../static/vendor/web.mjs");
vendor_route!(vendor_html, "../static/vendor/html.mjs");
vendor_route!(vendor_tailwind, "../static/vendor/tailwind.js");
vendor_route!(vendor_seroval, "../static/vendor/seroval.mjs");
vendor_route!(vendor_seroval_plugins_web, "../static/vendor/seroval-plugins-web.mjs");

macro_rules! signals_route {
    ($fn_name:ident, $rel:literal) => {
        vendor_route!($fn_name, $rel);
    };
}

signals_route!(sig_index, "../static/vendor/signals/index.js");
signals_route!(sig_affects, "../static/vendor/signals/affects.js");
signals_route!(sig_boundaries, "../static/vendor/signals/boundaries.js");
signals_route!(sig_map, "../static/vendor/signals/map.js");
signals_route!(sig_signals, "../static/vendor/signals/signals.js");
signals_route!(sig_core_action, "../static/vendor/signals/core/action.js");
signals_route!(sig_core_async, "../static/vendor/signals/core/async.js");
signals_route!(sig_core_constants, "../static/vendor/signals/core/constants.js");
signals_route!(sig_core_context, "../static/vendor/signals/core/context.js");
signals_route!(sig_core_core, "../static/vendor/signals/core/core.js");
signals_route!(sig_core_dev, "../static/vendor/signals/core/dev.js");
signals_route!(sig_core_effect, "../static/vendor/signals/core/effect.js");
signals_route!(sig_core_error, "../static/vendor/signals/core/error.js");
signals_route!(sig_core_external, "../static/vendor/signals/core/external.js");
signals_route!(sig_core_graph, "../static/vendor/signals/core/graph.js");
signals_route!(sig_core_heap, "../static/vendor/signals/core/heap.js");
signals_route!(sig_core_invariants, "../static/vendor/signals/core/invariants.js");
signals_route!(sig_core_lanes, "../static/vendor/signals/core/lanes.js");
signals_route!(sig_core_optimistic, "../static/vendor/signals/core/optimistic.js");
signals_route!(sig_core_owner, "../static/vendor/signals/core/owner.js");
signals_route!(sig_core_scheduler, "../static/vendor/signals/core/scheduler.js");
signals_route!(sig_core_verdict, "../static/vendor/signals/core/verdict.js");
signals_route!(sig_store_index, "../static/vendor/signals/store/index.js");
signals_route!(sig_store_store, "../static/vendor/signals/store/store.js");
signals_route!(sig_store_storepath, "../static/vendor/signals/store/storePath.js");
signals_route!(sig_store_utils, "../static/vendor/signals/store/utils.js");
signals_route!(sig_store_next_optimistic, "../static/vendor/signals/store/next/optimistic.js");
signals_route!(sig_store_next_patch, "../static/vendor/signals/store/next/patch.js");
signals_route!(sig_store_next_patch_hooks, "../static/vendor/signals/store/next/patch-hooks.js");
signals_route!(sig_store_next_projection, "../static/vendor/signals/store/next/projection.js");
signals_route!(sig_store_next_reconcile, "../static/vendor/signals/store/next/reconcile.js");
signals_route!(sig_store_next_store, "../static/vendor/signals/store/next/store.js");
signals_route!(sig_store_next_target, "../static/vendor/signals/store/next/target.js");

#[ntex::main]
async fn main() -> std::io::Result<()> {
    let args = match parse_args(std::env::args().skip(1)) {
        Ok(args) => args,
        Err(ArgsError::Help) => {
            print_usage();
            return Ok(());
        }
        Err(err) => {
            eprintln!("error: {err}");
            print_usage();
            std::process::exit(2);
        }
    };

    match args {
        Args::Version => {
            println!("nvidia-smi-live-web {}", env!("CARGO_PKG_VERSION"));
            return Ok(());
        }
        Args::Run { host, port } => {
            let bind_addr = format!("{host}:{port}");
            println!("nvidia-smi-live-web running at http://{bind_addr}");

            HttpServer::new(|| {
                App::new()
                    .route("/", web::get().to(index))
                    .route("/favicon.svg", web::get().to(favicon))
                    .route("/favicon.ico", web::get().to(favicon))
                    .route("/api/snapshot", web::get().to(api_snapshot))
                    .route("/vendor/tailwind.js", web::get().to(vendor_tailwind))
                    .route("/vendor/solid-js.mjs", web::get().to(vendor_solid_js))
                    .route("/vendor/web.mjs", web::get().to(vendor_web))
                    .route("/vendor/html.mjs", web::get().to(vendor_html))
                    .route("/vendor/seroval.mjs", web::get().to(vendor_seroval))
                    .route(
                        "/vendor/seroval-plugins-web.mjs",
                        web::get().to(vendor_seroval_plugins_web),
                    )
                    .route("/vendor/signals/index.js", web::get().to(sig_index))
                    .route("/vendor/signals/affects.js", web::get().to(sig_affects))
                    .route(
                        "/vendor/signals/boundaries.js",
                        web::get().to(sig_boundaries),
                    )
                    .route("/vendor/signals/map.js", web::get().to(sig_map))
                    .route("/vendor/signals/signals.js", web::get().to(sig_signals))
                    .route(
                        "/vendor/signals/core/action.js",
                        web::get().to(sig_core_action),
                    )
                    .route(
                        "/vendor/signals/core/async.js",
                        web::get().to(sig_core_async),
                    )
                    .route(
                        "/vendor/signals/core/constants.js",
                        web::get().to(sig_core_constants),
                    )
                    .route(
                        "/vendor/signals/core/context.js",
                        web::get().to(sig_core_context),
                    )
                    .route(
                        "/vendor/signals/core/core.js",
                        web::get().to(sig_core_core),
                    )
                    .route("/vendor/signals/core/dev.js", web::get().to(sig_core_dev))
                    .route(
                        "/vendor/signals/core/effect.js",
                        web::get().to(sig_core_effect),
                    )
                    .route(
                        "/vendor/signals/core/error.js",
                        web::get().to(sig_core_error),
                    )
                    .route(
                        "/vendor/signals/core/external.js",
                        web::get().to(sig_core_external),
                    )
                    .route(
                        "/vendor/signals/core/graph.js",
                        web::get().to(sig_core_graph),
                    )
                    .route("/vendor/signals/core/heap.js", web::get().to(sig_core_heap))
                    .route(
                        "/vendor/signals/core/invariants.js",
                        web::get().to(sig_core_invariants),
                    )
                    .route(
                        "/vendor/signals/core/lanes.js",
                        web::get().to(sig_core_lanes),
                    )
                    .route(
                        "/vendor/signals/core/optimistic.js",
                        web::get().to(sig_core_optimistic),
                    )
                    .route(
                        "/vendor/signals/core/owner.js",
                        web::get().to(sig_core_owner),
                    )
                    .route(
                        "/vendor/signals/core/scheduler.js",
                        web::get().to(sig_core_scheduler),
                    )
                    .route(
                        "/vendor/signals/core/verdict.js",
                        web::get().to(sig_core_verdict),
                    )
                    .route(
                        "/vendor/signals/store/index.js",
                        web::get().to(sig_store_index),
                    )
                    .route(
                        "/vendor/signals/store/store.js",
                        web::get().to(sig_store_store),
                    )
                    .route(
                        "/vendor/signals/store/storePath.js",
                        web::get().to(sig_store_storepath),
                    )
                    .route(
                        "/vendor/signals/store/utils.js",
                        web::get().to(sig_store_utils),
                    )
                    .route(
                        "/vendor/signals/store/next/optimistic.js",
                        web::get().to(sig_store_next_optimistic),
                    )
                    .route(
                        "/vendor/signals/store/next/patch.js",
                        web::get().to(sig_store_next_patch),
                    )
                    .route(
                        "/vendor/signals/store/next/patch-hooks.js",
                        web::get().to(sig_store_next_patch_hooks),
                    )
                    .route(
                        "/vendor/signals/store/next/projection.js",
                        web::get().to(sig_store_next_projection),
                    )
                    .route(
                        "/vendor/signals/store/next/reconcile.js",
                        web::get().to(sig_store_next_reconcile),
                    )
                    .route(
                        "/vendor/signals/store/next/store.js",
                        web::get().to(sig_store_next_store),
                    )
                    .route(
                        "/vendor/signals/store/next/target.js",
                        web::get().to(sig_store_next_target),
                    )
            })
            .bind(bind_addr)?
            .run()
            .await
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(values: &[&str]) -> Vec<String> {
        values.iter().map(|value| value.to_string()).collect()
    }

    #[test]
    fn parse_args_uses_default_host_and_port() {
        assert_eq!(
            parse_args(args(&[])),
            Ok(Args::Run {
                host: DEFAULT_HOST.to_string(),
                port: DEFAULT_PORT
            })
        );
    }

    #[test]
    fn parse_args_accepts_port_flags() {
        assert_eq!(
            parse_args(args(&["-p", "8080"])),
            Ok(Args::Run {
                host: DEFAULT_HOST.to_string(),
                port: 8080
            })
        );
        assert_eq!(
            parse_args(args(&["--port=9090"])),
            Ok(Args::Run {
                host: DEFAULT_HOST.to_string(),
                port: 9090
            })
        );
    }

    #[test]
    fn parse_args_accepts_host_flags() {
        assert_eq!(
            parse_args(args(&["--host", "0.0.0.0"])),
            Ok(Args::Run {
                host: "0.0.0.0".to_string(),
                port: DEFAULT_PORT
            })
        );
        assert_eq!(
            parse_args(args(&["--host=192.168.1.10", "-p", "8080"])),
            Ok(Args::Run {
                host: "192.168.1.10".to_string(),
                port: 8080
            })
        );
    }

    #[test]
    fn parse_args_rejects_invalid_ports() {
        assert_eq!(
            parse_args(args(&["-p", "0"])),
            Err(ArgsError::InvalidPort("0".to_string()))
        );
        assert_eq!(
            parse_args(args(&["--port", "70000"])),
            Err(ArgsError::InvalidPort("70000".to_string()))
        );
    }

    #[test]
    fn parse_args_rejects_empty_host() {
        assert_eq!(parse_args(args(&["--host="])), Err(ArgsError::EmptyHost));
    }
}
