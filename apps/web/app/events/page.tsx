import Link from "next/link";
import { getEvents } from "@/lib/strapi";

export const revalidate = 120;

export default async function EventsPage() {
  const res = await getEvents();
  const list = res?.data ?? [];

  return (
    <div className="shell py-12">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="section-title">Events</h1>
        <a href="/api/calendar.ics" className="text-sm text-ink">Calendar feed (.ics)</a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">No events loaded — is Strapi running?</p>
        ) : (
          list.map((e, idx) => {
            const d = new Date(e.attributes.dateStart);
            return (
              <article
                key={e.id}
                className={`rounded-2xl border-l-4 p-5 ${
                  idx === 0
                    ? "border-l-white bg-accent text-[rgb(var(--color-on-accent))]"
                    : "border-l-accent bg-white dark:bg-[rgb(var(--color-card))]"
                }`}
              >
                <p className="font-display font-bold text-6xl leading-none">{d.getDate()}</p>
                <p
                  className={`text-sm uppercase ${idx === 0 ? "text-[rgb(var(--color-on-accent))]/90" : "text-zinc-600 dark:text-zinc-400"}`}
                >
                  {d.toLocaleDateString("en-GB", { month: "long", weekday: "long" })}
                </p>
                <p className={`mt-2 text-sm ${idx === 0 ? "text-[rgb(var(--color-on-accent))]/90" : "text-zinc-600 dark:text-zinc-400"}`}>
                  {e.attributes.location}
                </p>
                <Link href={`/events/${e.attributes.slug}`} className={`mt-4 inline-block text-sm ${idx === 0 ? "text-[rgb(var(--color-on-accent))]" : "text-accent"}`}>Open details →</Link>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
