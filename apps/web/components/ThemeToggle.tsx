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
      className="shrink-0 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-200 dark:hover:bg-white/[0.1] sm:px-3 sm:py-2 sm:text-xs"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {mounted ? (dark ? "Light" : "Dark") : "···"}
    </button>
  );
}
