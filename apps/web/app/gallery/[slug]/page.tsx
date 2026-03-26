import Link from "next/link";
import { GalleryGrid } from "@/components/GalleryGrid";
import {
  getGalleryEntryBySlug,
  getOfficialAlbums,
  getPhotosAllMatching,
  getPublishedCommunityPhotoTotal,
} from "@/lib/strapi";

export const dynamic = "force-dynamic";

export default async function GalleryEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const q = sp.q ?? "";
  const qTrim = q.trim();

  const [entry, communityRes, albumsRes, publishedWeekTotal] = await Promise.all([
    getGalleryEntryBySlug(slug),
    getPhotosAllMatching({
      galleryEntrySlug: slug,
      source: "community",
      ...(qTrim ? { q } : {}),
      pageSize: 100,
    }),
    getOfficialAlbums({ galleryEntrySlug: slug, status: "published" }),
    qTrim ? Promise.resolve(undefined as number | undefined) : getPublishedCommunityPhotoTotal({ galleryEntrySlug: slug }),
  ]);

  if (!entry) return <div className="shell py-12 text-zinc-600 dark:text-zinc-300">Gallery entry not found.</div>;

  const communityPhotos = (communityRes?.data ?? []).filter((p) => p.attributes.isExternal !== true);
  const communityPublishedCount = qTrim ? communityPhotos.length : (publishedWeekTotal ?? communityPhotos.length);
  const liveAt = entry.attributes.galleryLiveAt ? new Date(entry.attributes.galleryLiveAt).toLocaleString("en-GB") : "Pending";

  const proCards =
    albumsRes?.data?.map((a) => ({
      id: String(a.id),
      title: a.attributes.title,
      albumUrl: a.attributes.albumUrl,
      websiteUrl: a.attributes.shopUrl ?? a.attributes.albumUrl,
      coverImageUrl: a.attributes.coverImageUrl ?? null,
      shortDescription:
        a.attributes.shortDescription ?? a.attributes.photographer?.data?.attributes.bio ?? null,
      submittedByName: a.attributes.photographer?.data?.attributes.name ?? a.attributes.submittedByName ?? "Photographer",
    })) ?? [];

  return (
    <div className="shell py-12">
      <section className="card p-6">
        <h1 className="section-title">{entry.attributes.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Gallery live: {liveAt} · Pro photographers first, community uploads/videos underneath.
        </p>
        <form method="get" className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search community tags, bike make, colour, uploader"
            className="h-11 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-ink placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:placeholder:text-zinc-400"
          />
          <button type="submit" className="btn-primary h-11 px-5">Search</button>
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="section-title text-3xl">Professional Photographers</h2>
          <Link href="/submit-album" className="text-sm text-accent">Submit weekly gallery →</Link>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          Required each week: gallery URL and one thumbnail.
        </p>
        {proCards.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">No pro photographer galleries to show for this week yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {proCards.slice(0, 4).map((p) => (
              <li key={p.id} className="card overflow-hidden">
                <div className="aspect-[16/9] overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                  {p.coverImageUrl ? (
                    <img
                      src={p.coverImageUrl}
                      alt={p.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-2xl uppercase text-ink">{p.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{p.submittedByName}</p>
                  {p.shortDescription ? (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">{p.shortDescription}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <Link href={p.albumUrl} target="_blank" className="text-accent">
                      Open latest gallery →
                    </Link>
                    <Link href={p.websiteUrl} target="_blank" className="text-accent">
                      Website →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="section-title text-3xl">Community Photos & Videos</h2>
          <Link href="/upload" className="text-sm text-accent">Upload yours →</Link>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {qTrim
            ? `Matching community photos (${communityPublishedCount} items).`
            : `Published community photos for this gallery week (${communityPublishedCount} items).`}
        </p>
        {communityPhotos.length ? (
          <GalleryGrid items={communityPhotos} />
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">No community photos to show yet.</p>
        )}
      </section>
    </div>
  );
}
