/** Shared Strapi helpers for community upload flows (direct + legacy). */

const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";

export async function fetchGalleryContext(token: string): Promise<{
  galleryEntryId: number | null;
  eventId: number | null;
}> {
  try {
    const geRes = await fetch(
      `${STRAPI}/api/gallery-entries?sort=galleryLiveAt:desc&pagination[pageSize]=1&populate=event`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!geRes.ok) return { galleryEntryId: null, eventId: null };
    const geJson = await geRes.json();
    const ge = geJson?.data?.[0];
    const galleryEntryId = ge?.id ?? null;
    const eventId = ge?.attributes?.event?.data?.id ?? null;
    return { galleryEntryId, eventId };
  } catch {
    return { galleryEntryId: null, eventId: null };
  }
}

export async function createCommunityPhotoRecord(
  token: string,
  payload: {
    imageUrl: string;
    uploaderHandle: string | null;
    subjectKeywords: string | null;
    galleryEntryId: number | null;
    eventId: number | null;
  },
): Promise<Response> {
  return fetch(`${STRAPI}/api/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      data: {
        title: payload.uploaderHandle ? `Community upload by ${payload.uploaderHandle}` : "Community upload",
        imageUrl: payload.imageUrl,
        thumbnailUrl: payload.imageUrl,
        status: "pending",
        isExternal: false,
        uploaderHandle: payload.uploaderHandle,
        submittedBy: payload.uploaderHandle || "Community",
        subjectKeywords: payload.subjectKeywords,
        consentConfirmed: true,
        galleryEntry: payload.galleryEntryId,
        event: payload.eventId,
      },
    }),
  });
}
