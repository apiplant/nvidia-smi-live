# Generated from packaging/homebrew/nvidia-smi-live.rb in
# apiplant/nvidia-smi-live by the release workflow, which fills in the version
# and checksums and commits the result to apiplant/homebrew-tap as
# Formula/nvidia-smi-live.rb. Changes belong in the source repository: the
# next release overwrites this file.
class NvidiaSmiLive < Formula
  desc "Live-updating nvidia-smi with a minimal terminal UI"
  homepage "https://github.com/apiplant/nvidia-smi-live"
  version "@VERSION@"
  license "MIT"

  # NVML is a Linux driver interface: there is no macOS build, so the formula
  # only serves Linuxbrew. There are no bottles either — the release archives
  # *are* the binaries, so the formula only unpacks what the tagged workflow
  # already built for each platform.
  on_linux do
    on_intel do
      url "https://github.com/apiplant/nvidia-smi-live/releases/download/v@VERSION@/nvidia-smi-live-v@VERSION@-x86_64-unknown-linux-gnu.tar.gz"
      sha256 "@SHA_LINUX_X86_64@"
    end
    on_arm do
      url "https://github.com/apiplant/nvidia-smi-live/releases/download/v@VERSION@/nvidia-smi-live-v@VERSION@-aarch64-unknown-linux-gnu.tar.gz"
      sha256 "@SHA_LINUX_ARM64@"
    end
  end

  def install
    bin.install "nvidia-smi-live"
    doc.install "README.md"
  end

  test do
    # No driver on the test runner: the binary must fail cleanly, and it must
    # report its version before it ever touches NVML.
    assert_match version.to_s, shell_output("#{bin}/nvidia-smi-live --version", env: {"HOME" => ENV["HOME"]}).split("\n").first
  end
end