import { NextResponse } from "next/server";
import { getStrapiBaseUrl } from "@/lib/strapi-env";

const STRAPI = getStrapiBaseUrl();
const TOKEN = process.env.STRAPI_API_TOKEN?.trim();

type StrapiList = {
  data?: Array<{ id: number; attributes?: { likeCount?: number | null } }>;
};

type StrapiSingle = {
  data?: { id: number; attributes?: { likeCount?: number | null } } | null;
};

function authHeaders(): HeadersInit {
  return TOKEN ? ({ Authorization: `Bearer ${TOKEN}` } as HeadersInit) : ({} as HeadersInit);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsRaw = (searchParams.get("ids") ?? "").trim();
  const ids = idsRaw
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 100);

  if (!ids.length) return NextResponse.json({ counts: {} });

  const params = new URLSearchParams();
  params.set("pagination[pageSize]", String(ids.length));
  params.set("fields[0]", "likeCount");
  for (let i = 0; i < ids.length; i++) params.set(`filters[id][$in][${i}]`, String(ids[i]));

  try {
    const res = await fetch(`${STRAPI}/api/photos?${params.toString()}`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ counts: {} });
    const json = (await res.json()) as StrapiList;
    const counts: Record<string, number> = {};
    for (const row of json.data ?? []) {
      const c = Number(row.attributes?.likeCount ?? 0);
      counts[String(row.id)] = Number.isFinite(c) && c > 0 ? c : 0;
    }
    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}

export async function POST(req: Request) {
  if (!TOKEN) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as { photoId?: number; delta?: number } | null;
  const photoId = Number(body?.photoId ?? 0);
  const delta = Number(body?.delta ?? 0);
  if (!Number.isFinite(photoId) || photoId <= 0 || (delta !== 1 && delta !== -1)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const currentRes = await fetch(`${STRAPI}/api/photos/${photoId}?fields[0]=likeCount`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!currentRes.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const currentJson = (await currentRes.json()) as StrapiSingle;
    const current = Number(currentJson.data?.attributes?.likeCount ?? 0);
    const nextLikeCount = Math.max(0, (Number.isFinite(current) ? current : 0) + delta);

    const updateRes = await fetch(`${STRAPI}/api/photos/${photoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      } as HeadersInit,
      body: JSON.stringify({ data: { likeCount: nextLikeCount } }),
      cache: "no-store",
    });
    if (!updateRes.ok) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
    return NextResponse.json({ likeCount: nextLikeCount });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}

