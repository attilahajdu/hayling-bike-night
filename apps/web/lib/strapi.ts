const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";

export type StrapiImage = {
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
};

export type StrapiMedia = { data: { attributes: StrapiImage } | null };

function mediaUrl(img: StrapiImage | undefined): string | null {
  if (!img?.url) return null;
  if (img.url.startsWith("http")) return img.url;
  return `${STRAPI}${img.url}`;
}

export type EventAttrs = {
  title: string;
  slug: string;
  dateStart: string;
  dateEnd: string;
  location: string;
  note?: string | null;
};

export type NewsAttrs = {
  title: string;
  slug: string;
  body: string;
  publishedAt: string;
  tags?: string | null;
  coverImage?: StrapiMedia;
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
  image?: StrapiMedia;
  event?: { data: { id: number; attributes: EventAttrs } | null };
  photographer?: { data: { id: number; attributes: PhotographerAttrs } | null };
  submittedBy?: string | null;
};

type ListResponse<T> = {
  data: Array<{ id: number; attributes: T }>;
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
};

function authHeaders(): HeadersInit {
  const t = process.env.STRAPI_API_TOKEN;
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
      console.warn("Strapi fetch failed", url, res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn("Strapi unreachable", e);
    return null;
  }
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

export async function getPhotos(options: {
  page?: number;
  pageSize?: number;
  eventSlug?: string;
  q?: string;
  status?: PhotoAttrs["status"];
}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 24;
  const status = options.status ?? "published";
  const params = new URLSearchParams();
  params.set("populate", "*");
  params.set("sort", "createdAt:desc");
  params.set("pagination[page]", String(page));
  params.set("pagination[pageSize]", String(pageSize));
  params.set("filters[status][$eq]", status);
  if (options.eventSlug) {
    params.set("filters[event][slug][$eq]", options.eventSlug);
  }
  /* “Find my bike” — admins/photographers set subjectKeywords (plate, colours, jacket, etc.) */
  if (options.q?.trim()) {
    params.set("filters[subjectKeywords][$containsi]", options.q.trim());
  }
  return strapiFetch<ListResponse<PhotoAttrs>>(`/photos?${params.toString()}`, {
    next: { revalidate: 30 },
  });
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

export { mediaUrl, STRAPI };
