import { formatMeetLongUK } from "@/lib/meetDateFormat";
import { getFacebookPageUrl } from "@/lib/social";
import { getEvents } from "@/lib/strapi";
import { getMeetForecast } from "@/lib/weather";
import { SiteHeaderBar } from "@/components/SiteHeaderBar";

export async function SiteHeader() {
  const facebookUrl = getFacebookPageUrl();
  let dateLine = "This Thursday";
  let forecast: { condition: string; highC: number; lowC: number } | null = null;
  let nextMeetHref = "/events";
  try {
    const events = await getEvents({ upcoming: true });
    const next = events?.data?.[0];
    if (next) {
      dateLine = formatMeetLongUK(next.attributes.dateStart) ?? "This Thursday";
      forecast = await getMeetForecast(next.attributes.dateStart);
      nextMeetHref = `/events/${next.attributes.slug}`;
    }
  } catch (err) {
    console.error("SiteHeader failed (header still renders):", err);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/90 bg-surface/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl dark:border-zinc-800/90">
      <div className="shell">
        <SiteHeaderBar facebookUrl={facebookUrl} dateLine={dateLine} forecast={forecast} nextMeetHref={nextMeetHref} />
      </div>
    </header>
  );
}
