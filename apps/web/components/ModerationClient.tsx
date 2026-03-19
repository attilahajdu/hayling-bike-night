"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPhotoStatus } from "@/app/actions/moderation";
import type { PhotoAttrs } from "@/lib/strapi";
import { mediaUrl } from "@/lib/strapi";

type Item = { id: number; attributes: PhotoAttrs };

export function ModerationClient({ items }: { items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);

  async function act(id: number, status: "published" | "rejected") {
    setBusy(id);
    try {
      await setPhotoStatus(id, status);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  if (!items.length) {
    return <p className="mt-8 text-xl text-zinc-500">Nothing waiting — you&apos;re caught up.</p>;
  }

  return (
    <ul className="mt-8 space-y-8">
      {items.map((it) => {
        const p = it.attributes;
        const img = p.image?.data?.attributes;
        const src = p.thumbnailUrl ?? (img ? mediaUrl(img) : null);
        return (
          <li key={it.id} className="rounded-2xl border-2 border-zinc-700 bg-elevated p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_200px] md:items-center">
              <div className="flex gap-4">
                <div className="h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-zinc-600 bg-black">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-600">No image</div>
                  )}
                </div>
                <div>
                  <p className="font-display text-2xl text-white">{p.title || "Untitled"}</p>
                  {p.caption ? <p className="mt-2 text-sm text-zinc-400">{p.caption}</p> : null}
                  {p.submittedBy ? <p className="mt-2 text-xs text-zinc-500">From: {p.submittedBy}</p> : null}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={busy === it.id}
                  onClick={() => act(it.id, "published")}
                  className="min-h-[52px] rounded-xl bg-green-600 py-3 font-display text-2xl uppercase text-white hover:bg-green-500 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy === it.id}
                  onClick={() => act(it.id, "rejected")}
                  className="min-h-[52px] rounded-xl border-2 border-red-500 py-3 font-display text-2xl uppercase text-red-400 hover:bg-red-950 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
