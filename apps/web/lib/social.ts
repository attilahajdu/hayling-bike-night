/**
 * Public Facebook page URL for nav/footer.
 * Set NEXT_PUBLIC_FACEBOOK_PAGE_URL to a full URL (e.g. https://www.facebook.com/yourpage),
 * or set FACEBOOK_PAGE_ID (server) for profile.php?id=… links.
 */
export function getFacebookPageUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL?.replace(/\/$/, "").trim();
  if (explicit) return explicit;
  const id = process.env.FACEBOOK_PAGE_ID?.trim();
  if (id) return `https://www.facebook.com/profile.php?id=${encodeURIComponent(id)}`;
  return "https://www.facebook.com/";
}
