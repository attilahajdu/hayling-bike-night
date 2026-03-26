"use client";

import { useEffect, useMemo, useState } from "react";
import { readLocalLikeCount } from "@/lib/photo-local-likes";

type Item = { id: number; src: string; alt: string };

export function HomeCommunityPreview({ items }: { items: Item[] }) {
  const [ready, setReady] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    const initialLiked = items
      .map((it) => it.id)
      .filter((id) => window.localStorage.getItem(`hbn-photo-liked-${id}`) === "1");
    setLikedIds(initialLiked);
    const initialCounts: Record<number, number> = {};
    for (const it of items) {
      const raw = window.localStorage.getItem(`hbn-photo-like-count-${it.id}`);
      const parsed = raw ? Number(raw) : 0;
      initialCounts[it.id] = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    setLikeCounts(initialCounts);
  }, [items]);

  const activeIndex = activePhotoId === null ? -1 : sorted.findIndex((item) => item.id === activePhotoId);
  const active = activeIndex >= 0 ? sorted[activeIndex] : null;

  function prevImage() {
    if (!active || !sorted.length) return;
    const next = (activeIndex - 1 + sorted.length) % sorted.length;
    setActivePhotoId(sorted[next]?.id ?? null);
  }

  function nextImage() {
    if (!active || !sorted.length) return;
    const next = (activeIndex + 1) % sorted.length;
    setActivePhotoId(sorted[next]?.id ?? null);
  }

  function toggleLike() {
    if (!active) return;
    const key = `hbn-photo-liked-${active.id}`;
    const countKey = `hbn-photo-like-count-${active.id}`;
    const liked = likedIds.includes(active.id);
    const nextLiked = liked ? likedIds.filter((id) => id !== active.id) : [...likedIds, active.id];
    setLikedIds(nextLiked);
    window.localStorage.setItem(key, liked ? "0" : "1");
    const current = likeCounts[active.id] ?? 0;
    const nextCount = liked ? Math.max(0, current - 1) : current + 1;
    setLikeCounts((prev) => ({ ...prev, [active.id]: nextCount }));
    window.localStorage.setItem(countKey, String(nextCount));
  }

  async function shareActive() {
    if (!active) return;
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/gallery/photo/${active.id}`
        : `/gallery/photo/${active.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Hayling Bike Night photo",
          text: "Check this bike night photo",
          url: shareUrl,
        });
        return;
      } catch {
        // Fall through to clipboard.
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  useEffect(() => {
    if (activePhotoId === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActivePhotoId(null);
      if (event.key === "ArrowLeft") prevImage();
      if (event.key === "ArrowRight") nextImage();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePhotoId, active, activeIndex, sorted]);

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {sorted.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-stone/50 bg-white shadow-sm ring-1 ring-black/[0.03] dark:border-zinc-700 dark:bg-[rgb(var(--color-card))] dark:ring-0"
          >
            <button type="button" className="block w-full text-left" onClick={() => setActivePhotoId(item.id)}>
              <div className="aspect-square bg-zinc-200">
                <img src={item.src} alt={item.alt} className="h-full w-full object-cover" loading="lazy" />
              </div>
            </button>
          </article>
        ))}
      </div>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => setActivePhotoId(null)}
            className="btn-secondary absolute right-4 top-4 min-h-[42px] px-4 py-2 text-xs sm:text-sm"
          >
            Close
          </button>
          <button
            type="button"
            onClick={prevImage}
            className="btn-secondary absolute left-3 min-h-[42px] px-3 py-2 text-xs sm:text-sm"
            aria-label="Previous image"
          >
            Prev
          </button>
          <div className="w-full max-w-6xl">
            <img src={active.src} alt={active.alt} className="max-h-[78vh] w-full rounded-md object-contain" />
            <div className="mt-3 rounded-lg border border-white/15 bg-black/35 p-3 text-sm text-zinc-100">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 flex-1 truncate text-left">{active.alt}</p>
                <p className="shrink-0">
                {activeIndex + 1} / {sorted.length}
                </p>
              </div>
              <div className="mt-3 flex w-full flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleLike}
                  className="btn-secondary min-h-[42px] px-4 py-2 text-xs sm:text-sm"
                >
                  {likedIds.includes(active.id) ? "Liked" : "Like"} ({likeCounts[active.id] ?? 0})
                </button>
                <button
                  type="button"
                  onClick={shareActive}
                  className="btn-secondary min-h-[42px] px-4 py-2 text-xs sm:text-sm"
                >
                  Share
                </button>
                <a
                  href={active.src}
                  download
                  className="btn-secondary min-h-[42px] px-4 py-2 text-xs sm:text-sm no-underline"
                >
                  Download
                </a>
              </div>
            </div>
            {copied ? <p className="mt-2 text-center text-xs text-zinc-300">Link copied</p> : null}
          </div>
          <button
            type="button"
            onClick={nextImage}
            className="btn-secondary absolute right-3 min-h-[42px] px-3 py-2 text-xs sm:text-sm"
            aria-label="Next image"
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
