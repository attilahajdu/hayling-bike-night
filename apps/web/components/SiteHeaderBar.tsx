"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteHeaderNextMeet } from "@/components/SiteHeaderNextMeet";

const desktopLinkClass =
  "relative py-1 font-body text-xs font-semibold uppercase leading-none tracking-[0.11em] text-ink no-underline transition after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:text-accent hover:after:w-full sm:text-sm";

const drawerLinkClass =
  "flex min-h-[52px] items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-display text-base font-bold uppercase tracking-wide text-zinc-100 no-underline transition hover:border-blue-300/45 hover:bg-blue-500/15";

type Props = {
  dateLine: string;
  forecast: { condition: string; highC: number; lowC: number } | null;
  nextMeetHref: string;
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

export function SiteHeaderBar({ dateLine, forecast, nextMeetHref }: Props) {
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
      <div className="flex items-center justify-between gap-2 py-3 sm:gap-3 md:gap-6">
        <Link href="/" className="group min-w-0 shrink-0 no-underline">
          <img
            src="/images/hayling-bike-night-logo.png"
            alt="Hayling Bike Night"
            className="h-11 w-auto rounded-md border border-zinc-300/90 bg-white object-contain sm:h-14 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </Link>

        <nav
          aria-label="Main"
          className="hidden min-w-0 flex-1 items-center justify-start gap-x-6 pl-4 md:flex lg:gap-x-7 lg:pl-5"
        >
          <Link href="/" className={desktopLinkClass}>
            Home
          </Link>
          <Link href="/gallery" className={desktopLinkClass}>
            Galleries
          </Link>
          <Link href="/#find-us" className={desktopLinkClass}>
            Find us
          </Link>
          <Link href="/events" className={desktopLinkClass}>
            Rides and meetups
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="hidden md:block">
            <SiteHeaderNextMeet dateLine={dateLine} forecast={forecast} href={nextMeetHref} />
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
      <div className="pb-0 md:hidden">
        <SiteHeaderNextMeet variant="headerBar" dateLine={dateLine} forecast={forecast} href={nextMeetHref} />
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[98] bg-black/70 backdrop-blur-[1px] md:hidden"
            aria-label="Close menu"
            onClick={close}
          />
          <div
            id="site-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[99] flex min-h-screen w-screen flex-col overflow-y-auto bg-zinc-950 text-zinc-100 md:hidden"
            style={{
              paddingTop: "max(0.9rem, env(safe-area-inset-top, 0px))",
              paddingBottom: "max(0.9rem, env(safe-area-inset-bottom, 0px))",
              paddingRight: "max(1rem, env(safe-area-inset-right, 0px))",
              paddingLeft: "max(1rem, env(safe-area-inset-left, 0px))",
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/12 pb-3">
              <p id={titleId} className="font-display text-lg font-bold uppercase tracking-tight text-zinc-100">
                Menu
              </p>
              <button
                ref={closeBtnRef}
                type="button"
                className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-lg px-3 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08]"
                onClick={close}
              >
                Close
              </button>
            </div>

            <nav aria-label="Mobile" className="mt-5 flex flex-col gap-2">
              <Link href="/" className={drawerLinkClass} onClick={close}>
                Home
              </Link>
              <Link href="/gallery" className={drawerLinkClass} onClick={close}>
                Galleries
              </Link>
              <Link href="/#find-us" className={drawerLinkClass} onClick={close}>
                Find us
              </Link>
              <Link href="/events" className={drawerLinkClass} onClick={close}>
                Rides and meetups
              </Link>
              <Link href="/events#submit-event" className={drawerLinkClass} onClick={close}>
                Suggest a ride or meetup
              </Link>
              <Link href="/upload" className={drawerLinkClass} onClick={close}>
                Upload photos
              </Link>
            </nav>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.05] px-3 py-3">
              <span className="text-sm font-medium text-zinc-300">Theme</span>
              <ThemeToggle />
            </div>

            <div className="mt-5 border-t border-white/12 pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Next bike night
              </p>
              <SiteHeaderNextMeet dateLine={dateLine} forecast={forecast} href={nextMeetHref} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
