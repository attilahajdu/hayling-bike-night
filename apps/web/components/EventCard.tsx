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

function formatLongDateLine(d: Date): string {
  if (Number.isNaN(d.getTime())) return "Date to be confirmed";
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  const weekday = d.toLocaleDateString("en-GB", { weekday: "long" });
  return `${ordinalDay(day)} of ${month}, ${weekday}`;
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

  return (
    <article
      className={`group flex flex-col rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
        wide ? "w-full min-w-0 max-w-none" : "min-w-[min(100%,220px)] max-w-[248px]"
      } ${
        featured
          ? "border-accent/40 bg-white text-ink ring-1 ring-accent/20 dark:border-accent/40 dark:bg-[rgb(var(--color-card))]"
          : "border-zinc-200/90 bg-white text-ink dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]"
      }`}
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

      {/* 2. Date — full words, easy to read */}
      <p
        className={`mt-3 font-display text-xl font-bold leading-snug tracking-tight sm:text-2xl ${
          featured ? "text-ink dark:text-zinc-100" : "text-ink"
        }`}
      >
        {formatLongDateLine(d)}
      </p>

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
