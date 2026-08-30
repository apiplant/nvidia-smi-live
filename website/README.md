# nvidia-smi-live website

The marketing site for [nvidia-smi-live](https://github.com/apiplant/nvidia-smi-live).
Solid 2 RC + Tailwind v4 + Vite, static build, deployed to Cloudflare Pages.

```bash
pnpm install
pnpm dev       # http://127.0.0.1:5275
pnpm build     # → dist/
pnpm check     # types only
```

## The version is not copied here

The install section names the version, and the binary stamps the same string — so
`vite.config.ts` reads it from `../Cargo.toml` (`[workspace.package] version`) at build
time and injects it as `__VERSION__`. There is no copy in the site to keep in sync.

## Deploying

A static SPA: `dist/` is assets-only, and `wrangler.jsonc` sends unknown paths to
`index.html` (`not_found_handling: single-page-application`) so deep links resolve on a
cold load.

```bash
npx wrangler pages deploy dist --project-name nvidia-smi-live-website
```

`index.html`, `public/robots.txt` and `public/sitemap.xml` name the default
`nvidia-smi-live.pages.dev` domain; update all three if the site moves.