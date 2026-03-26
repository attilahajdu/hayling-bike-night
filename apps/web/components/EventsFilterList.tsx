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
      <div className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Filter by month</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedMonth("all")}
              className={selectedMonth === "all" ? "btn-secondary" : "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"}
            >
              All
            </button>
            {monthOptions.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMonth(m.key)}
                className={selectedMonth === m.key ? "btn-secondary" : "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Type</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setKindFilter("all")}
              className={kindFilter === "all" ? "btn-secondary" : "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("official")}
              className={kindFilter === "official" ? "btn-secondary" : "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"}
            >
              Official
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("community")}
              className={kindFilter === "community" ? "btn-secondary" : "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"}
            >
              Community
            </button>
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
