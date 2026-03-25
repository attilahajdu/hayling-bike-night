/**
 * Strapi base URL for API calls and resolving /uploads paths (no trailing slash).
 * Prefer STRAPI_URL; fall back to NEXT_PUBLIC_STRAPI_URL so media URLs still resolve
 * if only the public env var is configured on the host.
 */
export function getStrapiBaseUrl(): string {
  const s = process.env.STRAPI_URL?.replace(/\/$/, "").trim();
  const p = process.env.NEXT_PUBLIC_STRAPI_URL?.replace(/\/$/, "").trim();
  return s || p || "http://localhost:1337";
}

export function strapiOriginIsRemote(): boolean {
  const u = getStrapiBaseUrl().toLowerCase();
  return Boolean(u && !u.includes("localhost") && !u.includes("127.0.0.1"));
}

/**
 * Absolute origin for next.config rewrites (https://your-strapi.example).
 * Returns null for local Strapi so we do not register a broken proxy.
 */
export function getStrapiOriginForRewrites(): string | null {
  const base = getStrapiBaseUrl();
  try {
    const url = new URL(base.startsWith("http") ? base : `https://${base}`);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    return url.origin;
  } catch {
    return null;
  }
}
