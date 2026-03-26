"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteHeaderNextMeet } from "@/components/SiteHeaderNextMeet";

const desktopLinkClass =
  "relative py-1 font-body text-sm font-medium uppercase leading-none tracking-[0.14em] text-ink no-underline transition after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:text-accent hover:after:w-full sm:text-base";

const drawerLinkClass =
  "flex min-h-[48px] items-center rounded-lg px-3 py-3 font-display text-base font-bold uppercase tracking-wide text-ink no-underline transition hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800";

type Props = {
  facebookUrl: string;
  dateLine: string;
  forecast: { condition: string; highC: number; lowC: number } | null;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      {open ? (
        <>
          <path d="M18 6L6 18M6 6l12 12" />
        </>
      ) : (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function SiteHeaderBar({ facebookUrl, dateLine, forecast }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, close]);

  return (
    <>
      <div className="flex items-center gap-2 py-3 sm:gap-3 md:gap-6">
        <Link href="/" className="group min-w-0 shrink-0 no-underline">
          <img
            src="/images/hayling-bike-night-logo.png"
            alt="Hayling Bike Night"
            className="h-11 w-auto rounded-md border border-zinc-300/90 bg-white object-contain sm:h-14 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </Link>

        <div className="min-w-0 flex-1 md:hidden">
          <SiteHeaderNextMeet variant="headerBar" dateLine={dateLine} forecast={forecast} />
        </div>

        <nav
          aria-label="Main"
          className="hidden min-w-0 flex-1 items-center justify-start gap-x-6 pl-4 md:flex lg:gap-x-7 lg:pl-5"
        >
          <Link href="/gallery" className={desktopLinkClass}>
            Gallery
          </Link>
          <Link href="/events" className={desktopLinkClass}>
            Local events
          </Link>
          <Link href="/events#submit-event" className={desktopLinkClass}>
            Fancy a ride?
          </Link>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={desktopLinkClass}
          >
            Facebook
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="hidden md:block">
            <SiteHeaderNextMeet dateLine={dateLine} forecast={forecast} />
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white text-ink transition hover:bg-zinc-50 md:hidden dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.1]"
            aria-expanded={menuOpen}
            aria-controls="site-mobile-nav"
            aria-haspopup="dialog"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
            aria-label="Close menu"
            onClick={close}
          />
          <div
            id="site-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-y-0 right-0 z-[61] flex w-[min(100%,20rem)] max-w-full flex-col border-l border-zinc-200 bg-surface shadow-2xl md:hidden dark:border-zinc-700 dark:bg-[rgb(var(--color-elevated))]"
            style={{
              paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
              paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))",
              paddingLeft: "0.75rem",
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700">
              <p id={titleId} className="font-display text-lg font-bold uppercase tracking-tight text-ink dark:text-zinc-100">
                Menu
              </p>
              <button
                ref={closeBtnRef}
                type="button"
                className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-lg px-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={close}
              >
                Close
              </button>
            </div>

            <nav aria-label="Mobile" className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
              <Link href="/" className={drawerLinkClass} onClick={close}>
                Home
              </Link>
              <Link href="/gallery" className={drawerLinkClass} onClick={close}>
                Gallery
              </Link>
              <Link href="/events" className={drawerLinkClass} onClick={close}>
                Local events
              </Link>
              <Link href="/events#submit-event" className={drawerLinkClass} onClick={close}>
                Fancy a ride?
              </Link>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={drawerLinkClass}
                onClick={close}
              >
                Facebook
              </a>
              <Link href="/upload" className={drawerLinkClass} onClick={close}>
                Upload photos
              </Link>
            </nav>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-3 dark:border-zinc-700">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Theme</span>
              <ThemeToggle />
            </div>

            <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Next meet
              </p>
              <SiteHeaderNextMeet dateLine={dateLine} forecast={forecast} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
