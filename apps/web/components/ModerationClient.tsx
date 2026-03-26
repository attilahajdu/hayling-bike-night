"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteCommunityEventSubmission,
  publishCommunityEvent,
  setOfficialAlbumStatus,
  setPhotoStatus,
  setPhotosStatusBulk,
} from "@/app/actions/moderation";
import type { EventAttrs, OfficialAlbumAttrs, PhotoAttrs } from "@/lib/strapi";

type PhotoItem = { id: number; attributes: PhotoAttrs };
type AlbumItem = { id: number; attributes: OfficialAlbumAttrs };
type EventItem = { id: number; attributes: EventAttrs };

export function ModerationClient({
  items,
  albums,
  events,
}: {
  items: PhotoItem[];
  albums: AlbumItem[];
  events: EventItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);

  async function actPhoto(id: number, status: "published" | "rejected") {
    setBusy(`p-${id}`);
    try {
      await setPhotoStatus(id, status);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function actAlbum(id: number, status: "published" | "rejected") {
    setBusy(`a-${id}`);
    try {
      await setOfficialAlbumStatus(id, status);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  function togglePhoto(photoId: number) {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId],
    );
  }

  async function approveAllPending() {
    if (!items.length) return;
    setBusy("p-all-approve");
    try {
      await setPhotosStatusBulk(items.map((it) => it.id), "published");
      setSelectedPhotoIds([]);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function actEvent(id: number, action: "publish" | "delete") {
    setBusy(`e-${id}`);
    setErrorMsg(null);
    try {
      if (action === "publish") await publishCommunityEvent(id);
      else await deleteCommunityEventSubmission(id);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[moderation] actEvent failed", { id, action, msg });
      setErrorMsg(msg === "Unauthorized" ? "Not authorised to moderate events." : msg);
    } finally {
      setBusy(null);
    }
  }

  async function rejectSelected() {
    if (!selectedPhotoIds.length) return;
    setBusy("p-selected-reject");
    try {
      await setPhotosStatusBulk(selectedPhotoIds, "rejected");
      setSelectedPhotoIds([]);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (!items.length && !albums.length && !events.length) {
    return <p className="mt-8 text-xl text-zinc-500">Nothing waiting — you&apos;re caught up.</p>;
  }

  return (
    <div className="mt-8 space-y-10">
      {errorMsg ? (
        <div className="rounded-lg border border-red-700 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {errorMsg}
        </div>
      ) : null}
      <section>
        <h2 className="font-display font-bold text-2xl text-zinc-200">Suggested rides &amp; meets</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No pending ride or meet suggestions.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {events.map((ev) => {
              const a = ev.attributes;
              const when = new Date(a.dateStart).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
              return (
                <li key={ev.id} className="rounded-xl border border-zinc-700 bg-elevated p-4">
                  <p className="font-display font-bold text-xl text-zinc-200">{a.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{when}</p>
                  <p className="mt-1 text-sm text-zinc-400">{a.location}</p>
                  {a.submitterName || a.submitterEmail ? (
                    <p className="mt-2 text-xs text-zinc-500">
                      From: {a.submitterName ?? "—"} · {a.submitterEmail ?? "—"}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy === `e-${ev.id}`}
                      onClick={() => actEvent(ev.id, "publish")}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-green-500 disabled:opacity-50"
                    >
                      Approve & publish
                    </button>
                    <button
                      type="button"
                      disabled={busy === `e-${ev.id}`}
                      onClick={() => actEvent(ev.id, "delete")}
                      className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-950 disabled:opacity-50"
                    >
                      Decline (delete)
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold text-2xl text-zinc-200">Community photos</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-700 bg-elevated p-3">
          <button
            type="button"
            disabled={busy === "p-all-approve" || !items.length}
            onClick={approveAllPending}
            className="min-h-[48px] rounded-xl bg-green-600 px-4 py-2 font-display font-bold text-base uppercase text-zinc-100 hover:bg-green-500 disabled:opacity-50"
          >
            Approve and publish images to the website
          </button>
          <button
            type="button"
            disabled={busy === "p-selected-reject" || !selectedPhotoIds.length}
            onClick={rejectSelected}
            className="min-h-[48px] rounded-xl border-2 border-red-500 px-4 py-2 font-display font-bold text-base uppercase text-red-300 hover:bg-red-950 disabled:opacity-50"
          >
            Decline selected ({selectedPhotoIds.length})
          </button>
          <p className="text-sm text-zinc-400">{items.length} pending image(s)</p>
        </div>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((it) => {
            const p = it.attributes;
            const src = p.thumbnailUrl ?? p.imageUrl ?? null;
            const selected = selectedPhotoIds.includes(it.id);
            return (
              <li key={it.id} className={`overflow-hidden rounded-2xl border-2 bg-elevated ${selected ? "border-accent" : "border-zinc-700"}`}>
                <div className="aspect-square bg-black">
                  {src ? (
                    <img src={src} alt={p.title || "Pending upload"} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-600">No image</div>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input type="checkbox" checked={selected} onChange={() => togglePhoto(it.id)} />
                    Select to decline
                  </label>
                  <p className="font-display font-bold text-xl text-zinc-200">{p.title || "Untitled"}</p>
                  {p.submittedBy ? <p className="text-xs text-zinc-500">From: {p.submittedBy}</p> : null}
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" disabled={busy === `p-${it.id}`} onClick={() => actPhoto(it.id, "published")} className="min-h-[42px] rounded-lg bg-green-600 px-2 py-1 text-sm uppercase text-zinc-100 hover:bg-green-500 disabled:opacity-50">Approve</button>
                    <button type="button" disabled={busy === `p-${it.id}`} onClick={() => actPhoto(it.id, "rejected")} className="min-h-[42px] rounded-lg border border-red-500 px-2 py-1 text-sm uppercase text-red-300 hover:bg-red-950 disabled:opacity-50">Decline</button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-display font-bold text-2xl text-zinc-200">Official album submissions</h2>
        <ul className="mt-4 space-y-4">
          {albums.map((a) => (
            <li key={a.id} className="rounded-xl border border-zinc-700 bg-elevated p-4">
              <p className="font-display font-bold text-xl text-zinc-200">{a.attributes.title}</p>
              <p className="text-sm text-zinc-400">{a.attributes.submittedByName} · {a.attributes.submittedByEmail}</p>
              <a href={a.attributes.albumUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-accent">Open submitted album</a>
              <div className="mt-3 flex gap-3">
                <button type="button" disabled={busy === `a-${a.id}`} onClick={() => actAlbum(a.id, "published")} className="rounded bg-green-600 px-4 py-2 text-sm text-zinc-100">Approve</button>
                <button type="button" disabled={busy === `a-${a.id}`} onClick={() => actAlbum(a.id, "rejected")} className="rounded border border-red-500 px-4 py-2 text-sm text-red-300">Reject</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
