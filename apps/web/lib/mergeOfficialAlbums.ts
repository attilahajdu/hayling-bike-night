/**
 * Prefer albums linked to the current gallery week, then top up from all published
 * albums so the home/gallery spotlight can show every pro (e.g. four photographers)
 * even when only some have filed under this week's entry yet.
 */
export function mergeOfficialAlbumsForSpotlight<
  T extends { id: number },
>(forWeek: T[], publishedPool: T[], max = 4): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const a of forWeek) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  for (const a of publishedPool) {
    if (out.length >= max) break;
    if (!seen.has(a.id)) {
      seen.add(a.id);
      out.push(a);
    }
  }
  return out.length ? out : publishedPool;
}
