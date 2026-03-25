import Link from "next/link";
import type { EventAttrs } from "@/lib/strapi";

export function eventKindLabel(attrs: EventAttrs): "Bike Night" | "Community" {
  return attrs.eventKind === "community" ? "Community" : "Bike Night";
}

export function EventCard({
  attrs,
  href,
  featured = false,
  showForecast,
  forecastText,
  wide = false,
}: {
  attrs: EventAttrs;
  href: string;
  featured?: boolean;
  showForecast?: boolean;
  forecastText?: string | null;
  /** Full width in CSS grid (e.g. /events page) */
  wide?: boolean;
}) {
  const d = new Date(attrs.dateStart);
  const kind = eventKindLabel(attrs);
  const isBikeNight = kind === "Bike Night";

  return (
    <article
      className={`group flex flex-col rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
        wide ? "w-full min-w-0 max-w-none" : "min-w-[min(100%,260px)] max-w-[280px]"
      } ${
        featured
          ? "border-accent/50 bg-accent text-[rgb(var(--color-on-accent))] ring-1 ring-accent/20"
          : "border-zinc-200/90 bg-white text-ink dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]"
      }`}
    >
      <p
        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
          featured
            ? "bg-white/20 text-[rgb(var(--color-on-accent))]"
            : isBikeNight
              ? "bg-accent/15 text-accent dark:bg-accent/25"
              : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
        }`}
      >
        {kind === "Bike Night" ? "Bike Night" : "Community"}
      </p>
      <p
        className={`mt-4 font-display text-5xl font-bold leading-none tabular-nums ${
          featured ? "text-[rgb(var(--color-on-accent))]" : "text-ink"
        }`}
      >
        {d.getDate()}
      </p>
      <p
        className={`text-sm uppercase tracking-wide ${
          featured ? "text-[rgb(var(--color-on-accent))]/90" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {d.toLocaleDateString("en-GB", { month: "short", weekday: "short" })}
      </p>
      <p
        className={`mt-3 font-display text-lg font-bold uppercase leading-snug ${
          featured ? "text-[rgb(var(--color-on-accent))]" : "text-ink"
        }`}
      >
        {attrs.title}
      </p>
      <p
        className={`mt-2 text-xs leading-relaxed ${
          featured ? "text-[rgb(var(--color-on-accent))]/90" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {attrs.location}
      </p>
      {showForecast && forecastText ? (
        <p className={`mt-2 text-xs ${featured ? "text-[rgb(var(--color-on-accent))]/85" : "text-zinc-500"}`}>
          Forecast: {forecastText}
        </p>
      ) : null}
      <div className="mt-auto pt-4">
        <Link
          href={href}
          className={`inline-flex text-sm font-semibold no-underline transition hover:underline ${
            featured ? "text-[rgb(var(--color-on-accent))]" : "text-accent"
          }`}
        >
          Details →
        </Link>
        <a
          href="/api/calendar.ics"
          className={`ml-4 inline-flex text-xs font-medium no-underline opacity-90 hover:underline ${
            featured ? "text-[rgb(var(--color-on-accent))]/90" : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          Add to calendar
        </a>
      </div>
    </article>
  );
}
