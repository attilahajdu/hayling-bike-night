import type { EventAttrs } from "@/lib/strapi";

function atTimeTodayPlusDays(days: number, hour24: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour24, minute, 0, 0);
  return d.toISOString();
}

export function getDemoUpcomingEvents(count = 10): Array<{ id: number; attributes: EventAttrs }> {
  const templates: Array<Pick<EventAttrs, "title" | "location" | "eventKind">> = [
    { title: "Seafront Sunset Loop", location: "Hayling Seafront", eventKind: "community" },
    { title: "Island Coffee Run", location: "John's Cafe", eventKind: "community" },
    { title: "Thursday Bike Night", location: "Hayling Island", eventKind: "bike_night" },
    { title: "South Downs Warm-Up", location: "Emsworth Start Point", eventKind: "community" },
    { title: "Beachside Meetup Ride", location: "Hayling Beach Car Park", eventKind: "community" },
    { title: "Evening Ride-Out", location: "Langstone Harbour", eventKind: "community" },
    { title: "Classic Bike Social", location: "Havant Market Area", eventKind: "community" },
    { title: "Sunrise Spin", location: "Eastoke Corner", eventKind: "community" },
    { title: "Charity Meetup Ride", location: "Southsea Common", eventKind: "community" },
    { title: "Night Loop + Chips", location: "Hayling Promenade", eventKind: "community" },
  ];

  return templates.slice(0, Math.max(1, count)).map((t, idx) => {
    const start = atTimeTodayPlusDays(idx + 1, 18, 0);
    const end = atTimeTodayPlusDays(idx + 1, 20, 0);
    return {
      id: 9000 + idx,
      attributes: {
        title: t.title,
        slug: `demo-${idx + 1}`,
        dateStart: start,
        dateEnd: end,
        location: t.location,
        eventKind: t.eventKind,
        goingCount: 6 + idx * 2,
        interestedCount: 14 + idx * 3,
      },
    };
  });
}

