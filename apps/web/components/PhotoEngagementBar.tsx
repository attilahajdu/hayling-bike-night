"use client";

import { useEffect, useMemo, useState } from "react";

const storageKey = (photoId: number) => `hbn-photo-liked-${photoId}`;

export function PhotoEngagementBar({
  photoId,
  shareUrl,
}: {
  photoId: number;
  shareUrl: string;
}) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLiked(window.localStorage.getItem(storageKey(photoId)) === "1");
  }, [photoId]);

  const likeLabel = useMemo(() => (liked ? "Liked" : "Like"), [liked]);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(photoId), next ? "1" : "0");
    }
  };

  const onShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Hayling Bike Night photo",
          text: "Check this bike night photo",
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard below.
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={toggleLike}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-ink dark:border-zinc-600 dark:bg-zinc-900"
      >
        {likeLabel}
      </button>
      <button
        type="button"
        onClick={onShare}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm text-ink dark:border-zinc-600 dark:bg-zinc-900"
      >
        Share
      </button>
      {copied ? <span className="text-sm text-zinc-600 dark:text-zinc-400">Link copied</span> : null}
    </div>
  );
}
