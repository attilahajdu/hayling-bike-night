import { CommunityEventSubmitForm } from "@/components/CommunityEventSubmitForm";
import { EventCard } from "@/components/EventCard";
import { getEvents } from "@/lib/strapi";

export const revalidate = 120;

export default async function EventsPage() {
  const res = await getEvents({ upcoming: true });
  const list = res?.data ?? [];

  return (
    <div className="shell py-10 sm:py-14">
      <header className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-950 px-6 py-12 text-zinc-100 sm:px-12 sm:py-16 dark:border-zinc-700/80">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.5]"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 0%, rgba(59,130,246,0.12), transparent 45%)",
          }}
        />
        <div className="pointer-events-none absolute -right-20 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-accent/20 blur-[100px]" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Hayling & nearby</p>
            <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl">
              Local events
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
              Official Thursday Bike Nights plus whatever riders are cooking up nearby. If you suggest a ride or meet, it
              stays off this page until the Hayling Bike Night crew have given it a quick look — then it sits here with
              the rest.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-sm lg:items-stretch">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Fancy putting something on?</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Same form below on phone or desktop. You&apos;ll see a proper thumbs-up when it&apos;s landed with us.
              </p>
            </div>
            <a
              href="#submit-event"
              className="btn-primary w-full sm:py-3.5"
            >
              Suggest a ride or meet →
            </a>
          </div>
        </div>
      </header>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">Upcoming</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Thursday nights plus rider-suggested rides and meets that are live on the calendar.
            </p>
          </div>
        </div>
        {list.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-zinc-600 dark:border-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
            Nothing in the diary yet — check back soon, or suggest a ride or meet down below.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      <section id="submit-event" className="scroll-mt-28 mt-16 border-t border-zinc-200 pt-16 dark:border-zinc-800">
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          This is for <span className="font-medium text-ink dark:text-zinc-200">your</span> ride, meet, fundraiser, or
          whatever you want fellow riders to know about — not for changing the official Thursday Bike Night schedule
          (that&apos;s handled by the regular crew). Tap <span className="font-medium text-ink dark:text-zinc-200">How does this work?</span> on the form if you want the full story.
        </p>
        <CommunityEventSubmitForm />
      </section>
    </div>
  );
}
