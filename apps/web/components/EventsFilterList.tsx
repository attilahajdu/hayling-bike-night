"use client";

import { useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import type { EventAttrs } from "@/lib/strapi";

type EventItem = {
  id: number;
  attrs: EventAttrs;
  href: string;
};

type KindFilter = "all" | "official" | "community";

const selectClass =
  "w-full appearance-none rounded-full border border-zinc-300 bg-white px-4 py-2 pr-10 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-700 focus:outline-none focus:ring-2 focus:ring-accent/30 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

function monthKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string): string {
  if (key === "unknown") return "Unknown date";
  const [year, month] = key.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function EventsFilterList({ items }: { items: EventItem[] }) {
  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: Array<{ key: string; label: string }> = [];
    for (const item of items) {
      const key = monthKeyFromIso(item.attrs.dateStart);
      if (seen.has(key)) continue;
      seen.add(key);
      opts.push({ key, label: monthLabelFromKey(key) });
    }
    opts.sort((a, b) => a.key.localeCompare(b.key));
    return opts;
  }, [items]);

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const monthOk = selectedMonth === "all" || monthKeyFromIso(item.attrs.dateStart) === selectedMonth;
        const kindOk =
          kindFilter === "all" ||
          (kindFilter === "official" && item.attrs.eventKind !== "community") ||
          (kindFilter === "community" && item.attrs.eventKind === "community");
        return monthOk && kindOk;
      }),
    [items, selectedMonth, kindFilter],
  );

  return (
    <>
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Month</p>
            <div className="relative mt-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Filter by month"
                className={selectClass}
              >
                <option value="all">All</option>
                {monthOptions.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-300"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Type</p>
            <div className="relative mt-2">
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as KindFilter)}
                aria-label="Filter by type"
                className={selectClass}
              >
                <option value="all">All</option>
                <option value="official">Official</option>
                <option value="community">Community</option>
              </select>
              <svg
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-300"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
          No events match this filter yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e, idx) => (
            <div key={e.id} className="min-w-0">
              <EventCard attrs={e.attrs} href={e.href} featured={idx === 0} featuredLabel={idx === 0 ? "Coming up" : undefined} wide />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
