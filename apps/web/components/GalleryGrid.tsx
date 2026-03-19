"use client";

/* External photographer URLs are arbitrary domains — native img + lazy load. */
/* eslint-disable @next/next/no-img-element */

import type { PhotoAttrs } from "@/lib/strapi";
import { mediaUrl } from "@/lib/strapi";

type Item = { id: number; attributes: PhotoAttrs };

function thumbSrc(p: PhotoAttrs): string | null {
  if (p.thumbnailUrl) return p.thumbnailUrl;
  const img = p.image?.data?.attributes;
  return img ? mediaUrl(img) : null;
}

function largeSrc(p: PhotoAttrs): string | null {
  const img = p.image?.data?.attributes;
  if (img && mediaUrl(img)) return mediaUrl(img);
  return p.thumbnailUrl ?? null;
}

export function GalleryGrid({ items }: { items: Item[] }) {
  if (!items.length) {
    return <p className="text-zinc-500">No photos match these filters yet.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {items.map((it) => {
        const p = it.attributes;
        const src = thumbSrc(p);
        const full = largeSrc(p);
        const external = Boolean(p.isExternal || p.purchaseUrl || p.sourcePageUrl);
        const outbound = p.purchaseUrl ?? p.sourcePageUrl;

        return (
          <li key={it.id} className="relative aspect-square overflow-hidden rounded border border-zinc-800 bg-elevated">
            {full ? (
              <a href={full} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                {src ? (
                  <img
                    src={src}
                    alt={p.caption ?? p.title ?? "Meet photo"}
                    className="h-full w-full object-cover transition hover:opacity-90"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-zinc-500">Open image</div>
                )}
              </a>
            ) : src ? (
              <img
                src={src}
                alt={p.caption ?? p.title ?? "Meet photo"}
                className="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">No preview</div>
            )}
            {external ? (
              <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[10px] uppercase text-accent">
                Photographer
              </span>
            ) : null}
            {outbound ? (
              <a
                href={outbound}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1 text-center text-[11px] text-accent no-underline hover:underline"
              >
                Buy / full gallery →
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
