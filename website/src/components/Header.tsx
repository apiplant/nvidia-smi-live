import { For, Show, createSignal } from "solid-js";
import { useLocation } from "@solidjs/router";
import { LinkButton, ThemeToggle, Wordmark } from "./ui";
import { COMPANY_URL, GITHUB_URL } from "../lib/links";

const NAV = [
  { label: "Features", href: "/#features" },
  { label: "Install", href: "/#install" },
  { label: "Web frontend", href: "/#web", sparkle: true },
];

/** A four-point sparkle, monochrome: it takes the link's own colour. */
function Sparkle() {
  return (
    <svg
      viewBox="0 0 24 24"
      class="h-3 w-3 shrink-0"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

export function ExternalGlyph() {
  return (
    <svg viewBox="0 0 24 24" class="h-3 w-3 opacity-60" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function Header() {
  const location = useLocation();
  const [open, setOpen] = createSignal(false);

  const active = (href: string) => href.startsWith("/") && location.pathname.startsWith(href);

  return (
    <header class="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div class="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-5">
        <a href="/" class="min-w-0" aria-label="nvidia-smi-live home">
          <Wordmark />
        </a>

        <nav class="ml-4 hidden items-center gap-1 md:flex">
          <For each={NAV}>
            {(item) => (
              <LinkButton
                href={item.href}
                variant="ghost"
                size="sm"
                class={active(item.href) ? "text-ink bg-surface-2" : ""}
              >
                <Show when={item.sparkle}>
                  <Sparkle />
                </Show>
                {item.label}
                <Show when={item.sparkle}>
                  <Sparkle />
                </Show>
              </LinkButton>
            )}
          </For>
        </nav>

        <div class="ml-auto flex shrink-0 items-center gap-1.5">
          {/* The site's single commercial link: the team behind the project is
              available for hire. */}
          {/* Hidden via the wrapper rather than the button, whose own
              `inline-flex` would override a `hidden` class. */}
          <span class="hidden sm:contents">
            <LinkButton href={COMPANY_URL} variant="primary" size="sm">
              Hire us
              <ExternalGlyph />
            </LinkButton>
          </span>
          <ThemeToggle />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="nvidia-smi-live on GitHub"
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg viewBox="0 0 16 16" class="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
          <button
            type="button"
            onClick={() => setOpen(!open())}
            aria-label="Menu"
            aria-expanded={open() ? "true" : "false"}
            class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink md:hidden"
          >
            <svg viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="1.8">
              <path stroke-linecap="round" d={open() ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      <Show when={open()}>
        <nav class="border-t border-line bg-canvas px-5 py-2 md:hidden">
          <For each={NAV}>
            {(item) => (
              <LinkButton
                href={item.href}
                variant="ghost"
                class="w-full justify-start"
                onClick={() => setOpen(false)}
              >
                <Show when={item.sparkle}>
                  <Sparkle />
                </Show>
                {item.label}
                <Show when={item.sparkle}>
                  <Sparkle />
                </Show>
              </LinkButton>
            )}
          </For>
        </nav>
      </Show>
    </header>
  );
}