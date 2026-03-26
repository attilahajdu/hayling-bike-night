import { buildEventsIcs } from "@/lib/ical";
import { getEventBySlug } from "@/lib/strapi";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return new Response("Not found", { status: 404 });
  }

  const body = buildEventsIcs([event], `Hayling Bike Night - ${event.attributes.title}`);
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.attributes.slug || "event"}.ics"`,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
