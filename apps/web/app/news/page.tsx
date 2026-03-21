import Link from "next/link";
import { getNewsList } from "@/lib/strapi";

export const revalidate = 120;

export default async function NewsPage() {
  const res = await getNewsList();
  const list = res?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl font-bold uppercase text-ink">News</h1>
      <ul className="mt-8 space-y-4">
        {list.length === 0 ? (
          <li className="text-zinc-500 dark:text-zinc-400">No news yet.</li>
        ) : (
          list.map((n) => (
            <li key={n.id} className="card p-4">
              <Link
                href={`/news/${n.attributes.slug}`}
                className="font-display text-2xl font-bold text-ink no-underline hover:text-accent"
              >
                {n.attributes.title}
              </Link>
              {n.attributes.tags ? <p className="mt-2 text-xs uppercase text-accent">{n.attributes.tags}</p> : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
