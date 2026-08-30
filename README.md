# nvidia-smi-live

Live-updating nvidia-smi.

| Package | Description |
| --- | --- |
| [`nvidia-smi-live-core`](core) | Shared data model (`gpu`), NVML data collection (`nvml`), export formats (`export`: JSON / Prometheus / NDJSON), and the nvidia-smi-style timestamp line (`timefmt`). Zero dependencies. |
| [`nvidia-smi-live`](cli) | Terminal UI: per-GPU bar panels (utilization, VRAM, temp, power, fan) and a process table, with switchable themes/units. Also provides `--json`, `--watch-json` and `--prom` export modes. |
| [`nvidia-smi-live-web`](web) | Minimal ntex server on `127.0.0.1:7679` exposing `GET /api/snapshot` (same JSON as the CLI) and a Solid.js 2 RC frontend (vendored from npm, no build step) showing the same data, refreshed every second. |

## Usage

```sh
# terminal UI (q quits; u/t/c cycle memory unit / theme / temp unit)
cargo run -p nvidia-smi-live

# one-shot JSON / streaming NDJSON / Prometheus textfile
cargo run -p nvidia-smi-live -- --json
cargo run -p nvidia-smi-live -- --watch-json -i 2000
cargo run -p nvidia-smi-live -- --prom

# web UI at http://127.0.0.1:7679
cargo run -p nvidia-smi-live-web
cargo run -p nvidia-smi-live-web -- -p 8080
```

## Notes

- Data comes from NVML (`libnvidia-ml`) via FFI — the same library backing
  nvidia-smi — not from parsing its stdout.
- The web frontend uses Solid.js 2.0.0-rc.4 (`solid-js`, `@solidjs/web`,
  `@solidjs/html`, `@solidjs/signals`) vendored under
  [`web/static/vendor`](web/static/vendor) and served by the binary; the
  relative import graph must stay intact so all modules share one reactive
  core. Tailwind is the vendored CDN build, as in portward.
