"use client";

import { useEffect, useMemo, useState } from "react";
import { readLocalLikeCount } from "@/lib/photo-local-likes";

type Item = { id: number; src: string; alt: string };

export function HomeCommunityPreview({ items }: { items: Item[] }) {
  const [ready, setReady] = useState(false);

  const sorted = useMemo(() => {
    if (!ready) return items;
    const copy = [...items].map((it) => ({
      ...it,
      likes: readLocalLikeCount(it.id),
    }));
    copy.sort((a, b) => {
      if (b.likes !== a.likes) return b.likes - a.likes;
      return b.id - a.id;
    });
    return copy;
  }, [items, ready]);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {sorted.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-xl border border-stone/50 bg-white shadow-sm ring-1 ring-black/[0.03] dark:border-zinc-700 dark:bg-[rgb(var(--color-card))] dark:ring-0"
        >
          <div className="aspect-square bg-zinc-200">
            <img src={item.src} alt={item.alt} className="h-full w-full object-cover" loading="lazy" />
          </div>
        </article>
      ))}
    </div>
  );
}
