const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";

/** Avoid flooding the dev console when Strapi is stopped (many parallel fetches on HomePage). */
let strapiNetworkWarned = false;

export type EventAttrs = {
  title: string;
  slug: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  /** Strapi richtext may be string or block JSON */
  note?: unknown;
  /** Official weekly meet vs rider-submitted listing */
  eventKind?: "bike_night" | "community" | null;
  submitterName?: string | null;
  submitterEmail?: string | null;
};

export type NewsAttrs = {
  title: string;
  slug: string;
  body: string;
  publishedAt: string;
  tags?: string | null;
  coverImageUrl?: string | null;
};

export type PetitionAttrs = {
  title: string;
  slug: string;
  description: string;
  goalCount: number;
  currentCount: number;
};

export type PhotographerAttrs = {
  name: string;
  websiteUrl: string;
  feedUrl?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  shopLink?: string | null;
};

export type GalleryEntryAttrs = {
  title: string;
  slug: string;
  galleryLiveAt?: string | null;
  tagline?: string | null;
  tags?: string | null;
  event?: { data: { id: number; attributes: EventAttrs } | null };
};

export type OfficialAlbumAttrs = {
  title: string;
  slug: string;
  albumUrl: string;
  shopUrl?: string | null;
  coverImageUrl?: string | null;
  shortDescription?: string | null;
  photoCount?: number | null;
  status: "pending" | "published" | "rejected";
  submittedByName?: string | null;
  submittedByEmail?: string | null;
  galleryEntry?: { data: { id: number; attributes: GalleryEntryAttrs } | null };
  event?: { data: { id: number; attributes: EventAttrs } | null };
  photographer?: { data: { id: number; attributes: PhotographerAttrs } | null };
};

export type PhotoAttrs = {
  title?: string | null;
  caption?: string | null;
  status: "draft" | "pending" | "published" | "rejected";
  isExternal?: boolean | null;
  thumbnailUrl?: string | null;
  sourcePageUrl?: string | null;
  purchaseUrl?: string | null;
  subjectKeywords?: string | null;
  imageUrl?: string | null;
  uploaderHandle?: string | null;
  bikeMakeModel?: string | null;
  bikeColour?: string | null;
  consentConfirmed?: boolean | null;
  moderationReason?: string | null;
  event?: { data: { id: number; attributes: EventAttrs } | null };
  photographer?: { data: { id: number; attributes: PhotographerAttrs } | null };
  galleryEntry?: { data: { id: number; attributes: GalleryEntryAttrs } | null };
  submittedBy?: string | null;
  /** Strapi system fields (when returned by API) */
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ListResponse<T> = {
  data: Array<{ id: number; attributes: T }>;
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
};

type SingleResponse<T> = {
  data: { id: number; attributes: T } | null;
  meta?: unknown;
};

function authHeaders(): HeadersInit {
  const t = process.env.STRAPI_API_TOKEN?.trim();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function strapiFetch<T>(path: string, init?: RequestInit & { next?: { revalidate?: number } }): Promise<T | null> {
  const url = `${STRAPI}/api${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 240);
      } catch {
        /* ignore */
      }
      console.warn("Strapi fetch failed", res.status, url.split("?")[0], detail || "(no body)");
      return null;
    }
    return (await res.json()) as T;
  } catch {
    if (!strapiNetworkWarned) {
      strapiNetworkWarned = true;
      console.warn(
        `[strapi] Cannot reach ${STRAPI} (network error). For local dev: run Strapi on :1337 — e.g. \`bash scripts/start-local.sh\` from the repo root, or \`npm run start --workspace cms\`.`,
      );
    }
    return null;
  }
}

/** No populate — avoids 400/5xx from deep populate on some Strapi setups. */
async function strapiFetchPhotosBare(
  page: number,
  pageSize: number,
  status: PhotoAttrs["status"] = "published",
): Promise<ListResponse<PhotoAttrs> | null> {
  const params = new URLSearchParams();
  params.set("pagination[page]", String(page));
  params.set("pagination[pageSize]", String(Math.min(pageSize, 100)));
  params.set("filters[status][$eq]", status);
  params.set("sort", "createdAt:desc");
  return strapiFetch<ListResponse<PhotoAttrs>>(`/photos?${params.toString()}`, {
    next: { revalidate: 30 },
  });
}

