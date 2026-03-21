import { NextResponse } from "next/server";

/**
 * Public URL the user sees (avoids Netlify deploy-preview hostnames in redirects).
 * Prefer forwarded headers, then Netlify/Next env, then req.url.
 */
export function getRequestSiteOrigin(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.URL?.replace(/\/$/, "") ||
    process.env.DEPLOY_PRIME_URL?.replace(/\/$/, "");
  if (envUrl) {
    return envUrl;
  }
  try {
    return new URL(req.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

/** 303 redirect that stays on the same site the user opened (fixes Netlify CORS on fetch + redirect). */
export function redirectSameOrigin(req: Request, pathnameAndSearch: string): NextResponse {
  const path = pathnameAndSearch.startsWith("/") ? pathnameAndSearch : `/${pathnameAndSearch}`;
  const origin = getRequestSiteOrigin(req);
  return NextResponse.redirect(new URL(path, origin), { status: 303 });
}
