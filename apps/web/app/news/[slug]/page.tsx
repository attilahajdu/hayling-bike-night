import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getNewsBySlug } from "@/lib/strapi";

export const revalidate = 120;

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getNewsBySlug(slug);
  if (!row) notFound();
  const n = row.attributes;

  return (
    <article className="mx-auto max-w-3xl shell-px py-12">
      <Link href="/news" className="text-sm text-zinc-500 no-underline hover:text-accent dark:text-zinc-400">
        ← News
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold uppercase text-ink">{n.title}</h1>
      {n.tags ? <p className="mt-2 text-xs uppercase text-accent">{n.tags}</p> : null}
      <time className="mt-4 block text-sm text-zinc-500 dark:text-zinc-400" dateTime={n.publishedAt}>
        {new Date(n.publishedAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
      </time>
      <div className="mt-8">
        <MarkdownBody source={n.body} />
      </div>
    </article>
  );
}