/** No populate — album list still has scalars (title, albumUrl, coverImageUrl, …). */
async function strapiFetchOfficialAlbumsBare(
  page: number,
  pageSize: number,
): Promise<ListResponse<OfficialAlbumAttrs> | null> {
  const params = new URLSearchParams();
  params.set("pagination[page]", String(page));
  params.set("pagination[pageSize]", String(Math.min(pageSize, 100)));
  params.set("filters[status][$eq]", "published");
  params.set("publicationState", "live");
  params.set("sort", "createdAt:desc");
  return strapiFetch<ListResponse<OfficialAlbumAttrs>>(`/official-albums?${params.toString()}`, {
    next: { revalidate: 30 },
  });
}

export async function getEvents(params?: { upcoming?: boolean }) {
  const sort = params?.upcoming ? "dateStart:asc" : "dateStart:desc";
  const now = new Date().toISOString();
  const filters = params?.upcoming ? `&filters[dateStart][$gte]=${encodeURIComponent(now)}` : "";
  return strapiFetch<ListResponse<EventAttrs>>(
    `/events?sort=${sort}&pagination[pageSize]=100${filters}&publicationState=live`,
    { next: { revalidate: 60 } },
  );
}

export async function getEventBySlug(slug: string) {
  const res = await strapiFetch<ListResponse<EventAttrs>>(
    `/events?filters[slug][$eq]=${encodeURIComponent(slug)}&publicationState=live`,
    { next: { revalidate: 120 } },
  );
  return res?.data?.[0] ?? null;
}

/** Draft community submissions (Strapi draft / preview), for owner moderation only. */
export async function getPendingCommunityEvents() {
  return strapiFetch<ListResponse<EventAttrs>>(
    `/events?filters[eventKind][$eq]=community&publicationState=preview&sort=createdAt:desc&pagination[pageSize]=50`,
    { cache: "no-store" },
  );
}

export async function getNewsList() {
  return strapiFetch<ListResponse<NewsAttrs>>(
    `/news-posts?sort=publishedAt:desc&pagination[pageSize]=50&publicationState=live`,
    { next: { revalidate: 60 } },
  );
}

export async function getNewsBySlug(slug: string) {
  const res = await strapiFetch<ListResponse<NewsAttrs>>(
    `/news-posts?filters[slug][$eq]=${encodeURIComponent(slug)}&publicationState=live`,
    { next: { revalidate: 120 } },
  );
  return res?.data?.[0] ?? null;
}

export async function getPetitions() {
  return strapiFetch<ListResponse<PetitionAttrs>>(
    `/petitions?sort=createdAt:desc&pagination[pageSize]=50&publicationState=live`,
    { next: { revalidate: 60 } },
  );
}

export async function getPetitionBySlug(slug: string) {
  const res = await strapiFetch<ListResponse<PetitionAttrs>>(
    `/petitions?filters[slug][$eq]=${encodeURIComponent(slug)}&publicationState=live`,
    { next: { revalidate: 120 } },
  );
  return res?.data?.[0] ?? null;
}

export async function getGalleryEntries(options?: { q?: string }) {
  const params = new URLSearchParams();
  params.set("populate", "event");
  params.set("sort", "galleryLiveAt:desc");
  params.set("pagination[pageSize]", "100");
  params.set("publicationState", "live");
  if (options?.q?.trim()) {
    params.set("filters[$or][0][title][$containsi]", options.q.trim());
    params.set("filters[$or][1][tagline][$containsi]", options.q.trim());
    params.set("filters[$or][2][tags][$containsi]", options.q.trim());
  }
  return strapiFetch<ListResponse<GalleryEntryAttrs>>(`/gallery-entries?${params.toString()}`, {
    next: { revalidate: 30 },
  });
}

export async function getGalleryEntryBySlug(slug: string) {
  const res = await strapiFetch<ListResponse<GalleryEntryAttrs>>(
    `/gallery-entries?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=event&publicationState=live`,
    { next: { revalidate: 30 } },
  );
  return res?.data?.[0] ?? null;
}

