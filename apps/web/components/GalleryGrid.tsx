"use client";

/* External photographer URLs are arbitrary domains — native img + lazy load. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import type { PhotoAttrs } from "@/lib/strapi";

type Item = { id: number; attributes: PhotoAttrs };

function thumbSrc(p: PhotoAttrs): string | null {
  return p.thumbnailUrl ?? p.imageUrl ?? null;
}

function createdMs(attrs: PhotoAttrs): number {
  const raw = attrs.createdAt ?? attrs.updatedAt;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function GalleryGrid({
  items,
  sortMode = "likes",
}: {
  items: Item[];
  /** `likes` = localStorage counts (per browser). `latest` = Strapi createdAt. */
  sortMode?: "likes" | "latest";
}) {
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [copied, setCopied] = useState(false);

  const sortedItems = useMemo(() => {
    const copy = [...items];
    if (sortMode === "latest") {
      copy.sort((a, b) => {
        const tb = createdMs(b.attributes);
        const ta = createdMs(a.attributes);
        if (tb !== ta) return tb - ta;
        return b.id - a.id;
      });
      return copy;
    }
    return copy.sort((a, b) => {
      const aLikes = likeCounts[a.id] ?? 0;
      const bLikes = likeCounts[b.id] ?? 0;
      if (bLikes !== aLikes) return bLikes - aLikes;
      return b.id - a.id;
    });
  }, [items, likeCounts, sortMode]);
  const activeIndex = activePhotoId === null ? null : sortedItems.findIndex((it) => it.id === activePhotoId);
  const active = activeIndex === null || activeIndex < 0 ? null : sortedItems[activeIndex];
  const activeId = active?.id ?? null;
  const activeAttrs = active?.attributes ?? null;
  const activeSrc = activeAttrs ? (activeAttrs.imageUrl ?? activeAttrs.thumbnailUrl ?? null) : null;
  const activeUploader = useMemo(
    () => (activeAttrs ? (activeAttrs.uploaderHandle ?? activeAttrs.submittedBy ?? "community") : ""),
    [activeAttrs],
  );
  const activeOutbound = activeAttrs ? (activeAttrs.purchaseUrl ?? activeAttrs.sourcePageUrl ?? null) : null;

  function closeModal() {
    setActivePhotoId(null);
    setCopied(false);
  }

  function prevImage() {
    if (activeIndex === null || activeIndex < 0 || !sortedItems.length) return;
    const nextIndex = (activeIndex - 1 + sortedItems.length) % sortedItems.length;
    setActivePhotoId(sortedItems[nextIndex]?.id ?? null);
  }

  function nextImage() {
    if (activeIndex === null || activeIndex < 0 || !sortedItems.length) return;
    const nextIndex = (activeIndex + 1) % sortedItems.length;
    setActivePhotoId(sortedItems[nextIndex]?.id ?? null);
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  }

  function onTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX;
    const delta = endX - touchStartX;
    const threshold = 50;
    if (delta <= -threshold) nextImage();
    if (delta >= threshold) prevImage();
    setTouchStartX(null);
  }

  useEffect(() => {
    const initialLiked = items
      .map((it) => it.id)
      .filter((id) => window.localStorage.getItem(`hbn-photo-liked-${id}`) === "1");
    setLikedIds(initialLiked);
    const initialCounts: Record<number, number> = {};
    for (const it of items) {
      const seeded = Number(it.attributes.likeCount ?? 0);
      initialCounts[it.id] = Number.isFinite(seeded) && seeded > 0 ? seeded : 0;
    }
    setLikeCounts(initialCounts);

    const ids = items.map((it) => it.id).join(",");
    void fetch(`/api/photo-likes?ids=${encodeURIComponent(ids)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { counts?: Record<string, number> } | null) => {
        const counts = json?.counts ?? {};
        setLikeCounts((prev) => {
          const next = { ...prev };
          for (const [id, count] of Object.entries(counts)) {
            const n = Number(count);
            next[Number(id)] = Number.isFinite(n) && n > 0 ? n : 0;
          }
          return next;
        });
      })
      .catch(() => {
        // Keep seeded values when API is unavailable.
      });
  }, [items]);

  useEffect(() => {
    if (activePhotoId === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
      if (event.key === "ArrowLeft") prevImage();
      if (event.key === "ArrowRight") nextImage();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePhotoId, activeIndex, sortedItems]);

  if (!items.length) {
    return <p className="text-zinc-500 dark:text-zinc-400">No photos match these filters yet.</p>;
  }

  async function toggleLike() {
    if (!activeId) return;
    const key = `hbn-photo-liked-${activeId}`;
    const liked = likedIds.includes(activeId);
    const nextLiked = liked ? likedIds.filter((id) => id !== activeId) : [...likedIds, activeId];
    const current = likeCounts[activeId] ?? 0;
    const optimistic = liked ? Math.max(0, current - 1) : current + 1;
    setLikedIds(nextLiked);
    window.localStorage.setItem(key, liked ? "0" : "1");
    setLikeCounts((prev) => ({ ...prev, [activeId]: optimistic }));

    try {
      const res = await fetch("/api/photo-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: activeId, delta: liked ? -1 : 1 }),
      });
      const json = (await res.json().catch(() => null)) as { likeCount?: number } | null;
      if (!res.ok || typeof json?.likeCount !== "number") throw new Error("like-update-failed");
      setLikeCounts((prev) => ({ ...prev, [activeId]: Math.max(0, Number(json.likeCount) || 0) }));
    } catch {
      // Revert optimistic state when server update fails.
      setLikedIds((prev) => (liked ? [...prev, activeId] : prev.filter((id) => id !== activeId)));
      window.localStorage.setItem(key, liked ? "1" : "0");
      setLikeCounts((prev) => ({ ...prev, [activeId]: current }));
    }
  }

  async function shareActive() {
    if (!activeId) return;
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/gallery/photo/${activeId}`
        : `/gallery/photo/${activeId}`;

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

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sortedItems.map((it) => {
          const p = it.attributes;
          const src = thumbSrc(p);
          const outbound = p.purchaseUrl ?? p.sourcePageUrl;
          const external = Boolean(p.isExternal || outbound);
          const likes = likeCounts[it.id] ?? 0;
          const keywordsRaw = (p.subjectKeywords ?? "").trim();
          const tagsLabel = keywordsRaw.length ? keywordsRaw : "—";

          return (
            <li
              key={it.id}
              className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]"
            >
              <button type="button" onClick={() => setActivePhotoId(it.id)} className="group block w-full text-left">
                {src ? (
                  <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={src}
                      alt={p.caption ?? p.title ?? "Meet photo"}
                      className="h-full w-full object-cover transition group-hover:opacity-[0.97]"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute left-2 top-2 rounded bg-zinc-900/80 px-2 py-1 text-[10px] font-medium tabular-nums text-zinc-200">
                      {likes} likes
                    </span>
                  </div>
                ) : (
                  <div className="aspect-square bg-zinc-100 dark:bg-zinc-800" />
                )}
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400">
                    @{p.uploaderHandle ?? p.submittedBy ?? "community"}
                  </span>
                  {external ? (
                    <span className="max-w-[min(7rem,42%)] shrink-0 truncate rounded-full border border-zinc-300/80 px-2 py-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-600/80 dark:text-zinc-400">
                      Official
                    </span>
                  ) : (
                    <span
                      className="max-w-[min(13rem,55%)] min-w-0 shrink-0 rounded-full border border-zinc-300/80 px-2 py-0.5 text-zinc-500 dark:border-zinc-600/80 dark:text-zinc-400"
                      title={keywordsRaw.length ? keywordsRaw : undefined}
                    >
                      <span className="block truncate text-left text-[10px] leading-snug">
                        <span className="font-medium">Tags:</span>{" "}
                        <span className="font-normal normal-case">{tagsLabel}</span>
                      </span>
                    </span>
                  )}
                </div>
              </button>
              {outbound ? <a href={outbound} target="_blank" rel="noopener noreferrer" className="block border-t border-stone/30 px-3 py-2 text-xs text-accent no-underline">Buy / full gallery →</a> : null}
            </li>
          );
        })}
      </ul>

      {active && activeIndex !== null && activeIndex >= 0 ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            onClick={closeModal}
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
            {activeSrc ? (
              <img src={activeSrc} alt={activeAttrs?.caption ?? activeAttrs?.title ?? "Gallery photo"} className="max-h-[78vh] w-full rounded-md object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex min-h-[40vh] items-center justify-center rounded-md bg-zinc-900/80 px-6 py-12 text-center text-sm text-zinc-300">
                <p>
                  No image URL on this record (or file not on this server). Metadata and tags still show below — full fix is storing images on Strapi/Supabase for production.
                </p>
              </div>
            )}
            <div className="mt-3 rounded-lg border border-white/15 bg-black/35 p-3 text-sm text-zinc-100">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-left">@{activeUploader}</p>
                <p className="shrink-0">
                {activeIndex + 1} / {sortedItems.length}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={toggleLike} className="btn-secondary min-h-[42px] px-4 py-2 text-xs sm:text-sm">
                  {activeId && likedIds.includes(activeId) ? "Liked" : "Like"} ({activeId ? likeCounts[activeId] ?? 0 : 0})
                </button>
                <button type="button" onClick={shareActive} className="btn-secondary min-h-[42px] px-4 py-2 text-xs sm:text-sm">
                  Share
                </button>
                {activeSrc ? (
                  <a href={activeSrc} download className="btn-secondary min-h-[42px] px-4 py-2 text-xs sm:text-sm no-underline">
                    Download
                  </a>
                ) : null}
                {activeOutbound ? (
                  <a href={activeOutbound} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-[42px] px-4 py-2 text-xs sm:text-sm no-underline">
                    Buy / full gallery
                  </a>
                ) : null}
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
