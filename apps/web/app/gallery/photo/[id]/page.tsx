import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoEngagementBar } from "@/components/PhotoEngagementBar";
import { getPhotoById } from "@/lib/strapi";

export const dynamic = "force-dynamic";

export default async function GalleryPhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photoId = Number(id);
  if (!Number.isFinite(photoId)) return notFound();

  const photo = await getPhotoById(photoId);
  if (!photo || photo.attributes.status !== "published") return notFound();

  const p = photo.attributes;
  const imageSrc = p.imageUrl ?? p.thumbnailUrl;
  if (!imageSrc) return notFound();

  const uploader = p.uploaderHandle ?? p.submittedBy ?? p.photographer?.data?.attributes.name ?? "community";
  const shareUrl = `/gallery/photo/${photoId}`;

  return (
    <div className="shell py-10">
      <Link href="/gallery" className="text-sm text-accent">← Back to gallery</Link>
      <section className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]">
          <img
            src={imageSrc}
            alt={p.caption ?? p.title ?? "Hayling Bike Night photo"}
            className="w-full bg-zinc-100 object-contain dark:bg-zinc-900"
          />
        </div>
        <aside className="card p-5">
          <h1 className="font-display font-bold text-4xl uppercase text-ink">{p.title ?? "Community Photo"}</h1>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            Uploaded by <span className="font-semibold">@{uploader}</span>
          </p>
          {p.caption ? <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{p.caption}</p> : null}
          {p.subjectKeywords ? <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">Tags: {p.subjectKeywords}</p> : null}
          <PhotoEngagementBar photoId={photoId} shareUrl={shareUrl} />
        </aside>
      </section>
    </div>
  );
}
