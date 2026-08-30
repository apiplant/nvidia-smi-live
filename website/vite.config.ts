import { defineConfig } from "vite";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/* The install section names the version, and the binary stamps the same
   string — so read it from the workspace manifest, the one `cargo build`
   uses, rather than a copy here that would go stale one release later. */
function workspaceVersion(): string {
  const manifest = readFileSync(fileURLToPath(new URL("../Cargo.toml", import.meta.url)), "utf8");
  const match = /^\s*version\s*=\s*"([^"]+)"/m.exec(
    manifest.slice(manifest.indexOf("[workspace.package]")),
  );
  if (!match) throw new Error("no [workspace.package] version in ../Cargo.toml");
  return match[1];
}

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  define: { __VERSION__: JSON.stringify(workspaceVersion()) },
  server: {
    port: 5275,
  },
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
  },
});