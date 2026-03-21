import Link from "next/link";
import { formatMeetLongUK } from "@/lib/meetDateFormat";
import { getEvents } from "@/lib/strapi";
import { getMeetForecast } from "@/lib/weather";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/upload", label: "Upload" },
  { href: "/news", label: "News" },
  { href: "/petitions", label: "Petitions" },
];

function NextMeetStrip({
  dateLine,
  forecast,
  compact,
}: {
  dateLine: string;
  forecast: { condition: string; highC: number; lowC: number } | null;
  compact: boolean;
}) {
  if (compact) {
    return (
      <div className="max-w-[11.5rem] rounded-md border border-zinc-300/90 bg-white px-2.5 py-1.5 text-right leading-tight dark:border-zinc-600 dark:bg-zinc-900">
        <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Next meet
        </span>
        <span className="block text-[11px] font-semibold leading-snug text-accent">{dateLine}</span>
        {forecast ? (
          <span className="mt-0.5 block text-[10px] text-zinc-600 dark:text-zinc-300">
            <span className="font-medium text-warm">{forecast.condition}</span>
            <span className="text-zinc-400 dark:text-zinc-500"> · </span>
            <span className="tabular-nums font-medium text-zinc-800 dark:text-zinc-200">
              {forecast.highC}° / {forecast.lowC}°
            </span>
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-zinc-300/90 bg-white px-3 py-2 sm:px-4 sm:py-2.5 dark:border-zinc-600 dark:bg-zinc-900">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Next meet</p>
      <p className="mt-0.5 text-sm font-semibold leading-snug text-accent sm:text-[0.95rem]">{dateLine}</p>
      {forecast ? (
        <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs text-zinc-600 dark:text-zinc-300">
          <span className="font-medium text-warm">{forecast.condition}</span>
          <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
            ·
          </span>
          <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
            {forecast.highC}° high · {forecast.lowC}° low
          </span>
        </p>
      ) : null}
    </div>
  );
}

export async function SiteHeader() {
  let dateLine = "This Thursday";
  let forecast: { condition: string; highC: number; lowC: number } | null = null;
  try {
    const events = await getEvents({ upcoming: true });
    const next = events?.data?.[0];
    if (next) {
      dateLine = formatMeetLongUK(next.attributes.dateStart) ?? "This Thursday";
      forecast = await getMeetForecast(next.attributes.dateStart);
    }
  } catch (err) {
    console.error("SiteHeader failed (header still renders):", err);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/90 bg-surface/90 backdrop-blur-xl dark:border-zinc-800/90">
      <div className="shell flex items-center justify-between gap-3 py-3 sm:gap-6">
        <Link href="/" className="group shrink-0 no-underline">
          <img
            src="/images/hayling-bike-night-logo.png"
            alt="Hayling Bike Night"
            className="h-12 w-auto rounded-md border border-zinc-300/90 bg-white object-contain sm:h-14 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </Link>

        <nav aria-label="Main" className="hidden min-w-0 flex-1 items-center justify-start gap-5 pl-3 sm:flex sm:gap-6 sm:pl-5 md:gap-7">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative py-1 font-body text-sm font-medium uppercase leading-none tracking-[0.14em] text-ink no-underline transition after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:text-accent hover:after:w-full sm:text-base"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden sm:block">
            <NextMeetStrip dateLine={dateLine} forecast={forecast} compact={false} />
          </div>
          <div className="sm:hidden">
            <NextMeetStrip dateLine={dateLine} forecast={forecast} compact={true} />
          </div>
        </div>
      </div>
    </header>
  );
}
