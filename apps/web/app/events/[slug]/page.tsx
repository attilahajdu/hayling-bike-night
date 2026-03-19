import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getEventBySlug } from "@/lib/strapi";

export const revalidate = 120;

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getEventBySlug(slug);
  if (!row) notFound();
  const e = row.attributes;
  const note = e.note ?? "";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/events" className="text-sm text-zinc-500 no-underline hover:text-accent">
        ← Events
      </Link>
      <h1 className="mt-4 font-display text-4xl uppercase text-white">{e.title}</h1>
      <p className="mt-2 text-zinc-400">{e.location}</p>
      <time className="mt-4 block text-sm text-zinc-500" dateTime={e.dateStart}>
        {new Date(e.dateStart).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
      </time>
      {note ? (
        <div className="mt-8">
          <MarkdownBody source={note} />
        </div>
      ) : null}
    </article>
  );
}
