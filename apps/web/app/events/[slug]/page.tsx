import Link from "next/link";
import { notFound } from "next/navigation";
import { eventKindLabel } from "@/components/EventCard";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getEventBySlug } from "@/lib/strapi";

export const revalidate = 120;

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

  return (
    <article>
      <div className="border-b border-zinc-200 bg-gradient-to-b from-zinc-100/90 to-white dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        <div className="shell py-10 sm:py-14">
          <Link
            href="/events"
            className="text-sm font-medium text-zinc-500 no-underline transition hover:text-accent dark:text-zinc-400"
          >
            ← Local events
          </Link>
          <div className="mt-6 flex flex-wrap items-start gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                kind === "Bike Night"
                  ? "bg-accent/15 text-accent dark:bg-accent/25"
                  : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
              }`}
            >
              {kind === "Bike Night" ? "Bike Night" : "Community"}
            </span>
          </div>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold uppercase leading-tight tracking-tight text-ink sm:text-5xl">
            {e.title}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{e.location}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <time dateTime={e.dateStart}>
              {start.toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
            </time>
            <span aria-hidden className="text-zinc-300 dark:text-zinc-600">
              ·
            </span>
            <span>Until {end.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>
          {e.submitterName ? (
            <p className="mt-4 text-xs text-zinc-500">Listed by {e.submitterName}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/events"
              className="btn-primary inline-flex items-center justify-center no-underline"
            >
              All events
            </Link>
          </div>
        </div>
      </div>

      <div className="shell py-10 sm:py-12">
        {note ? (
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-xl font-bold uppercase text-ink">Details</h2>
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]">
              <MarkdownBody source={note} />
            </div>
          </div>
        ) : (
          <p className="text-center text-zinc-500 dark:text-zinc-400">No extra details for this listing.</p>
        )}
      </div>
    </article>
  );
}
