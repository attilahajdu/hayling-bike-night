/** Comma-separated emails allowed to use the Owner Console (tablet moderation). */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.OWNER_EMAILS ?? "";
  const allowed = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