/** Strips leading @ so "@rider" still matches handle "rider". */
export function normalizePhotoSearchQuery(q: string): { full: string; handleVariant: string } {
  const full = q.trim();
  const handleVariant = full.replace(/^@+/, "");
  return { full, handleVariant };
}

function appendOfficialAlbumTextSearch(params: URLSearchParams, q: string): void {
  const t = q.trim();
  if (!t) return;
  params.set("filters[$or][0][title][$containsi]", t);
  params.set("filters[$or][1][shortDescription][$containsi]", t);
  params.set("filters[$or][2][submittedByName][$containsi]", t);
}

export async function getOfficialAlbums(options?: {
  galleryEntrySlug?: string;
  status?: OfficialAlbumAttrs["status"];
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();
  params.set("populate", "*");
  params.set("sort", "createdAt:desc");
  const pageSize = Math.min(options?.pageSize ?? 100, 100);
  params.set("pagination[page]", String(options?.page ?? 1));
  params.set("pagination[pageSize]", String(pageSize));
  if (options?.status) params.set("filters[status][$eq]", options.status);
  if (options?.galleryEntrySlug) params.set("filters[galleryEntry][slug][$eq]", options.galleryEntrySlug);
  if (!options?.status || options.status === "published") params.set("publicationState", "live");
  if (options?.q?.trim()) appendOfficialAlbumTextSearch(params, options.q);

  const res = await strapiFetch<ListResponse<OfficialAlbumAttrs>>(`/official-albums?${params.toString()}`, {
    next: { revalidate: 30 },
  });
  if (res) return res;
  // Text $or filters can 400 — retry same scope without search.
  if (options?.q?.trim()) {
    return getOfficialAlbums({
      galleryEntrySlug: options.galleryEntrySlug,
      status: options.status,
      page: options.page,
      pageSize: options.pageSize,
    });
  }
  // Gallery-week relation filter can 400 on some Strapi builds — fall back to all published albums.
  if (options?.galleryEntrySlug) {
    return getOfficialAlbums({
      status: options.status,
      page: options.page,
      pageSize: options.pageSize,
    });
  }
  return strapiFetchOfficialAlbumsBare(options?.page ?? 1, pageSize);
}

/** Fetches every page of official albums (max 100 per page). */
export async function getOfficialAlbumsAllMatching(options?: {
  galleryEntrySlug?: string;
  status?: OfficialAlbumAttrs["status"];
  q?: string;
}): Promise<ListResponse<OfficialAlbumAttrs> | null> {
  let effective: NonNullable<Parameters<typeof getOfficialAlbums>[0]> = { ...options };
  let first = await getOfficialAlbums({ ...effective, page: 1, pageSize: 100 });
  if (!first && options?.galleryEntrySlug) {
    const rest = { ...effective };
    delete rest.galleryEntrySlug;
    effective = rest;
    first = await getOfficialAlbums({ ...effective, page: 1, pageSize: 100 });
  }
  if (!first) return null;
  const pageCount = first.meta?.pagination?.pageCount ?? 1;
  if (pageCount <= 1) return first;
  const all = [...first.data];
  for (let page = 2; page <= pageCount; page++) {
    const next = await getOfficialAlbums({ ...effective, page, pageSize: 100 });
    if (next?.data?.length) all.push(...next.data);
  }
  return {
    data: all,
    meta: { pagination: { page: 1, pageSize: all.length, pageCount: 1, total: all.length } },
  };
}

/** Strapi $or filters for free-text photo search (tags/keywords, caption, handle, bike, uploader email). */
function appendPhotoTextSearchFilters(params: URLSearchParams, qRaw: string): void {
  const { full, handleVariant } = normalizePhotoSearchQuery(qRaw);
  if (!full) return;
  let i = 0;
  const addContains = (path: string[], value: string) => {
    let key = `filters[$or][${i}]`;
    for (const p of path) key += `[${p}]`;
    key += `[$containsi]`;
    params.set(key, value);
    i += 1;
  };
  addContains(["subjectKeywords"], full);
  addContains(["caption"], full);
  addContains(["title"], full);
  addContains(["bikeMakeModel"], full);
  addContains(["bikeColour"], full);
  addContains(["submittedBy"], full);
  addContains(["uploaderHandle"], full);
  if (handleVariant !== full) {
    addContains(["uploaderHandle"], handleVariant);
  }
  // Omit photographer relation filter — some Strapi setups return 400 or empty for nested $or on relations.
}

/**
 * Published community photos (moderation-approved): `status === "published"` and `isExternal !== true`.
 * Uses `cache: "no-store"` so totals update as soon as items are approved, not after ISR.
 * Falls back to paging through `/photos` if the compact $or filter is rejected by Strapi.
 */
export async function getPublishedCommunityPhotoTotal(options?: {
  galleryEntrySlug?: string;
  /** Inclusive lower bound (ISO), e.g. Thursday 00:00 London as UTC instant */
  createdAtGte?: string;
  /** Exclusive upper bound (ISO), e.g. next Thursday 00:00 London */
  createdAtLt?: string;
  /** Prefer `updatedAt` for “this bike-night week” so approvals count even if upload `createdAt` is older */
  updatedAtGte?: string;
  updatedAtLt?: string;
}): Promise<number> {
  const params = new URLSearchParams();
  params.set("filters[status][$eq]", "published");
  params.set("filters[$or][0][isExternal][$eq]", "false");
  params.set("filters[$or][1][isExternal][$null]", "true");
  params.set("pagination[page]", "1");
  params.set("pagination[pageSize]", "1");
  if (options?.galleryEntrySlug) {
    params.set("filters[galleryEntry][slug][$eq]", options.galleryEntrySlug);
  }
  if (options?.createdAtGte) params.set("filters[createdAt][$gte]", options.createdAtGte);
  if (options?.createdAtLt) params.set("filters[createdAt][$lt]", options.createdAtLt);
  if (options?.updatedAtGte) params.set("filters[updatedAt][$gte]", options.updatedAtGte);
  if (options?.updatedAtLt) params.set("filters[updatedAt][$lt]", options.updatedAtLt);

  const res = await strapiFetch<ListResponse<PhotoAttrs>>(`/photos?${params.toString()}`, {
    cache: "no-store",
  });
  const t = res?.meta?.pagination?.total;
  if (typeof t === "number") return t;

  return countPublishedCommunityPhotosPaged(options);
}

async function countPublishedCommunityPhotosPaged(options?: {
  galleryEntrySlug?: string;
  createdAtGte?: string;
  createdAtLt?: string;
  updatedAtGte?: string;
  updatedAtLt?: string;
}): Promise<number> {
  const pageSize = 100;
  let page = 1;
  let sum = 0;
  for (;;) {
    const params = new URLSearchParams();
    params.set("populate", "*");
    params.set("sort", "createdAt:desc");
    params.set("pagination[page]", String(page));
    params.set("pagination[pageSize]", String(pageSize));
    params.set("filters[status][$eq]", "published");
    if (options?.galleryEntrySlug) params.set("filters[galleryEntry][slug][$eq]", options.galleryEntrySlug);
    if (options?.createdAtGte) params.set("filters[createdAt][$gte]", options.createdAtGte);
    if (options?.createdAtLt) params.set("filters[createdAt][$lt]", options.createdAtLt);
    if (options?.updatedAtGte) params.set("filters[updatedAt][$gte]", options.updatedAtGte);
    if (options?.updatedAtLt) params.set("filters[updatedAt][$lt]", options.updatedAtLt);

    const res = await strapiFetch<ListResponse<PhotoAttrs>>(`/photos?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res?.data?.length) break;
    sum += res.data.filter((p) => p.attributes.isExternal !== true).length;
    const pageCount = res.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }
  return sum;
}

export async function getPhotos(options: {
  page?: number;
  pageSize?: number;
  eventSlug?: string;
  galleryEntrySlug?: string;
  createdAtGte?: string;
  createdAtLt?: string;
  updatedAtGte?: string;
  updatedAtLt?: string;
  photographer?: string;
  bikeMakeModel?: string;
  bikeColour?: string;
  source?: "all" | "official" | "community";
  q?: string;
  status?: PhotoAttrs["status"];
}) {
  const page = options.page ?? 1;
  const pageSize = Math.min(options.pageSize ?? 24, 100);
  const status = options.status ?? "published";
  const params = new URLSearchParams();
  params.set("populate", "*");
  params.set("sort", "createdAt:desc");
  params.set("pagination[page]", String(page));
  params.set("pagination[pageSize]", String(pageSize));
  params.set("filters[status][$eq]", status);

  if (options.eventSlug) params.set("filters[event][slug][$eq]", options.eventSlug);
  if (options.galleryEntrySlug) params.set("filters[galleryEntry][slug][$eq]", options.galleryEntrySlug);
  if (options.createdAtGte) params.set("filters[createdAt][$gte]", options.createdAtGte);
  if (options.createdAtLt) params.set("filters[createdAt][$lt]", options.createdAtLt);
  if (options.updatedAtGte) params.set("filters[updatedAt][$gte]", options.updatedAtGte);
  if (options.updatedAtLt) params.set("filters[updatedAt][$lt]", options.updatedAtLt);
  if (options.photographer) params.set("filters[photographer][name][$containsi]", options.photographer);
  if (options.bikeMakeModel) params.set("filters[bikeMakeModel][$containsi]", options.bikeMakeModel);
  if (options.bikeColour) params.set("filters[bikeColour][$containsi]", options.bikeColour);

  if (options.source === "official") {
    params.set("filters[isExternal][$eq]", "true");
  }
  // Never send isExternal filters for source === "community": $ne / $not / extra $or groups break Strapi or drop NULL
  // rows unpredictably. Callers always filter isExternal !== true client-side.

  if (options.q?.trim()) appendPhotoTextSearchFilters(params, options.q);

  const url = `/photos?${params.toString()}`;
  const res = await strapiFetch<ListResponse<PhotoAttrs>>(url, {
    next: { revalidate: 30 },
  });
  if (res) return res;
  // Text-search $or can 400 — retry same scope without `q`.
  if (options.q?.trim()) {
    return getPhotos({
      page: options.page,
      pageSize: options.pageSize,
      eventSlug: options.eventSlug,
      galleryEntrySlug: options.galleryEntrySlug,
      createdAtGte: options.createdAtGte,
      createdAtLt: options.createdAtLt,
      updatedAtGte: options.updatedAtGte,
      updatedAtLt: options.updatedAtLt,
      photographer: options.photographer,
      bikeMakeModel: options.bikeMakeModel,
      bikeColour: options.bikeColour,
      status: options.status,
      source: options.source,
    });
  }
  // Gallery-week filter on relation can 400 — return recent published photos site-wide instead of an empty gallery.
  if (options.galleryEntrySlug) {
    return getPhotos({
      page: options.page,
      pageSize: options.pageSize,
      eventSlug: options.eventSlug,
      createdAtGte: options.createdAtGte,
      createdAtLt: options.createdAtLt,
      updatedAtGte: options.updatedAtGte,
      updatedAtLt: options.updatedAtLt,
      photographer: options.photographer,
      bikeMakeModel: options.bikeMakeModel,
      bikeColour: options.bikeColour,
      status: options.status,
      source: options.source,
    });
  }
  // createdAt/updatedAt filters break some DB/Strapi configs — retry without them.
  if (options.updatedAtGte || options.updatedAtLt || options.createdAtGte || options.createdAtLt) {
    return getPhotos({
      page: options.page,
      pageSize: options.pageSize,
      eventSlug: options.eventSlug,
      galleryEntrySlug: options.galleryEntrySlug,
      photographer: options.photographer,
      bikeMakeModel: options.bikeMakeModel,
      bikeColour: options.bikeColour,
      status: options.status,
      source: options.source,
      q: options.q,
    });
  }
  // Deep populate can 5xx; bare list still returns image URLs on the photo type.
  if (!options.q?.trim()) {
    return strapiFetchPhotosBare(page, pageSize, status);
  }
  return null;
}

/** Fetches every page of photos (100 per page max) so search is not truncated at the first page. */
export async function getPhotosAllMatching(
  options: Omit<
    Parameters<typeof getPhotos>[0],
    "page" | "pageSize"
  > & {
    pageSize?: number;
    /** Cap Strapi page fetches (100 rows each). Default 120 ≈ 12k photos; raise if needed. */
    maxPages?: number;
  },
): Promise<ListResponse<PhotoAttrs> | null> {
  const { maxPages = 120, ...photoOpts } = options;
  const pageSize = Math.min(photoOpts.pageSize ?? 100, 100);
  let effective: Parameters<typeof getPhotos>[0] = { ...photoOpts, pageSize };
  let first = await getPhotos({ ...effective, page: 1 });
  if (!first && photoOpts.galleryEntrySlug) {
    const rest = { ...effective };
    delete rest.galleryEntrySlug;
    first = await getPhotos({ ...rest, page: 1, pageSize });
    if (first) effective = { ...rest, pageSize };
  }
  if (
    !first &&
    (photoOpts.updatedAtGte || photoOpts.updatedAtLt || photoOpts.createdAtGte || photoOpts.createdAtLt)
  ) {
    const noDates = { ...photoOpts };
    delete noDates.updatedAtGte;
    delete noDates.updatedAtLt;
    delete noDates.createdAtGte;
    delete noDates.createdAtLt;
    first = await getPhotos({ ...noDates, pageSize, page: 1 });
    if (first) effective = { ...noDates, pageSize };
  }
  if (!first && !photoOpts.q?.trim()) {
    first = await strapiFetchPhotosBare(1, pageSize, photoOpts.status ?? "published");
    if (first) effective = { pageSize, status: photoOpts.status ?? "published" };
  }
  // 200 + [] can mean over-aggressive filters; re-fetch a minimal query for this week (keep official scope if any).
  const emptyButScoped =
    first &&
    first.data.length === 0 &&
    Boolean(photoOpts.galleryEntrySlug) &&
    (Boolean(photoOpts.q?.trim()) || photoOpts.source === "community");
  if (emptyButScoped) {
    const looseOpts: Parameters<typeof getPhotos>[0] = {
      pageSize,
      galleryEntrySlug: photoOpts.galleryEntrySlug,
      status: photoOpts.status,
      ...(photoOpts.source === "official" ? { source: "official" as const } : {}),
    };
    const loose = await getPhotos({ ...looseOpts, page: 1 });
    if (loose && loose.data.length > 0) {
      first = loose;
      effective = looseOpts;
    }
  }
  if (!first) return null;
  const pageCount = first.meta?.pagination?.pageCount ?? 1;
  const lastPage = Math.min(pageCount, Math.max(1, maxPages));
  if (lastPage <= 1) return first;
  const all = [...first.data];
  for (let page = 2; page <= lastPage; page++) {
    let next = await getPhotos({ ...effective, page, pageSize });
    if (!next && photoOpts.q?.trim()) {
      next = await getPhotos({
        ...effective,
        page,
        pageSize,
        q: undefined,
      });
    }
    if (next?.data?.length) all.push(...next.data);
  }
  return {
    data: all,
    meta: { pagination: { page: 1, pageSize: all.length, pageCount: 1, total: all.length } },
  };
}

export async function getPhotoById(id: number) {
  const res = await strapiFetch<SingleResponse<PhotoAttrs>>(`/photos/${id}?populate=*`, {
    next: { revalidate: 30 },
  });
  return res?.data ?? null;
}

export async function getPhotographers() {
  return strapiFetch<ListResponse<PhotographerAttrs>>(
    `/photographers?sort=name:asc&pagination[pageSize]=100&publicationState=live`,
    { next: { revalidate: 120 } },
  );
}

export async function getPendingPhotos(token: string) {
  const res = await fetch(
    `${STRAPI}/api/photos?filters[status][$eq]=pending&populate=*&pagination[pageSize]=100`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as ListResponse<PhotoAttrs>;
}

export async function getPendingOfficialAlbums(token: string) {
  // Official album uses draft & publish: submissions are created without publishedAt (drafts).
  // Default REST publicationState is "live" only, which hides them — use preview to include drafts.
  const params = new URLSearchParams({
    "filters[status][$eq]": "pending",
    populate: "*",
    "pagination[pageSize]": "100",
    publicationState: "preview",
  });
  const res = await fetch(`${STRAPI}/api/official-albums?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as ListResponse<OfficialAlbumAttrs>;
}

export { STRAPI };
