import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { FacebookFeedSection } from "@/components/FacebookFeedSection";
import { Hero } from "@/components/Hero";
import { HomeCommunityPreview } from "@/components/HomeCommunityPreview";
import { LandingShowcaseStrip, type ShowcaseItem } from "@/components/LandingShowcaseStrip";
import { getFacebookMedia } from "@/lib/facebook";
import { mergeOfficialAlbumsForSpotlight } from "@/lib/mergeOfficialAlbums";
import { getEvents, getGalleryEntries, getOfficialAlbums, getPhotos, getPublishedCommunityPhotoTotal } from "@/lib/strapi";
import { getForecastForDate } from "@/lib/weather";

/** Dynamic so community photo totals stay accurate after moderation (not stuck behind ISR). */
export const dynamic = "force-dynamic";

function statNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

export default async function HomePage() {
  const [events, galleryEntries, facebookMedia] = await Promise.all([
    getEvents({ upcoming: true }),
    getGalleryEntries(),
    getFacebookMedia(12),
  ]);

  const latestEntry = galleryEntries?.data?.[0] ?? null;
  const facebookShowcase: ShowcaseItem[] = facebookMedia.map((src, idx) => ({
    id: `fb-${idx}`,
    src,
    source: "facebook",
    uploader: "haylingbikenight",
  }));
  const apiEvents = (events?.data ?? []).slice(0, 8);

  const nextStrapiEvent = apiEvents[0];
  const nextUpcomingForecast = nextStrapiEvent ? await getForecastForDate(nextStrapiEvent.attributes.dateStart) : null;
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [officialRes, recentOfficialRes, publishedCommunityTotal, publishedCommunityLast7Days, communityPhotosRes] =
    await Promise.all([
      latestEntry ? getOfficialAlbums({ galleryEntrySlug: latestEntry.attributes.slug, status: "published" }) : Promise.resolve(null),
      getOfficialAlbums({ status: "published" }),
      getPublishedCommunityPhotoTotal(),
      getPublishedCommunityPhotoTotal({ updatedAtGte: sevenDaysAgoIso }),
      getPhotos({ pageSize: 30, source: "community" }),
    ]);
  const officialForWeek = officialRes?.data ?? [];
  const recentOfficial = recentOfficialRes?.data ?? [];
  const official = mergeOfficialAlbumsForSpotlight(officialForWeek, recentOfficial, 4);
  const communityPhotosHome = (communityPhotosRes?.data ?? []).filter((p) => p.attributes.isExternal !== true);
  const communityShowcase: ShowcaseItem[] = communityPhotosHome
    .map((ph) => {
      const src = ph.attributes.thumbnailUrl ?? ph.attributes.imageUrl ?? null;
      if (!src) return null;
      const outbound = ph.attributes.purchaseUrl ?? ph.attributes.sourcePageUrl;
      const external = Boolean(ph.attributes.isExternal || outbound);
      return {
        id: `community-${ph.id}`,
        photoId: ph.id,
        src,
        source: "community" as const,
        uploader: ph.attributes.uploaderHandle ?? ph.attributes.submittedBy ?? "community",
        subjectKeywords: ph.attributes.subjectKeywords ?? null,
        external,
      };
    })
    .filter((item): item is Extract<ShowcaseItem, { source: "community" }> => item !== null);
  const starterPros = [
    {
      id: "home-pro-1",
      title: "Michael Jones-Price Photography",
      albumUrl:
        "https://michaeljones-pricephotography.pixieset.com/rykassessionarrivalsonly09001300-3/?fbclid=IwY2xjawQqAUpleHRuA2FlbQIxMQBzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEewQToGTI8mwRx77U20oa4rj5_9_4bkUSJ0bYCx_yS_nGfK5PCVHMzYtiYKbo_aem_oUY4_SyE26bZ-sQJNAAv1A",
      websiteUrl: "https://michaeljones-pricephotography.pixieset.com",
      coverImageUrl: "/images/hayling-badge.png",
      photographer: "Michael Jones-Price",
      dateLabel: "21 August 2025",
    },
    {
      id: "home-pro-2",
      title: "The Right Bikes",
      albumUrl:
        "https://www.therightbikes.com/?fbclid=IwY2xjawQqAnJleHRuA2FlbQIxMABicmlkETFkdE5RaTJlT1k0R0xSbXlmc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHk-cnNhYxOlCMYOD_FmP302hjwxZYql-wQ8p2QBRifRdl5Szs21vTAZUpC2n_aem_OLqIvp0tJyJ6ni1wkZ1diA",
      websiteUrl: "https://www.therightbikes.com",
      coverImageUrl: "/images/ridebikes.png",
      photographer: "The Right Bikes",
      dateLabel: "21 August 2025",
    },
    {
      id: "home-pro-3",
      title: "Bikes on the Beach Photography",
      albumUrl: "https://gallery.bikesonthebeachphoto.co.uk/hayling-thursday-latest",
      websiteUrl: "https://www.bikesonthebeachphoto.co.uk",
      coverImageUrl: "/images/hayling-beach.jpg",
      photographer: "Bikes on the Beach Photography",
      dateLabel: "21 August 2025",
    },
    {
      id: "home-pro-4",
      title: "1808 Photography",
      albumUrl: "https://galleries.1808photography.co.uk/hayling-bike-night-weekly",
      websiteUrl: "https://www.1808photography.co.uk",
      coverImageUrl: "/images/owner.jpg",
      photographer: "1808 Photography",
      dateLabel: "21 August 2025",
    },
  ];
  const communityFallback = [
    { id: "home-community-owner", src: "/images/owner.jpg", label: "Community upload · 21 August 2025" },
    { id: "home-community-beach", src: "/images/hayling-beach.jpg", label: "Community upload · 21 August 2025" },
  ];

  return (
    <>
      <Hero />

      <section className="border-y border-zinc-800 bg-zinc-950 py-20">
        <div className="shell grid grid-cols-2 gap-5 sm:grid-cols-4">
          <div><p className="font-display font-bold text-5xl uppercase text-zinc-300">23</p><p className="text-sm text-zinc-500">This season meets</p></div>
          <div><p className="font-display font-bold text-5xl uppercase text-zinc-300">500</p><p className="text-sm text-zinc-500">Expected riders weekly</p></div>
          <div><p className="font-display font-bold text-5xl uppercase text-zinc-300">{statNumber(publishedCommunityTotal)}</p><p className="text-sm text-zinc-500">Total community photos published</p></div>
          <div><p className="font-display font-bold text-5xl uppercase text-zinc-300">Apr-Sep</p><p className="text-sm text-zinc-500">Every Thursday afternoon</p></div>
        </div>
      </section>

      <div className="space-y-0">
        <section className="bg-white py-20 dark:bg-zinc-950">
          <div className="shell">
          <div>
            <h3 className="font-display font-bold text-3xl uppercase text-ink">Pro Photographers&apos; Latest Galleries</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Official photographer albums.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(() => {
                const officialCards = official.map((a) => ({
                  id: `official-${a.id}`,
                  title: a.attributes.title,
                  albumUrl: a.attributes.albumUrl,
                  websiteUrl: a.attributes.shopUrl ?? a.attributes.albumUrl,
                  coverImageUrl: a.attributes.coverImageUrl ?? "/images/ridebikes.png",
                  photographer: a.attributes.photographer?.data?.attributes.name ?? a.attributes.submittedByName ?? "Photographer",
                  dateLabel: "21 August 2025",
                }));
                const cards = [...officialCards];
                if (cards.length < 4) {
                  cards.push(...starterPros.slice(0, 4 - cards.length));
                }
                return cards.slice(0, 4);
              })().map((p) => (
                <article key={p.id} className="card overflow-hidden">
                  <div className="aspect-[4/3] bg-zinc-200">
                    <img src={p.coverImageUrl} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <p className="font-display font-bold text-xl uppercase text-ink">{p.title}</p>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">{p.photographer}</p>
                    <p className="text-xs uppercase tracking-wide text-warm">{p.dateLabel}</p>
                    <div className="mt-2 flex gap-3 text-sm">
                      <Link href={p.albumUrl} target="_blank" className="text-accent">Gallery →</Link>
                      <Link href={p.websiteUrl} target="_blank" className="text-accent">Website →</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          </div>
        </section>

        <section className="border-y border-stone/30 bg-surface py-20">
          <div className="shell">
            <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">From the car park</p>
                <h3 className="mt-2 font-display font-bold text-3xl uppercase text-ink">Community photos</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-ink dark:text-zinc-200">{statNumber(publishedCommunityTotal)}</span> published
                  in the gallery. In the past 7 days we received{" "}
                  <span className="font-semibold text-ink dark:text-zinc-200">{statNumber(publishedCommunityLast7Days)}</span>.
                </p>
              </div>
              <Link
                href="/gallery#community-photos"
                className="text-sm font-medium text-accent no-underline hover:underline"
              >
                View all in gallery →
              </Link>
            </div>
            {communityPhotosHome.length ? (
              <HomeCommunityPreview
                items={communityPhotosHome.slice(0, 12).map((ph) => ({
                  id: ph.id,
                  src: ph.attributes.thumbnailUrl ?? ph.attributes.imageUrl ?? "/images/hayling-beach.jpg",
                  alt: `Community photo by ${ph.attributes.uploaderHandle ?? ph.attributes.submittedBy ?? "rider"}`,
                }))}
              />
            ) : (
              <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {communityFallback.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-stone/50 bg-white shadow-sm ring-1 ring-black/[0.03] dark:border-zinc-700 dark:bg-[rgb(var(--color-card))] dark:ring-0"
                  >
                    <div className="aspect-square bg-zinc-200">
                      <img src={item.src} alt={item.label} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="mt-8 flex flex-col gap-2">
              <Link href="/gallery#community-photos" className="btn-primary w-fit">
                View {statNumber(publishedCommunityTotal)} community photos →
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-200 py-20 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/[0.07] blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-zinc-400/15 blur-3xl"
            aria-hidden
          />
          <div className="shell relative">
            <div className="card relative overflow-hidden p-6 shadow-md sm:p-10">
              <div className="absolute left-0 top-0 h-full w-1.5 bg-accent" aria-hidden />
              <div className="pl-2 sm:pl-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Thursday nights</p>
                <h2 className="mt-2 section-title">Shot something good on Thursday?</h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Add it to the community gallery so everyone can relive the meet. Quick upload, no account faff — just
                  your best frame from the car park.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <Link href="/upload" className="btn-primary">
                    Upload your shots →
                  </Link>
                  <Link
                    href="/submit-album"
                    className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-6 py-3 font-display text-[0.85rem] font-bold uppercase tracking-wide text-ink no-underline shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    Photographer? Submit a link to your gallery
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-white py-20 dark:bg-zinc-950">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
            aria-hidden
          />
          <div className="shell">
            <div className="mb-8 flex flex-col gap-6 border-b border-zinc-200 pb-8 dark:border-zinc-800 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">Plan your week</p>
                <h2 className="mt-2 section-title">Local events</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Thursday Bike Nights and whatever else riders are planning. Got your own spin? Suggest it on the events
                  page — the site team gives it a quick check, then it shows here with everything else.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-auto lg:max-w-sm lg:items-stretch">
                <Link
                  href="/events#submit-event"
                  className="inline-flex w-full items-center justify-center rounded-xl border-2 border-accent/40 bg-accent px-5 py-4 text-center font-display text-sm font-bold uppercase tracking-wide text-[rgb(var(--color-on-accent))] no-underline shadow-lg shadow-accent/30 transition hover:brightness-110 lg:py-3.5"
                >
                  Suggest a ride or meet →
                </Link>
                <Link
                  href="/events"
                  className="text-center text-sm font-semibold text-accent no-underline hover:underline lg:text-right"
                >
                  Browse all events →
                </Link>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 [scrollbar-width:thin]">
              {apiEvents.length ? (
                apiEvents.map((row, idx) => (
                  <EventCard
                    key={row.id}
                    attrs={row.attributes}
                    href={`/events/${row.attributes.slug}`}
                    featured={idx === 0}
                    showForecast={idx === 0}
                    forecastText={idx === 0 ? nextUpcomingForecast : null}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 dark:border-zinc-600 dark:bg-zinc-900/50">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    No upcoming dates yet — open{" "}
                    <Link href="/events" className="font-medium text-accent no-underline hover:underline">
                      local events
                    </Link>{" "}
                    or{" "}
                    <Link href="/events#submit-event" className="font-medium text-accent no-underline hover:underline">
                      suggest a ride or meet
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-zinc-950 py-24 text-zinc-300 dark:bg-black">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.08),transparent_55%)]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(135deg,#fff_0.5px,transparent_0.5px),linear-gradient(45deg,#fff_0.5px,transparent_0.5px)] [background-size:24px_24px]" aria-hidden />
          <div className="shell relative">
          <LandingShowcaseStrip facebook={facebookShowcase} community={communityShowcase} />
          <p className="mx-auto mt-8 max-w-4xl text-center font-display text-3xl font-bold uppercase leading-tight tracking-tight text-zinc-200 sm:text-4xl md:text-5xl">
            Hayling Bike Night — bikes everywhere you look, beach at your shoulder, the island&apos;s biggest Thursday.
          </p>
          <p className="mt-4 text-center text-sm font-medium uppercase tracking-[0.12em] text-zinc-400 sm:text-base">
            Free to attend · Every Thursday · April to September
          </p>
          </div>
        </section>
      </div>

      <FacebookFeedSection />

      <section id="find-us" className="bg-surface py-20">
        <div className="shell">
          <div className="card p-6 sm:p-8">
          <h2 className="section-title">Find Us</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="font-display font-bold text-3xl uppercase text-ink">John&apos;s Cafe</p>
              <p className="mt-2 text-lg text-zinc-700">PO11 0AS, Hayling Island</p>
              <p className="mt-2 text-sm text-zinc-600">Every Thursday, April to September, 5pm till late.</p>
              <a
                href="https://maps.google.com/?q=John%27s+Cafe+PO11+0AS"
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-5"
              >
                Open in Google Maps
              </a>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
              <iframe
                title="John's Cafe location map"
                src="https://www.google.com/maps?q=John%27s+Cafe+PO11+0AS&output=embed"
                className="h-[320px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
          </div>
        </div>
      </section>
    </>
  );
}
