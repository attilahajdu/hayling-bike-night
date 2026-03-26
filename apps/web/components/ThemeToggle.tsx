"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hbn-theme";

function readStoredTheme(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "light";
  } catch {
    return true;
  }
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setMounted(true);
    const isDark = readStoredTheme();
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white text-ink transition hover:bg-zinc-50 dark:border-white/15 dark:bg-white/[0.08] dark:text-zinc-100 dark:hover:bg-white/[0.12]"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {mounted ? (
        dark ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
            <path d="M20.2 14.1A8.6 8.6 0 0 1 9.9 3.8a.75.75 0 0 0-.9-.9 9.8 9.8 0 1 0 12.1 12.1.75.75 0 0 0-.9-.9z" />
          </svg>
        )
      ) : (
        <span className="text-sm leading-none">•••</span>
      )}
    </button>
  );
}
