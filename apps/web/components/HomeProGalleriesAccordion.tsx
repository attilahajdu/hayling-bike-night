"use client";

import Link from "next/link";
import { useState } from "react";

export type ProGalleryCard = {
  id: string;
  title: string;
  albumUrl: string;
  websiteUrl: string;
  coverImageUrl: string;
  photographer: string;
  dateLabel: string;
};

function ProGalleryCardArticle({ card }: { card: ProGalleryCard }) {
  return (
    <article className="card overflow-hidden">
      <div className="aspect-[4/3] bg-zinc-200">
        <img src={card.coverImageUrl} alt={card.title} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <div className="p-3">
        <p className="font-display font-bold text-xl uppercase text-ink">{card.title}</p>
        <p className="text-xs uppercase tracking-wide text-zinc-500">{card.photographer}</p>
        <p className="text-xs uppercase tracking-wide text-warm">{card.dateLabel}</p>
        <div className="mt-2 flex gap-3 text-sm">
          <Link href={card.albumUrl} target="_blank" className="text-accent">
            Gallery →
          </Link>
          <Link href={card.websiteUrl} target="_blank" className="text-accent">
            Website →
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Mobile: collapsed shows the spotlight “latest” card; expanded lists official albums from the last 7 days
 * (or the rest of the merged spotlight when none fall in that window). Button toggles “See all pro galleries” /
 * “Show latest only”.
 */
export function HomeProGalleriesAccordion({
  latest,
  expandedAlbums,
}: {
  latest: ProGalleryCard;
  /** Full list when expanded (newest first). */
  expandedAlbums: ProGalleryCard[];
}) {
  const [open, setOpen] = useState(false);
  const canToggle = expandedAlbums.length > 0;

  return (
    <div className="mt-4 sm:hidden">
      {!open ? (
        <ProGalleryCardArticle card={latest} />
      ) : (
        <div className="space-y-3">
          {expandedAlbums.map((card) => (
            <ProGalleryCardArticle key={card.id} card={card} />
          ))}
        </div>
      )}

      {canToggle ? (
        <button
          type="button"
          className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {open ? "Show latest only" : "See all pro galleries"}
          <span className="text-[11px]" aria-hidden>
            {open ? "▲" : "▼"}
          </span>
        </button>
      ) : null}

      {open ? (
        <p className="mt-3">
          <Link
            href="/gallery#pro-galleries"
            className="inline-flex text-sm font-semibold text-accent no-underline hover:no-underline"
          >
            Open full galleries page →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
