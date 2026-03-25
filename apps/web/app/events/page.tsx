import { CommunityEventSubmitForm } from "@/components/CommunityEventSubmitForm";
import { EventCard } from "@/components/EventCard";
import { getEvents } from "@/lib/strapi";

export const revalidate = 120;

export default async function EventsPage() {
  const res = await getEvents({ upcoming: true });
  const list = res?.data ?? [];

  return (
    <div className="shell py-10 sm:py-14">
      <header className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-white to-zinc-100 px-6 py-10 dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Hayling & nearby</p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-ink sm:text-5xl">Local events</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Weekly Bike Night meets and community-submitted rides & meets. Add yours below — organisers approve before
            anything goes public.
          </p>
          <a
            href="/api/calendar.ics"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent no-underline hover:underline"
          >
            Subscribe: calendar feed (.ics) →
          </a>
        </div>
      </header>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold uppercase text-ink">Upcoming</h2>
        {list.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
            No upcoming events in the calendar yet. Check back soon — or submit a community event below.
          </p>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e, idx) => (
              <div key={e.id} className="flex min-w-0 justify-center sm:justify-stretch">
                <EventCard
                  attrs={e.attributes}
                  href={`/events/${e.attributes.slug}`}
                  featured={idx === 0}
                  wide
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 border-t border-zinc-200 pt-12 dark:border-zinc-800">
        <CommunityEventSubmitForm />
      </section>
    </div>
  );
}
