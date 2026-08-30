# Packaging

Four package definitions live here, for two packages: the `nvidia-smi-live`
CLI and the `nvidia-smi-live-web` server. The `packages`, `homebrew`, `apt`
and `pacman` jobs in
[`.github/workflows/release.yml`](../.github/workflows/release.yml) substitute
the `@VERSION@`, `@SHA_*@` and `@ARCH@` placeholders with the tag's version and
the checksums of the archives that release just built, then publish the result.
None of the definitions compiles the project from source — they all install the
binaries the `binaries` job already produced, which is what keeps the packages
and the release byte-identical.

| File | Package | Publishes to |
| --- | --- | --- |
| `homebrew/nvidia-smi-live.rb` | `nvidia-smi-live` | `apiplant/homebrew-tap`, as `Formula/nvidia-smi-live.rb` |
| `homebrew/nvidia-smi-live-web.rb` | `nvidia-smi-live-web` | `apiplant/homebrew-tap`, as `Formula/nvidia-smi-live-web.rb` |
| `pacman/PKGBUILD` | `nvidia-smi-live` | the release itself, as a `.pkg.tar.zst` asset, and `apiplant/pacman` |
| `pacman/PKGBUILD-web` | `nvidia-smi-live-web` | the release itself, as a `.pkg.tar.zst` asset, and `apiplant/pacman` |
| `debian/control` | `nvidia-smi-live` | the release itself, as `.deb` assets |
| `debian/control-web` | `nvidia-smi-live-web` | the release itself, as `.deb` assets |
| `apt/apt-ftparchive.conf` | both | `apiplant/apt`, served at `apt.apiplant.com` |
| `systemd/nvidia-smi-live-web.service` | `nvidia-smi-live-web` | inside the web packages |

Both packages install from the same release archive, which carries both
binaries; each package installs the one it names. The web package additionally
ships the systemd unit, which `systemctl enable --now nvidia-smi-live-web`
starts — the server then serves the monitor at http://127.0.0.1:7680.

NVML is a Linux driver interface, so there is no macOS or Windows package: the
matrix is `x86_64-unknown-linux-gnu` and `aarch64-unknown-linux-gnu` only, and
the Homebrew formulas serve Linuxbrew alone.

The order is: build every package, publish the release, then publish to every
repository. The `packages` job builds all four `.deb`s and both pacman packages
— they carry the binaries rather than pointing at them, so none of them needs
the release to exist yet — and `release` attaches all of them alongside the
archives. It needs no credential and always runs. Only then do `homebrew`,
`apt` and `pacman` run: the formulas reference the release assets by URL and
would checksum a 404 otherwise, and neither repository should serve a version
the release itself does not have. Each publish job is guarded on its credential
being present, so a fork — or this repository before the setup below is done —
skips it rather than failing the release.

The pacman packages are x86_64 only. The aarch64 build is deliberately off: it
would need an arm runner or emulation, and the Arch repository has no aarch64
audience. The `.deb`s and the plain archives still cover Linux arm64.

## One-time setup

The shared repositories already exist from the other apiplant releases —
`apiplant/homebrew-tap`, `apiplant/pacman` (served at
`apiplant.github.io/pacman`) and `apiplant/apt` (served at
`apt.apiplant.com`). This repository only needs the same three credentials the
other releases use, set as repository secrets:

- `HOMEBREW_TAP_TOKEN` — write access to `apiplant/homebrew-tap` (a fine-grained
  PAT scoped to that one repository with `Contents: read and write`). The
  default `GITHUB_TOKEN` cannot be used: it is scoped to this repository only.
- `APT_REPO_TOKEN` — write access to `apiplant/apt` (one fine-grained PAT can
  cover both repositories), plus `APT_GPG_PRIVATE_KEY` and, if the key has a
  passphrase, `APT_GPG_PASSPHRASE`.
- `PACMAN_REPO_TOKEN` — write access to `apiplant/pacman`, plus
  `PACMAN_GPG_PRIVATE_KEY` and, if the key has a passphrase,
  `PACMAN_GPG_PASSPHRASE`.

If a token is set without its key, the job fails loudly rather than publishing
an unsigned repository.

Because the repositories are cumulative, publishing a new version adds both
packages alongside the existing `apiplant` and `portward` packages: the apt
pool gains `pool/main/n/nvidia-smi-live/`, the pacman database gains two
packages, and the tap gains two formulas. Users who already have the
repositories configured pick them up with the ordinary update flow:

```bash
sudo apt update && sudo apt install nvidia-smi-live nvidia-smi-live-web
sudo pacman -Sy nvidia-smi-live nvidia-smi-live-web
brew install apiplant/tap/nvidia-smi-live apiplant/tap/nvidia-smi-live-web
```

## The driver dependency

`libnvidia-ml.so.1` comes from the NVIDIA driver, and the driver packages
differ per vendor and generation (`nvidia-driver`, `nvidia-driver-570`,
`nvidia-driver-580-xxx` on Ubuntu, `nvidia`/`nvidia-utils` on Fedora, …), so
none of the packages declares a dependency on it.

The binaries load `libnvidia-ml.so.1` with `dlopen` at first use rather than
linking it (see `core/src/nvml.rs`), so nothing is recorded `NEEDED`, the
build needs no driver or stub, and a machine with no driver still runs
`--version`, `--help` and everything up to the first NVML call — which then
fails with a readable message instead of the dynamic loader aborting the
process.