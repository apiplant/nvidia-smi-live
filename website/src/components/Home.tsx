import { For, Show, createSignal } from "solid-js";
import { Badge, LinkButton, Mono } from "./ui";
import { CopyBlock } from "./Code";
import { GITHUB_URL } from "../lib/links";
import { PLATFORMS, LATEST_RELEASE_URL, assetName, downloadUrl } from "../lib/release";

/* ------------------------------------------------------------------ */
/* Real screenshot of the live view, with a theme switcher.           */
/* ------------------------------------------------------------------ */

const CLI_THEMES = [
  { id: "catppuccin", label: "Catppuccin" },
  { id: "dracula", label: "Dracula" },
  { id: "nord", label: "Nord" },
  { id: "gruvbox", label: "Gruvbox" },
];

function TerminalShot() {
  const [theme, setTheme] = createSignal("catppuccin");
  const label = () => CLI_THEMES.find((t) => t.id === theme())?.label ?? "";
  return (
    <div class="overflow-hidden rounded-xl border border-line shadow-2xl">
      {/* title bar */}
      <div class="flex items-center gap-2 border-b border-line bg-surface px-4 py-2.5">
        <span class="h-2.5 w-2.5 rounded-full bg-danger" />
        <span class="h-2.5 w-2.5 rounded-full bg-warn" />
        <span class="h-2.5 w-2.5 rounded-full bg-success" />
        <span class="ml-2 font-mono text-xs text-faint">nvidia-smi-live</span>
      </div>
      <img
        src={`/shot-cli-${theme()}.png`}
        alt={`nvidia-smi-live running in the ${label()} theme: GPU 0 RTX 4090 with utilization, VRAM, temperature, power and fan bars, and a per-process memory table`}
        class="block w-full"
        width={922}
        height={390}
      />
      {/* theme switcher */}
      <div class="flex flex-wrap items-center gap-1 border-t border-line bg-surface px-3 py-2">
        <span class="mr-1 text-xs font-semibold uppercase tracking-[0.14em] text-faint">theme</span>
        <For each={CLI_THEMES}>
          {(t) => (
            <button
              type="button"
              onClick={() => setTheme(t.id)}
              class={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                theme() === t.id
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-surface-3 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Web screenshot with a light/dark toggle.                           */
/* ------------------------------------------------------------------ */

function WebShot() {
  const [mode, setMode] = createSignal("dark");
  return (
    <div class="overflow-hidden rounded-xl border border-line">
      <div class="flex items-center justify-between border-b border-line bg-surface px-4 py-2">
        <span class="font-mono text-xs text-faint">nvidia-smi-live-web</span>
        <button
          type="button"
          onClick={() => setMode(mode() === "dark" ? "light" : "dark")}
          title={mode() === "dark" ? "Switch to light" : "Switch to dark"}
          aria-label={mode() === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <Show
            when={mode() === "dark"}
            fallback={
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 3a9 9 0 1 0 9 9c0-.34-.02-.67-.05-1A7 7 0 0 1 13 4.05c-.33-.03-.66-.05-1-.05Z" />
              </svg>
            }
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path
                stroke-linecap="round"
                d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4"
              />
            </svg>
          </Show>
        </button>
      </div>
      <img
        src={`/shot-web-${mode()}.png`}
        alt={`nvidia-smi-live-web running in the browser (${mode()} mode): GPU 0 RTX 4090 with utilization, VRAM, temperature, power and fan bars, and a per-process memory table`}
        class="block w-full"
        width={1280}
        height={800}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The size brag.                                                     */
/* ------------------------------------------------------------------ */

const OURS_KB = 373;
const NVIDIA_KB = 1331;

function SizeBrag() {
  return (
    <div class="rounded-xl border border-line bg-surface p-6 sm:p-8">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="text-lg font-semibold tracking-tight text-ink">
          Over 3× smaller than <span class="text-accent">nvidia-smi</span>
        </h3>
        <Badge tone="accent">release build · stripped · LTO</Badge>
      </div>

      <div class="mt-6 grid gap-4">
        <div>
          <div class="mb-1.5 flex items-baseline justify-between text-sm">
            <span class="font-medium text-ink">nvidia-smi-live</span>
            <span class="font-mono text-accent">under 400 KB</span>
          </div>
          <div class="h-4 overflow-hidden rounded-md bg-surface-3">
            <div
              class="h-full rounded-md bg-accent"
              style={{ width: `${(OURS_KB / NVIDIA_KB) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div class="mb-1.5 flex items-baseline justify-between text-sm">
            <span class="font-medium text-muted">nvidia-smi</span>
            <span class="font-mono text-faint">about 1.3 MB</span>
          </div>
          <div class="h-4 overflow-hidden rounded-md bg-surface-3">
            <div class="h-full w-full rounded-md bg-danger" />
          </div>
        </div>
      </div>

      <p class="mt-5 text-sm leading-relaxed text-faint">
        One statically-linked Rust binary. No Python runtime, no bundled shared libraries, no
        helper processes — the whole monitor is under 400 KB, and it still talks to the driver
        through NVML.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Features.                                                          */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    title: "Live by default",
    body: "Every GPU re-renders on a timer — utilization, VRAM, temperature, power and fan — so the numbers move while you watch. Press q to quit.",
  },
  {
    title: "Per-process memory",
    body: "The process table is laid out like nvidia-smi's: PID, type, name and per-process GPU memory, attributed to the right GPU on multi-GPU boxes.",
  },
  {
    title: "Filter processes",
    body: "A 40-GPU training box lists hundreds of processes. -f train.py keeps only the ones whose name matches, case-insensitively.",
  },
  {
    title: "Four color themes",
    body: "Catppuccin, Dracula, Nord and Gruvbox, switchable live with t. Memory unit (MiB/GiB/TiB) and temperature unit switch with u.",
  },
  {
    title: "JSON and NDJSON export",
    body: "--json prints one snapshot, --watch-json streams NDJSON every interval — pipe it into jq, a notebook, or anything that reads lines.",
  },
  {
    title: "Prometheus textfile",
    body: "--prom writes a Prometheus textfile snapshot for node_exporter's textfile collector. The same data, in the format your monitoring stack speaks.",
  },
];

function Features() {
  return (
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <For each={FEATURES}>
        {(f) => (
          <div class="rounded-xl border border-line bg-surface p-5">
            <h3 class="text-[0.9375rem] font-semibold tracking-tight text-ink">{f.title}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
          </div>
        )}
      </For>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Code blocks.                                                       */
/* ------------------------------------------------------------------ */

function CodeBlock(props: { lines: [string, string?][]; caption?: string }) {
  return (
    <div class="overflow-hidden rounded-xl border border-line">
      <div class="flex items-center justify-between border-b border-line bg-surface px-4 py-2">
        <span class="text-xs text-faint">{props.caption ?? "terminal"}</span>
        <span class="font-mono text-[0.6875rem] text-faint">bash</span>
      </div>
      <pre class="overflow-x-auto bg-code-bg p-4 font-mono text-[0.8rem] leading-relaxed text-muted">
        <For each={props.lines}>
          {(line) => (
            <div>
              <span class="select-none text-faint">$ </span>
              <span class="text-ink">{line[0]}</span>
              <Show when={line[1]}>
                <span class="text-faint"> {line[1]}</span>
              </Show>
            </div>
          )}
        </For>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Install: numbered step cards, the apiplant layout.                  */
/* ------------------------------------------------------------------ */

const stepCard =
  "grid min-w-0 gap-5 rounded-2xl border bg-surface p-5 sm:p-6 lg:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.3fr)] lg:items-start";

function InstallSteps() {
  const homebrewCommands = `brew tap apiplant/tap
brew install apiplant/tap/nvidia-smi-live`;
  const pacmanCommands = `curl -sSfL https://apiplant.github.io/pacman/apiplant.gpg -o /tmp/apiplant.gpg
keyid=$(gpg --show-keys --with-colons /tmp/apiplant.gpg | awk -F: '/^pub:/ { print $5; exit }') && sudo pacman-key --add /tmp/apiplant.gpg && sudo pacman-key --finger "$keyid" && sudo pacman-key --lsign-key "$keyid"
printf '\\n[apiplant]\\nSigLevel = Required DatabaseOptional\\nServer = https://apiplant.github.io/pacman/$arch\\n' | sudo tee -a /etc/pacman.conf > /dev/null
sudo pacman -Sy nvidia-smi-live`;
  const aptCommands = `curl -sSfL https://apt.apiplant.com/apiplant-archive-keyring.gpg | sudo tee /usr/share/keyrings/apiplant.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/apiplant.gpg] https://apt.apiplant.com stable main" | sudo tee /etc/apt/sources.list.d/apiplant.list > /dev/null
sudo apt update && sudo apt install nvidia-smi-live`;
  const buildCommands = `git clone https://github.com/apiplant/nvidia-smi-live
cd nvidia-smi-live
cargo build --release
./target/release/nvidia-smi-live`;

  return (
    <div class="mt-8 space-y-4 sm:mt-10">
      <div class={`${stepCard} border-accent-line`}>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs text-accent">01</span>
            <Badge tone="accent">Recommended</Badge>
          </div>
          <h3 class="mt-3 text-base font-semibold tracking-tight text-ink">Use a package manager</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            The quickest path on Arch, Debian and Ubuntu. All three are published to the apiplant
            shared repositories.
          </p>
        </div>

        <div class="min-w-0 space-y-5">
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Homebrew (Linuxbrew)
            </p>
            <CopyBlock command={homebrewCommands} />
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Arch Linux / pacman
            </p>
            <CopyBlock command={pacmanCommands} />
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Debian / Ubuntu
            </p>
            <CopyBlock command={aptCommands} />
            <p class="mt-2 text-xs leading-relaxed text-faint">
              Or pin a release with{" "}
              <code class="font-mono text-[0.9em]">sudo dpkg -i nvidia-smi-live_0.1.0-1_amd64.deb</code>.
            </p>
          </div>
        </div>
      </div>

      <div class={`${stepCard} border-line`}>
        <div>
          <span class="font-mono text-xs text-accent">02</span>
          <h3 class="mt-3 text-base font-semibold tracking-tight text-ink">Download the binary</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            One archive per platform, holding both binaries — the CLI and the web server — and
            the README. Unpack it anywhere on your <code class="font-mono text-[0.9em]">PATH</code> and
            run it. Every archive ships with a matching <code class="font-mono text-[0.9em]">.sha256</code>.
          </p>
        </div>

        {/* The whole row is the link. The label never shrinks and the asset
            name absorbs what is left, ellipsised when the column is narrow —
            the full name is in the tooltip and in the URL. */}
        <ul class="min-w-0 space-y-1 border-t border-line pt-4 lg:border-t-0 lg:pt-0">
          <For each={PLATFORMS}>
            {(platform) => (
              <li class="min-w-0">
                <a
                  href={downloadUrl(platform)}
                  title={assetName(platform)}
                  class="flex min-w-0 items-baseline justify-between gap-3 rounded-md py-1 text-muted transition-colors hover:text-ink"
                >
                  <span class="shrink-0 text-sm">{platform.label}</span>
                  <span class="min-w-0 truncate font-mono text-xs text-accent">
                    {assetName(platform)}
                  </span>
                </a>
              </li>
            )}
          </For>
        </ul>

        <a
          href={LATEST_RELEASE_URL}
          target="_blank"
          rel="noreferrer noopener"
          class="lg:col-start-2 text-sm font-medium text-accent hover:text-accent-dim"
        >
          All releases and checksums
        </a>
      </div>

      <div class={`${stepCard} border-line`}>
        <div>
          <span class="font-mono text-xs text-faint">03</span>
          <h3 class="mt-3 text-base font-semibold tracking-tight text-ink">Build from source</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            The release profile is tuned for size: <code class="font-mono text-[0.9em]">opt-level=z</code>,
            fat LTO, stripped, panic=abort. Choose it when you need your own patches.
          </p>
        </div>

        <div class="min-w-0">
          <CopyBlock command={buildCommands} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Install steps for the web version: same layout, web package.        */
/* ------------------------------------------------------------------ */

function WebInstallSteps() {
  const homebrewCommands = `brew tap apiplant/tap
brew install apiplant/tap/nvidia-smi-live-web`;
  const pacmanCommands = `curl -sSfL https://apiplant.github.io/pacman/apiplant.gpg -o /tmp/apiplant.gpg
keyid=$(gpg --show-keys --with-colons /tmp/apiplant.gpg | awk -F: '/^pub:/ { print $5; exit }') && sudo pacman-key --add /tmp/apiplant.gpg && sudo pacman-key --finger "$keyid" && sudo pacman-key --lsign-key "$keyid"
printf '\\n[apiplant]\\nSigLevel = Required DatabaseOptional\\nServer = https://apiplant.github.io/pacman/$arch\\n' | sudo tee -a /etc/pacman.conf > /dev/null
sudo pacman -Sy nvidia-smi-live-web`;
  const aptCommands = `curl -sSfL https://apt.apiplant.com/apiplant-archive-keyring.gpg | sudo tee /usr/share/keyrings/apiplant.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/apiplant.gpg] https://apt.apiplant.com stable main" | sudo tee /etc/apt/sources.list.d/apiplant.list > /dev/null
sudo apt update && sudo apt install nvidia-smi-live-web`;
  const buildCommands = `git clone https://github.com/apiplant/nvidia-smi-live
cd nvidia-smi-live
cargo build --release --bin nvidia-smi-live-web
./target/release/nvidia-smi-live-web`;
  const runCommands = `nvidia-smi-live-web
nvidia-smi-live-web --port 8080
nvidia-smi-live-web --host 0.0.0.0
sudo systemctl enable --now nvidia-smi-live-web`;

  return (
    <div class="mt-6 space-y-4">
      <div class={`${stepCard} border-accent-line`}>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs text-accent">01</span>
            <Badge tone="accent">Recommended</Badge>
          </div>
          <h3 class="mt-3 text-base font-semibold tracking-tight text-ink">Use a package manager</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            The web package ships a systemd unit, so the monitor keeps running with no logged-in
            user.
          </p>
        </div>

        <div class="min-w-0 space-y-5">
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Homebrew (Linuxbrew)
            </p>
            <CopyBlock command={homebrewCommands} />
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Arch Linux / pacman
            </p>
            <CopyBlock command={pacmanCommands} />
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
              Debian / Ubuntu
            </p>
            <CopyBlock command={aptCommands} />
            <p class="mt-2 text-xs leading-relaxed text-faint">
              Or pin a release with{" "}
              <code class="font-mono text-[0.9em]">sudo dpkg -i nvidia-smi-live-web_0.1.0-1_amd64.deb</code>.
            </p>
          </div>
        </div>
      </div>

      <div class={`${stepCard} border-line`}>
        <div>
          <span class="font-mono text-xs text-accent">02</span>
          <h3 class="mt-3 text-base font-semibold tracking-tight text-ink">Download the binary</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            The same archive as the CLI — it carries both binaries. Unpack it anywhere on your{" "}
            <code class="font-mono text-[0.9em]">PATH</code> and run{" "}
            <code class="font-mono text-[0.9em]">nvidia-smi-live-web</code>.
          </p>
        </div>

        <ul class="min-w-0 space-y-1 border-t border-line pt-4 lg:border-t-0 lg:pt-0">
          <For each={PLATFORMS}>
            {(platform) => (
              <li class="min-w-0">
                <a
                  href={downloadUrl(platform)}
                  title={assetName(platform)}
                  class="flex min-w-0 items-baseline justify-between gap-3 rounded-md py-1 text-muted transition-colors hover:text-ink"
                >
                  <span class="shrink-0 text-sm">{platform.label}</span>
                  <span class="min-w-0 truncate font-mono text-xs text-accent">
                    {assetName(platform)}
                  </span>
                </a>
              </li>
            )}
          </For>
        </ul>

        <a
          href={LATEST_RELEASE_URL}
          target="_blank"
          rel="noreferrer noopener"
          class="lg:col-start-2 text-sm font-medium text-accent hover:text-accent-dim"
        >
          All releases and checksums
        </a>
      </div>

      <div class={`${stepCard} border-line`}>
        <div>
          <span class="font-mono text-xs text-faint">03</span>
          <h3 class="mt-3 text-base font-semibold tracking-tight text-ink">Build from source</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            The same workspace as the CLI; build only the web binary.
          </p>
        </div>

        <div class="min-w-0">
          <CopyBlock command={buildCommands} />
        </div>
      </div>

      <div class={`${stepCard} border-line`}>
        <div>
          <span class="font-mono text-xs text-faint">04</span>
          <h3 class="mt-3 text-base font-semibold tracking-tight text-ink">Run it</h3>
          <p class="mt-2 text-sm leading-relaxed text-muted">
            Loopback by default, so it is only reachable from the machine itself. The systemd unit
            keeps it running with no logged-in user; expose it with{" "}
            <code class="font-mono text-[0.9em]">--host</code> if you need to.
          </p>
        </div>

        <div class="min-w-0">
          <CopyBlock command={runCommands} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page.                                                              */
/* ------------------------------------------------------------------ */

export function Home() {
  return (
    <div class="mx-auto w-full max-w-6xl px-5">
      {/* Hero */}
      <section class="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:gap-12">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge tone="accent">v{__VERSION__}</Badge>
            <Badge>Rust</Badge>
            <Badge>MIT</Badge>
          </div>
          <h1 class="mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            nvidia-smi, <span class="text-accent">live</span>.
          </h1>
          <p class="mt-4 max-w-lg text-lg leading-relaxed text-muted">
            A live-updating nvidia-smi with a minimal terminal UI. One small Rust binary that
            re-renders every GPU on a timer — no daemon, no Python, no agent.
          </p>
          <div class="mt-7 flex flex-wrap gap-3">
            <LinkButton href={GITHUB_URL} variant="primary" size="lg">
              View on GitHub
            </LinkButton>
            <LinkButton href="/#install" size="lg">
              Install
            </LinkButton>
          </div>
          <p class="mt-5 text-sm text-faint">
            <Mono>under 400 KB</Mono> release binary — over 3× smaller than nvidia-smi itself.
          </p>
        </div>
        <TerminalShot />
      </section>

      {/* Size brag */}
      <section class="pb-16">
        <SizeBrag />
      </section>

      {/* Features */}
      <section id="features" class="pb-16">
        <h2 class="text-2xl font-semibold tracking-tight text-ink">Everything nvidia-smi shows,
          updating while you watch</h2>
        <p class="mt-2 max-w-2xl text-muted">
          The same data nvidia-smi prints once, as a frame that redraws every second — plus the
          export modes a monitoring stack wants.
        </p>
        <div class="mt-8">
          <Features />
        </div>
      </section>

      {/* Install */}
      <section id="install" class="pb-16">
        <h2 class="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Install</h2>
        <p class="mt-3 max-w-2xl leading-relaxed text-muted">
          Use Homebrew, pacman or apt when your platform has it. Otherwise take the prebuilt
          binary — building from source is the slowest path.
        </p>

        <InstallSteps />
      </section>

      {/* Export */}
      <section class="pb-16">
        <h2 class="text-2xl font-semibold tracking-tight text-ink">Export</h2>
        <p class="mt-2 max-w-2xl text-muted">
          The live view is for humans. For machines, the same snapshot comes out as JSON, NDJSON
          or Prometheus textfile.
        </p>
        <div class="mt-8">
          <CodeBlock
            caption="export"
            lines={[
              ["nvidia-smi-live --json | jq .gpus[0].utilizationGpu"],
              ["nvidia-smi-live --watch-json -i 2000"],
              ["nvidia-smi-live --prom > /var/lib/node_exporter/textfile/gpu.prom"],
            ]}
          />
        </div>
      </section>

      {/* Web */}
      <section id="web" class="pb-20">
        <div class="rounded-xl border border-line bg-surface p-6 sm:p-8">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-2xl font-semibold tracking-tight text-ink">
              nvidia-smi-live<span class="text-accent">-web</span>
            </h2>
            <Badge tone="accent">same version, same release</Badge>
          </div>
          <p class="mt-3 max-w-2xl leading-relaxed text-muted">
            The same monitor for the browser: a minimal Rust web server streaming live snapshots
            to a Solid.js frontend. No build step on the server, no framework on the wire — one
            small binary serving a static page that updates in place. It binds&nbsp;
            <Mono>127.0.0.1:7680</Mono> by default; pass <Mono>--port</Mono> to change the port and
            <Mono>--host</Mono> to expose it on the network.
          </p>
          <div class="mt-6">
            <WebShot />
          </div>
          <WebInstallSteps />
        </div>
      </section>
    </div>
  );
}
