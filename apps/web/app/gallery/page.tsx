import Link from "next/link";
import { GalleryGrid } from "@/components/GalleryGrid";
import { GalleryHashScroll } from "@/components/GalleryHashScroll";
import type { OfficialAlbumAttrs } from "@/lib/strapi";
import { getBikeNightWeekIsoRange } from "@/lib/bike-night-week";
import {
  getGalleryEntries,
  getOfficialAlbums,
  getOfficialAlbumsAllMatching,
  getPhotosAllMatching,
  getPublishedCommunityPhotoTotal,
} from "@/lib/strapi";

export const dynamic = "force-dynamic";

function formatMeetDateUk(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatCalendarDateNoWeekday(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function mostRecentThursday(ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setHours(12, 0, 0, 0);
  const dow = d.getDay();
  const daysSinceThu = (dow + 7 - 4) % 7;
  d.setDate(d.getDate() - daysSinceThu);
  return d;
}

function albumWeekLine(attrs: OfficialAlbumAttrs, thisWeekFallback: string): string {
  const iso = attrs.galleryEntry?.data?.attributes.galleryLiveAt;
  const formatted = formatCalendarDateNoWeekday(iso);
  return formatted ? `Gallery week · ${formatted}` : thisWeekFallback;
}

export default async function GalleryHubPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const qTrim = q.trim();
  const searchMode = qTrim.length > 0;

  const allEntriesRes = await getGalleryEntries();
  const allEntries = allEntriesRes?.data ?? [];
  const latest = allEntries[0];
  const pastWeekEntries = allEntries.length > 1 ? allEntries.slice(1) : [];

  let official: NonNullable<Awaited<ReturnType<typeof getOfficialAlbums>>>["data"];
  let displayCommunity: NonNullable<Awaited<ReturnType<typeof getPhotosAllMatching>>>["data"];
  let pastDisplayed: typeof allEntries;
  let communityCountLine: string;

  const cardDateLabel =
    formatCalendarDateNoWeekday(latest?.attributes.galleryLiveAt) ??
    mostRecentThursday().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  if (searchMode) {
    const [weeksMatch, albumsMatch, photosMatch] = await Promise.all([
      getGalleryEntries({ q: qTrim }),
      getOfficialAlbumsAllMatching({ status: "published", q: qTrim }),
      getPhotosAllMatching({ q: qTrim, source: "community" }),
    ]);
    pastDisplayed = weeksMatch?.data ?? [];
    official = albumsMatch?.data ?? [];
    displayCommunity = (photosMatch?.data ?? []).filter((p) => p.attributes.isExternal !== true);
    const n = displayCommunity.length;
    communityCountLine =
      n === 0 ? "No community photos match that search" : n === 1 ? "1 photo matches your search" : `${n} photos match your search`;
  } else {
    const bikeNightWeek = getBikeNightWeekIsoRange();
    const [officialRes, recentOfficialRes, communityRes, recentCommunityRes, weekCommunityTotal] = await Promise.all([
      latest ? getOfficialAlbums({ galleryEntrySlug: latest.attributes.slug, status: "published" }) : Promise.resolve(null),
      getOfficialAlbums({ status: "published" }),
      getPhotosAllMatching({
        source: "community",
        updatedAtGte: bikeNightWeek.gte,
        updatedAtLt: bikeNightWeek.lt,
        pageSize: 100,
        maxPages: 120,
      }),
      getPhotosAllMatching({
        source: "community",
        pageSize: 100,
        maxPages: 120,
      }),
      getPublishedCommunityPhotoTotal({
        updatedAtGte: bikeNightWeek.gte,
        updatedAtLt: bikeNightWeek.lt,
      }),
    ]);

    const officialForWeek = officialRes?.data ?? [];
    const recentOfficial = recentOfficialRes?.data ?? [];
    const seen = new Set<number>();
    const mergedOfficial: typeof officialForWeek = [];
    for (const a of officialForWeek) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        mergedOfficial.push(a);
      }
    }
    for (const a of recentOfficial) {
      if (mergedOfficial.length >= 4) break;
      if (!seen.has(a.id)) {
        seen.add(a.id);
        mergedOfficial.push(a);
      }
    }
    official = mergedOfficial.length ? mergedOfficial : recentOfficial;
    const community = (communityRes?.data ?? []).filter((p) => p.attributes.isExternal !== true);
    const recentCommunity = (recentCommunityRes?.data ?? []).filter((p) => p.attributes.isExternal !== true);
    displayCommunity = community.length ? community : recentCommunity;
    pastDisplayed = pastWeekEntries;
    const n = weekCommunityTotal;
    const showingRecentBecauseWeekEmpty = n === 0 && displayCommunity.length > 0;
    communityCountLine = showingRecentBecauseWeekEmpty
      ? "No photos for this gallery week yet — recent uploads below"
      : n === 0
        ? "No community photos yet this week"
        : n === 1
          ? "1 photo shared so far this week"
          : `${n} photos shared so far this week`;
  }

  const starterPros = [
    {
      id: "starter-1",
      title: "Michael Jones-Price Photography",
      albumUrl:
        "https://michaeljones-pricephotography.pixieset.com/rykassessionarrivalsonly09001300-3/?fbclid=IwY2xjawQqAUpleHRuA2FlbQIxMQBzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEewQToGTI8mwRx77U20oa4rj5_9_4bkUSJ0bYCx_yS_nGfK5PCVHMzYtiYKbo_aem_oUY4_SyE26bZ-sQJNAAv1A",
      websiteUrl: "https://michaeljones-pricephotography.pixieset.com",
      coverImageUrl: "/images/hayling-badge.png",
      photographer: "Michael Jones-Price",
      shortDescription: "Trackside and arrivals coverage with clean event shots.",
      dateLabel: "21 August 2025",
    },
    {
      id: "starter-2",
      title: "The Right Bikes",
      albumUrl:
        "https://www.therightbikes.com/?fbclid=IwY2xjawQqAnJleHRuA2FlbQIxMABicmlkETFkdE5RaTJlT1k0R0xSbXlmc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHk-cnNhYxOlCMYOD_FmP302hjwxZYql-wQ8p2QBRifRdl5Szs21vTAZUpC2n_aem_OLqIvp0tJyJ6ni1wkZ1diA",
      websiteUrl: "https://www.therightbikes.com",
      coverImageUrl: "/images/ridebikes.png",
      photographer: "The Right Bikes",
      shortDescription: "Bike night stories and regular community ride coverage.",
      dateLabel: "21 August 2025",
    },
  ];
  const communityFallback = [
    { id: "community-owner", src: "/images/owner.jpg", label: "Community upload · 21 August 2025" },
    { id: "community-beach", src: "/images/hayling-beach.jpg", label: "Community upload · 21 August 2025" },
  ];

  const proAlbumsPool = searchMode ? official : official.slice(0, 4);
  const thisWeekLine = `This week · ${cardDateLabel}`;

  return (
    <div className={searchMode ? "shell pb-8 pt-4 sm:pb-10 sm:pt-5" : "shell py-8 sm:py-10"}>
      <GalleryHashScroll />
      {!searchMode ? (
        <section className="relative overflow-hidden rounded-lg sm:rounded-xl">
          <div className="absolute inset-0 bg-[url('/images/hayling-bike-night-hero.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-zinc-200 sm:text-5xl">Gallery</h1>
            <p className="mt-3 max-w-md text-sm leading-snug text-zinc-100 sm:text-[0.95rem]">
              The best of Hayling Bike Night, from local photographers and the people who make the night what it is.
            </p>
            <p className="mt-2 max-w-md text-sm leading-snug text-zinc-200/95">
              Browse this week&apos;s featured galleries, see photos shared by the community, and add your own if you caught a
              great moment.
            </p>
          </div>
        </section>
      ) : null}

      {searchMode ? <h1 className="sr-only">Gallery search results</h1> : null}

      <form className={searchMode ? "flex flex-col gap-2 sm:flex-row sm:items-center" : "mt-6 flex flex-col gap-2 sm:flex-row sm:items-center"} method="get">
        <label className="sr-only" htmlFor="gallery-search">
          Search gallery, tags, handles
        </label>
        <input
          id="gallery-search"
          name="q"
          defaultValue={q}
          placeholder="Tags, @handle, bike, photographer…"
          className="h-12 flex-1 rounded-md border border-zinc-300 bg-white px-4 text-ink shadow-sm placeholder:text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-400"
        />
        <button className="btn-primary h-12 shrink-0 px-8" type="submit">
          Search
        </button>
      </form>
      {searchMode ? (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          Showing all matches across weeks for <span className="font-medium text-ink">&ldquo;{qTrim}&rdquo;</span>
        </p>
      ) : null}

      {/* Photographer galleries — one block under search; grid auto-fits 1–4 cards */}
      <section className="mt-10 md:mt-12">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]">
          <div className="flex flex-col gap-5 md:flex-row md:items-stretch md:gap-6">
            <div className="min-w-0 flex-1">
              <h2 className="section-title text-[1.65rem] leading-none sm:text-[1.85rem]">
                {searchMode ? "Matching photographer galleries" : "Photographer galleries"}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {searchMode
                  ? "All official albums whose title, photographer, or description matched your search."
                  : "These links take you straight to local photographers&apos; own websites, where you can browse their Hayling Bike Night albums."}
              </p>
            </div>
            <aside className="flex shrink-0 flex-col justify-center border-t border-stone/25 pt-5 md:w-[15.5rem] md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <p className="font-display text-base font-bold uppercase leading-snug text-ink sm:text-lg">Are you a photographer?</p>
              <Link
                href="/submit-album"
                className="btn-primary mt-2 block w-full text-center"
              >
                Submit your weekly gallery link here
              </Link>
            </aside>
          </div>
        </div>

        <ul className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
          {proAlbumsPool.map((a) => (
            <li
              key={a.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-[rgb(var(--color-card))] dark:hover:border-zinc-600"
            >
              <div className="aspect-[16/10] bg-zinc-200">
                {a.attributes.coverImageUrl ? (
                  <img
                    src={a.attributes.coverImageUrl}
                    alt={a.attributes.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:opacity-[0.97]"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="font-display text-xl font-bold uppercase leading-tight text-ink">{a.attributes.title}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  {a.attributes.photographer?.data?.attributes.name ?? a.attributes.submittedByName ?? "Photographer"}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {searchMode ? albumWeekLine(a.attributes, thisWeekLine) : thisWeekLine}
                </p>
                {a.attributes.shortDescription ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{a.attributes.shortDescription}</p>
                ) : null}
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-5">
                  <Link
                    href={a.attributes.albumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-accent no-underline hover:underline"
                  >
                    Latest gallery →
                  </Link>
                  <Link
                    href={a.attributes.shopUrl ?? a.attributes.albumUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-accent no-underline hover:underline"
                  >
                    Website →
                  </Link>
                </div>
              </div>
            </li>
          ))}
          {!searchMode && proAlbumsPool.length < 4
            ? starterPros.slice(0, 4 - proAlbumsPool.length).map((p) => (
                <li
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-[rgb(var(--color-card))] dark:hover:border-zinc-600"
                >
                  <div className="aspect-[16/10] bg-zinc-200">
                    <img
                      src={p.coverImageUrl}
                      alt={p.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:opacity-[0.97]"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="font-display text-xl font-bold uppercase leading-tight text-ink">{p.title}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{p.photographer}</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{thisWeekLine}</p>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{p.shortDescription}</p>
                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-5">
                      <Link
                        href={p.albumUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-accent no-underline hover:underline"
                      >
                        Latest gallery →
                      </Link>
                      <Link
                        href={p.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-accent no-underline hover:underline"
                      >
                        Website →
                      </Link>
                    </div>
                  </div>
                </li>
              ))
            : null}
        </ul>
        {searchMode && proAlbumsPool.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">No photographer albums match that search.</p>
        ) : null}
      </section>

      {/* Community — full-bleed band; anchor for /gallery#community-photos (e.g. home CTA) */}
      <section id="community-photos" className="scroll-mt-24 mt-10 md:mt-12">
        <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 border-y border-zinc-300 bg-zinc-100 px-5 py-4 sm:py-5 dark:border-white/[0.08] dark:bg-elevated/90">
          <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
            <div className="min-w-0">
              <h2 className="section-title text-[1.65rem] leading-none sm:text-[1.85rem]">
                {searchMode ? "Matching community photos" : "From the community"}
              </h2>
              <p className="mt-1.5 font-body text-sm font-medium uppercase tracking-wide text-zinc-700 dark:text-zinc-200 sm:text-base">
                {communityCountLine}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:max-w-[17rem] sm:text-right">
              <p className="text-sm font-medium leading-snug text-zinc-800 dark:text-zinc-200">Think you captured the shot of the night?</p>
              <Link
                href="/upload"
                className="btn-primary inline-flex w-full items-center justify-center text-center sm:ml-auto sm:w-auto sm:min-w-[12rem]"
              >
                Upload your photos
              </Link>
              <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-300">Uploads are checked before they appear.</p>
            </div>
          </div>
        </div>
        <div className="mt-3">
          {displayCommunity.length ? (
            <GalleryGrid items={displayCommunity} />
          ) : searchMode ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300">No community photos match that search.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {communityFallback.map((item) => (
                <article key={item.id} className="card overflow-hidden">
                  <div className="aspect-square bg-zinc-200">
                    <img src={item.src} alt={item.label} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <p className="p-3 text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{item.label}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Previous weeks */}
      <section className="mt-10 border-t border-stone/30 pt-8 md:mt-12 md:pt-10">
        <h2 className="section-title text-[1.65rem] leading-none sm:text-[1.85rem]">
          {searchMode ? "Matching gallery weeks" : "Previous weeks"}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {searchMode
            ? "Week pages whose title, tagline, or tags matched your search."
            : "Browse past galleries and community uploads from earlier Hayling Bike Night meets."}
        </p>
        {pastDisplayed.length ? (
          <ul className="mt-5 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {pastDisplayed.map((entry) => {
              const meetDate = formatMeetDateUk(entry.attributes.galleryLiveAt) ?? entry.attributes.title;
              return (
                <li
                  key={entry.id}
                  className="mb-4 break-inside-avoid rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-[rgb(var(--color-card))]"
                >
                  <p className="font-display text-xl font-bold uppercase leading-tight text-ink">{meetDate}</p>
                  {entry.attributes.tagline ? (
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{entry.attributes.tagline}</p>
                  ) : null}
                  <Link
                    href={`/gallery/${entry.attributes.slug}`}
                    className="mt-4 inline-block text-sm font-semibold text-accent no-underline hover:underline"
                  >
                    Open this week →
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-300">
            {qTrim ? "No matches for that search — try another word." : "More past weeks will appear here as the season builds."}
          </p>
        )}
      </section>
    </div>
  );
}
