import Link from "next/link";
import { getEvents } from "@/lib/strapi";

export const revalidate = 120;

export default async function EventsPage() {
  const res = await getEvents();
  const list = res?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl uppercase text-white">Events</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">
        Subscribe in your calendar: <a href="/api/calendar.ics">calendar feed (.ics)</a> or{" "}
        <a href="/api/events">JSON</a> for apps.
      </p>
      <ul className="mt-8 space-y-4">
        {list.length === 0 ? (
          <li className="text-zinc-500">No events loaded — is Strapi running?</li>
        ) : (
          list.map((e) => (
            <li key={e.id} className="rounded border border-zinc-800 bg-elevated p-4">
              <Link href={`/events/${e.attributes.slug}`} className="font-display text-2xl text-white no-underline hover:text-accent">
                {e.attributes.title}
              </Link>
              <p className="mt-1 text-sm text-zinc-400">{e.attributes.location}</p>
              <time className="mt-2 block text-xs text-zinc-500" dateTime={e.attributes.dateStart}>
                {new Date(e.attributes.dateStart).toLocaleString("en-GB")}
              </time>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
