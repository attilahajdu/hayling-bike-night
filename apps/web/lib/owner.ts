/** Comma-separated emails allowed to use the Owner Console (tablet moderation). */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.OWNER_EMAILS ?? "";
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const devLoginEmail = (process.env.DEV_LOGIN_EMAIL ?? "").trim().toLowerCase();
  if (devLoginEmail) allowed.push(devLoginEmail);
  if (process.env.NODE_ENV === "development") {
    // Keep local moderation unblocked when an old dev session is still active.
    allowed.push("dev@hayling-bike-night.local");
  }
  return allowed.includes(email.toLowerCase());
}
