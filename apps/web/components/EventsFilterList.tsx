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
const activePillClass =
  "group relative inline-flex items-center overflow-hidden rounded-full border border-blue-300/70 bg-zinc-950 px-4 py-2 font-semibold text-zinc-100 no-underline shadow-[0_0_0_1px_rgba(96,165,250,0.35),0_10px_24px_rgba(2,6,23,0.45)] transition hover:-translate-y-0.5 hover:border-blue-200/80 hover:text-zinc-100 hover:no-underline hover:shadow-[0_0_0_1px_rgba(147,197,253,0.45),0_14px_28px_rgba(2,6,23,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";
const inactivePillClass =
  "inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-700 no-underline hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 hover:no-underline dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

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
              className={selectedMonth === "all" ? activePillClass : inactivePillClass}
            >
              {selectedMonth === "all" ? (
                <>
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_90%_at_50%_0%,rgba(78,152,255,0.34),transparent_62%)]" />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/55 via-zinc-900/45 to-zinc-950/90" />
                  <span className="relative">All</span>
                </>
              ) : (
                "All"
              )}
            </button>
            {monthOptions.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMonth(m.key)}
                className={selectedMonth === m.key ? activePillClass : inactivePillClass}
              >
                {selectedMonth === m.key ? (
                  <>
                    <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_90%_at_50%_0%,rgba(78,152,255,0.34),transparent_62%)]" />
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/55 via-zinc-900/45 to-zinc-950/90" />
                    <span className="relative">{m.label}</span>
                  </>
                ) : (
                  m.label
                )}
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
              className={kindFilter === "all" ? activePillClass : inactivePillClass}
            >
              {kindFilter === "all" ? (
                <>
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_90%_at_50%_0%,rgba(78,152,255,0.34),transparent_62%)]" />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/55 via-zinc-900/45 to-zinc-950/90" />
                  <span className="relative">All</span>
                </>
              ) : (
                "All"
              )}
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("official")}
              className={kindFilter === "official" ? activePillClass : inactivePillClass}
            >
              {kindFilter === "official" ? (
                <>
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_90%_at_50%_0%,rgba(78,152,255,0.34),transparent_62%)]" />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/55 via-zinc-900/45 to-zinc-950/90" />
                  <span className="relative">Official</span>
                </>
              ) : (
                "Official"
              )}
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("community")}
              className={kindFilter === "community" ? activePillClass : inactivePillClass}
            >
              {kindFilter === "community" ? (
                <>
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_90%_at_50%_0%,rgba(78,152,255,0.34),transparent_62%)]" />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/55 via-zinc-900/45 to-zinc-950/90" />
                  <span className="relative">Community</span>
                </>
              ) : (
                "Community"
              )}
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
