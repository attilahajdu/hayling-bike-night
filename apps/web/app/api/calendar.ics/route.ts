import { buildEventsIcs } from "@/lib/ical";
import { getEvents } from "@/lib/strapi";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await getEvents();
  const events = res?.data ?? [];
  const body = buildEventsIcs(events, "Hayling Bike Night");
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
