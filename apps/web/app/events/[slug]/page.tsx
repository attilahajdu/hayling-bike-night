import Link from "next/link";
import { notFound } from "next/navigation";
import { eventKindLabel } from "@/components/EventCard";
import { EventEngagement } from "@/components/EventEngagement";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getEventBySlug } from "@/lib/strapi";

/** RSVP / live counts must not be served from stale cache */
export const dynamic = "force-dynamic";

function strapiRichTextToPlain(note: unknown): string {
  if (typeof note === "string") return note;
  if (Array.isArray(note)) {
    const lines: string[] = [];
    for (const block of note) {
      if (block && typeof block === "object" && "children" in block) {
        const children = (block as { children?: Array<{ text?: string }> }).children ?? [];
        const line = children.map((c) => c.text ?? "").join("");
        if (line) lines.push(line);
      }
    }
    return lines.join("\n\n");
  }
  return "";
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getEventBySlug(slug);
  if (!row) notFound();
  const e = row.attributes;
  const note = strapiRichTextToPlain(e.note);
  const kind = eventKindLabel(e);
  const start = new Date(e.dateStart);
  const end = new Date(e.dateEnd || e.dateStart);
  const dateLine = start.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  return (
    <article className="border-b border-zinc-200 bg-gradient-to-b from-zinc-100/90 to-white dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
      <div className="shell max-w-3xl py-10 sm:py-14">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            kind === "Bike Night"
              ? "bg-accent/15 text-accent dark:bg-accent/25"
              : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
          }`}
        >
          {kind === "Bike Night" ? "Bike Night" : "Community"}
        </span>

        <h1 className="mt-5 font-display text-4xl font-bold uppercase leading-tight tracking-tight text-ink sm:text-5xl">
          {e.title}
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">{e.location}</p>

        {note ? (
          <div className="mt-8 rounded-3xl border border-zinc-200/90 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]/80">
            <MarkdownBody source={note} />
          </div>
        ) : null}

        <section className="mt-10 space-y-2 border-t border-zinc-200/80 pt-10 dark:border-zinc-700/80">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            When
          </h2>
          <p className="text-base text-zinc-800 dark:text-zinc-200">
            <time dateTime={e.dateStart}>
              {start.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
            </time>
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Until {end.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </section>

        {e.submitterName ? (
          <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
            Listed by <span className="font-medium text-zinc-700 dark:text-zinc-300">{e.submitterName}</span>
          </p>
        ) : null}

        <EventEngagement
          eventId={row.id}
          slug={e.slug}
          title={e.title}
          dateLine={dateLine}
          initialGoing={e.goingCount ?? 0}
          initialInterested={e.interestedCount ?? 0}
        />

        <div className="mt-12 border-t border-zinc-200/80 pt-8 dark:border-zinc-700/80">
          <Link
            href="/events"
            className="inline-flex text-sm font-semibold text-accent no-underline transition hover:text-accentHover hover:no-underline"
          >
            ← Back to all events
          </Link>
        </div>
      </div>
    </article>
  );
}
