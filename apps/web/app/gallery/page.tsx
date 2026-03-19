import Link from "next/link";
import { GalleryGrid } from "@/components/GalleryGrid";
import { getEvents, getPhotos } from "@/lib/strapi";

export const revalidate = 30;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const eventSlug = sp.event;
  const q = sp.q;

  const [eventsRes, photosRes] = await Promise.all([
    getEvents(),
    getPhotos({ pageSize: 48, eventSlug, q }),
  ]);

  const events = eventsRes?.data ?? [];
  const photos = photosRes?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl uppercase text-white">Gallery</h1>
      <p className="mt-4 max-w-2xl text-sm text-zinc-400">
        Filter by meet night, then search <span className="text-accent">subject keywords</span> (plate fragment, bike colour,
        leathers, helmet — whatever organisers and photographers have tagged). Thumbnails from partner photographers open their
        own site for prints and downloads.
      </p>

      <form className="mt-8 flex flex-col gap-4 rounded border border-zinc-800 bg-elevated p-4 sm:flex-row sm:items-end" method="get">
        <div className="flex-1">
          <label htmlFor="event" className="block text-xs uppercase text-zinc-500">
            Meet night
          </label>
          <select
            id="event"
            name="event"
            defaultValue={eventSlug ?? ""}
            className="mt-1 w-full rounded border border-zinc-700 bg-surface px-3 py-2 text-sm text-white"
          >
            <option value="">All dates</option>
            {events.map((e) => (
              <option key={e.id} value={e.attributes.slug}>
                {e.attributes.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="q" className="block text-xs uppercase text-zinc-500">
            Find my bike / kit
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="e.g. blue R1, black jacket, plate ending 7"
            className="mt-1 w-full rounded border border-zinc-700 bg-surface px-3 py-2 text-sm text-white"
          />
        </div>
        <button
          type="submit"
          className="rounded bg-accent px-6 py-2 font-display text-lg uppercase tracking-wide text-black hover:bg-orange-500"
        >
          Search
        </button>
      </form>

      <div className="mt-10">
        <GalleryGrid items={photos} />
      </div>

      <p className="mt-10 text-center text-xs text-zinc-500">
        Are we missing your shots?{" "}
        <Link href="/auth/signin" className="text-accent">
          Sign in
        </Link>{" "}
        to upload (coming soon) or ask an organiser to tag your keywords.
      </p>
    </div>
  );
}
