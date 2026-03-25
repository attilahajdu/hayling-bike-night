import { NextRequest, NextResponse } from "next/server";
import { getStrapiOriginForRewrites } from "@/lib/strapi-env";

export const runtime = "nodejs";

function unsafeUploadPathSegments(segments: string[]): boolean {
  return segments.some((s) => !s || s === "." || s === ".." || s.includes("/") || s.includes("\\"));
}

/**
 * Proxies `/strapi-uploads/*` → Strapi `/uploads/*` at request time.
 * Netlify + Next external rewrites are unreliable for cross-host static files;
 * this handler always uses runtime `STRAPI_URL` and streams the file back.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path: segments = [] } = await ctx.params;
  if (!segments.length || unsafeUploadPathSegments(segments)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const origin = getStrapiOriginForRewrites();
  if (!origin) {
    return new NextResponse("Strapi origin not configured", { status: 503 });
  }

  const subPath = segments.map(encodeURIComponent).join("/");
  const target = `${origin}/uploads/${subPath}`;

  let upstream: Response;
  try {
    upstream = await fetch(target, { next: { revalidate: 3600 } });
  } catch {
    return new NextResponse("Upstream unreachable", { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse(upstream.statusText, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
