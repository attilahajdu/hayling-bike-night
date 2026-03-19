import Link from "next/link";
import { Hero } from "@/components/Hero";
import { getEvents, getNewsList, getPhotos, mediaUrl } from "@/lib/strapi";

export const revalidate = 60;

export default async function HomePage() {
  const [events, news, photos] = await Promise.all([
    getEvents({ upcoming: true }),
    getNewsList(),
    getPhotos({ pageSize: 8 }),
  ]);

  const nextEvents = events?.data?.slice(0, 4) ?? [];
  const latestNews = news?.data?.slice(0, 3) ?? [];
  const gallery = photos?.data ?? [];

  return (
    <>
      <Hero />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
        <section aria-labelledby="upcoming">
          <h2 id="upcoming" className="font-display text-3xl uppercase text-white">
            Upcoming dates
          </h2>
          <ul className="mt-4 space-y-3">
            {nextEvents.length === 0 ? (
              <li className="text-zinc-500">Connect Strapi to load this season&apos;s Thursdays — or check back soon.</li>
            ) : (
              nextEvents.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-800 py-2">
                  <Link href={`/events/${e.attributes.slug}`} className="font-display text-xl text-white no-underline hover:text-accent">
                    {e.attributes.title}
                  </Link>
                  <time className="text-sm text-zinc-400" dateTime={e.attributes.dateStart}>
                    {new Date(e.attributes.dateStart).toLocaleString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </li>
              ))
            )}
          </ul>
          <Link href="/events" className="mt-4 inline-block text-sm text-accent">
            All events →
          </Link>
        </section>

        <section aria-labelledby="news">
          <h2 id="news" className="font-display text-3xl uppercase text-white">
            Latest news
          </h2>
          <ul className="mt-4 grid gap-6 md:grid-cols-3">
            {latestNews.length === 0 ? (
              <li className="text-zinc-500 md:col-span-3">No posts yet.</li>
            ) : (
              latestNews.map((n) => (
                <li key={n.id} className="rounded border border-zinc-800 bg-elevated p-4">
                  <Link href={`/news/${n.attributes.slug}`} className="font-display text-xl text-white no-underline hover:text-accent">
                    {n.attributes.title}
                  </Link>
                  {n.attributes.tags ? <p className="mt-2 text-xs uppercase text-accent">{n.attributes.tags}</p> : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <section aria-labelledby="gallery">
          <h2 id="gallery" className="font-display text-3xl uppercase text-white">
            From the meet
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Community shots and photographer thumbnails. Opens full-size in the gallery; purchases stay on the photographer&apos;s own site.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {gallery.length === 0 ? (
              <p className="col-span-full text-zinc-500">No published photos yet.</p>
            ) : (
              gallery.map((ph) => {
                const img = ph.attributes.image?.data?.attributes;
                const url = ph.attributes.thumbnailUrl ?? (img ? mediaUrl(img) : null);
                return (
                  <Link
                    key={ph.id}
                    href="/gallery"
                    className="relative aspect-square overflow-hidden rounded border border-zinc-800 bg-black"
                  >
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-600">Photo</div>
                    )}
                  </Link>
                );
              })
            )}
          </div>
          <Link href="/gallery" className="mt-4 inline-block text-sm text-accent">
            Open gallery →
          </Link>
        </section>
      </div>
    </>
  );
}
