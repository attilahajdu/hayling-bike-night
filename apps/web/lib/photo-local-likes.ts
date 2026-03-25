/** Keys match GalleryGrid / PhotoEngagementBar (localStorage-only “likes”). */

export function readLocalLikeCount(photoId: number): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(`hbn-photo-like-count-${photoId}`);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}
