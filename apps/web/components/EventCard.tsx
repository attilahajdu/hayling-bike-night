import Link from "next/link";
import type { EventAttrs } from "@/lib/strapi";

export function eventKindLabel(attrs: EventAttrs): "Bike Night" | "Community" {
  return attrs.eventKind === "community" ? "Community" : "Bike Night";
}

function ordinalDay(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function dateParts(d: Date): { ordinal: string; month: string; weekday: string } | null {
  if (Number.isNaN(d.getTime())) return null;
  return {
    ordinal: ordinalDay(d.getDate()),
    month: d.toLocaleDateString("en-GB", { month: "long" }),
    weekday: d.toLocaleDateString("en-GB", { weekday: "long" }),
  };
}

const badgeShell =
  "inline-flex w-fit rounded-md border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]";

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
  const parts = dateParts(d);
  const dateLabel = parts
    ? `${parts.ordinal} ${parts.month} ${parts.weekday}`
    : "Date to be confirmed";

  return (
    <article
      className={`group flex flex-col rounded-xl border p-4 shadow-sm outline-none transition duration-200 ease-out will-change-transform ${
        wide ? "w-full min-w-0 max-w-none" : "min-w-[min(100%,240px)] max-w-[280px]"
      } ${
        featured
          ? "border-accent/40 bg-white text-ink ring-1 ring-accent/20 dark:border-accent/40 dark:bg-[rgb(var(--color-card))]"
          : "border-zinc-200/90 bg-white text-ink dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]"
      } hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] hover:ring-1 hover:ring-accent/15 focus-within:-translate-y-0.5 focus-within:border-accent/40 focus-within:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)] focus-within:ring-1 focus-within:ring-accent/20 dark:hover:border-zinc-500 dark:hover:shadow-[0_14px_44px_-10px_rgba(0,0,0,0.45)] dark:hover:ring-white/10 dark:focus-within:border-zinc-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0`}
    >
      {/* 1. Badges — flex row so they never overlap */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`${badgeShell} ${
            isBikeNight
              ? "border-accent/50 bg-accent/20 text-accent dark:border-accent/60 dark:bg-accent/25"
              : "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          }`}
        >
          {kind === "Bike Night" ? "Official Bike Night" : "Community"}
        </span>
        {featuredLabel ? (
          <span
            className={`${badgeShell} border-accent/50 bg-accent/15 text-accent`}
          >
            {featuredLabel}
          </span>
        ) : null}
      </div>

      {/* 2. Date — day dominates; reads as “27th March Friday” without feeling like one flat sentence */}
      <div
        className="mt-3"
        aria-label={dateLabel}
      >
        {parts ? (
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 leading-[1.1]">
            <span
              className={`font-display text-[2rem] font-bold tabular-nums tracking-tight sm:text-[2.35rem] ${
                featured ? "text-ink dark:text-zinc-100" : "text-ink"
              }`}
            >
              {parts.ordinal}
            </span>
            <span
              className={`font-display text-xl font-bold tracking-tight sm:text-2xl ${
                featured ? "text-ink dark:text-zinc-100" : "text-ink"
              }`}
            >
              {parts.month}
            </span>
            <span className="font-display text-base font-semibold text-zinc-500 dark:text-zinc-400">
              {parts.weekday}
            </span>
          </p>
        ) : (
          <p className="font-display text-xl font-bold text-zinc-500">Date to be confirmed</p>
        )}
      </div>

      {/* 3. Time */}
      <p
        className={`mt-1 text-sm font-medium tabular-nums ${
          featured ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-700 dark:text-zinc-400"
        }`}
      >
        {eventTime}
      </p>

      {/* 4. Title */}
      <p
        className={`mt-3 font-display text-base font-bold uppercase leading-snug ${
          featured ? "text-[rgb(var(--color-on-accent))]" : "text-ink"
        }`}
      >
        {attrs.title}
      </p>

      {/* 5. Location */}
      <p
        className={`mt-2 text-sm leading-relaxed ${
          featured ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {eventLocation}
      </p>

      {showForecast && forecastText ? (
        <p className={`mt-2 text-xs ${featured ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-500"}`}>
          Forecast: {forecastText}
        </p>
      ) : null}

      {/* 6. Going / interested */}
      <p
        className={`mt-3 text-[11px] font-medium tabular-nums ${
          featured ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-500 dark:text-zinc-400"
        }`}
      >
        {attrs.goingCount ?? 0} going · {attrs.interestedCount ?? 0} interested
      </p>

      {/* 7. CTAs */}
      <div className="mt-auto pt-4">
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
