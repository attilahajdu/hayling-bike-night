"use client";

import { useEffect, useMemo, useState } from "react";
import { readLocalLikeCount } from "@/lib/photo-local-likes";

export type ShowcaseItem =
  | { id: string; src: string; source: "facebook"; uploader: string }
  | {
      id: string;
      src: string;
      source: "community";
      photoId: number;
      uploader: string;
      subjectKeywords: string | null;
      external: boolean;
    };

function ShowcaseSourceBadge({ item }: { item: ShowcaseItem }) {
  const shell =
    "rounded-full border border-white/45 px-2 py-0.5 text-[10px] leading-snug text-white/90 drop-shadow-[0_1px_2px_rgb(0_0_0/0.65)]";

  if (item.source === "facebook") {
    return (
      <span
        className={`${shell} max-w-[min(7rem,calc(100%-1rem))] shrink-0 truncate text-center font-medium uppercase tracking-wide`}
      >
        Facebook
      </span>
    );
  }

  if (item.external) {
    return (
      <span
        className={`${shell} max-w-[min(7rem,calc(100%-1rem))] shrink-0 truncate text-center font-medium uppercase tracking-wide`}
      >
        Official
      </span>
    );
  }

  const keywordsRaw = (item.subjectKeywords ?? "").trim();
  const tagsLabel = keywordsRaw.length ? keywordsRaw : "—";

  return (
    <span className={`${shell} max-w-[min(13rem,calc(100%-1rem))] min-w-0`} title={keywordsRaw.length ? keywordsRaw : undefined}>
      <span className="block truncate text-left">
        <span className="font-medium">Tags:</span> <span className="font-normal normal-case">{tagsLabel}</span>
      </span>
    </span>
  );
}

/**
 * Builds a 4-tile strip: community photos sorted by local “likes” first, then Facebook
 * to fill remaining slots (so community isn’t buried after 12 Facebook images).
 */
export function LandingShowcaseStrip({ facebook, community }: { facebook: ShowcaseItem[]; community: ShowcaseItem[] }) {
  const [ready, setReady] = useState(false);

  const sorted = useMemo(() => {
    const comm = community.filter((c): c is Extract<ShowcaseItem, { source: "community" }> => c.source === "community");
    const scored = comm.map((c) => ({
      item: c,
      likes: ready ? readLocalLikeCount(c.photoId) : 0,
    }));
    scored.sort((a, b) => {
      if (b.likes !== a.likes) return b.likes - a.likes;
      return b.item.photoId - a.item.photoId;
    });
    const communityOrdered = scored.map((s) => s.item);
    const fb = facebook.filter((f): f is Extract<ShowcaseItem, { source: "facebook" }> => f.source === "facebook");
    const merged: ShowcaseItem[] = [];
    const max = 4;
    for (let i = 0; i < communityOrdered.length && merged.length < max; i++) {
      merged.push(communityOrdered[i]);
    }
    for (let i = 0; i < fb.length && merged.length < max; i++) {
      merged.push(fb[i]);
    }
    return merged.slice(0, max);
  }, [facebook, community, ready]);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div className="grid gap-5 md:grid-cols-4">
      {sorted.map((item) => (
        <div key={item.id} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-zinc-800">
          <img src={item.src} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
          <div className="absolute left-2 top-2 max-w-[calc(100%-1rem)]">
            <ShowcaseSourceBadge item={item} />
          </div>
        </div>
      ))}
    </div>
  );
}
