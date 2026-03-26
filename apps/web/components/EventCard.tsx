import Link from "next/link";
import type { EventAttrs } from "@/lib/strapi";

export function eventKindLabel(attrs: EventAttrs): "Bike Night" | "Community" {
  return attrs.eventKind === "community" ? "Community" : "Bike Night";
}

export function EventCard({
  attrs,
  href,
  featured = false,
  featuredLabel,
  showForecast,
  forecastText,
  wide = false,
}: {
  attrs: EventAttrs;
  href: string;
  featured?: boolean;
  featuredLabel?: string;
  showForecast?: boolean;
  forecastText?: string | null;
  /** Full width in CSS grid (e.g. /events page) */
  wide?: boolean;
}) {
  const d = new Date(attrs.dateStart);
  const kind = eventKindLabel(attrs);
  const isBikeNight = kind === "Bike Night";
  const eventTime = Number.isNaN(d.getTime())
    ? "Time TBC"
    : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const eventLocation = attrs.location?.trim() || "Location to be confirmed";

  return (
    <article
      className={`group relative flex flex-col rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
        wide ? "w-full min-w-0 max-w-none" : "min-w-[min(100%,220px)] max-w-[248px]"
      } ${
        featured
          ? "border-accent/40 bg-white text-ink ring-1 ring-accent/20 dark:border-accent/40 dark:bg-[rgb(var(--color-card))]"
          : "border-zinc-200/90 bg-white text-ink dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]"
      }`}
    >
      <p
        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
          isBikeNight
            ? "border-accent/50 bg-accent/20 text-accent dark:border-accent/60 dark:bg-accent/25"
            : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
        }`}
      >
        {kind === "Bike Night" ? "Official Bike Night" : "Community"}
      </p>
      {featuredLabel ? (
        <span className="absolute right-3 top-3 rounded-full border border-accent/50 bg-accent/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
          {featuredLabel}
        </span>
      ) : null}
      <p
        className={`mt-3 font-display text-4xl font-bold leading-none tabular-nums ${
          featured ? "text-ink dark:text-zinc-100" : "text-ink"
        }`}
      >
        {d.getDate()}
      </p>
      <p
        className={`text-sm uppercase tracking-wide ${
          featured ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {d.toLocaleDateString("en-GB", { month: "short", weekday: "short" })}
      </p>
      <p
        className={`mt-2 font-display text-base font-bold uppercase leading-snug ${
          featured ? "text-[rgb(var(--color-on-accent))]" : "text-ink"
        }`}
      >
        {attrs.title}
      </p>
      <p
        className={`mt-2 text-xs leading-relaxed ${
          featured ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {eventTime} · {eventLocation}
      </p>
      {showForecast && forecastText ? (
        <p className={`mt-2 text-xs ${featured ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-500"}`}>
          Forecast: {forecastText}
        </p>
      ) : null}
      <p
        className={`mt-2 text-[11px] font-medium tabular-nums ${
          featured ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {attrs.goingCount ?? 0} going · {attrs.interestedCount ?? 0} interested
      </p>
      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={href}
            className="inline-flex items-center rounded-full border border-blue-300/80 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-blue-700 no-underline transition hover:border-blue-400 hover:bg-blue-100 hover:text-blue-800 hover:no-underline dark:border-blue-500/60 dark:bg-blue-500/15 dark:text-blue-200 dark:hover:border-blue-400/80 dark:hover:bg-blue-500/25 dark:hover:text-blue-100"
          >
            Details
          </Link>
          <a
            href={`/api/events/${attrs.slug}/ics`}
            download
            className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-700 no-underline transition hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 hover:no-underline dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label={`Add ${attrs.title} to calendar`}
          >
            Add to calendar
          </a>
        </div>
      </div>
    </article>
  );
}
