import { NextResponse } from "next/server";
import { getStrapiBaseUrl } from "@/lib/strapi-env";

type Choice = "going" | "interested";

function clamp(n: number) {
  return Math.max(0, Math.floor(n));
}

function parseChoice(v: unknown): Choice | null {
  if (v === "going" || v === "interested") return v;
  return null;
}

function parsePrevious(v: unknown): Choice | null {
  if (v === null || v === undefined || v === "") return null;
  return parseChoice(v);
}

type StrapiEventOne = {
  data: {
    id: number;
    attributes: { goingCount?: number | null; interestedCount?: number | null };
  } | null;
};

async function readCountsFromStrapi(
  STRAPI: string,
  TOKEN: string,
  eventId: number,
): Promise<{ going: number; interested: number } | null> {
  const getRes = await fetch(`${STRAPI}/api/events/${eventId}?publicationState=live`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!getRes.ok) return null;
  const json = (await getRes.json()) as StrapiEventOne;
  const attrs = json?.data?.attributes;
  if (!json?.data?.id || !attrs) return null;
  return {
    going: clamp(Number(attrs.goingCount ?? 0)),
    interested: clamp(Number(attrs.interestedCount ?? 0)),
  };
}

/** Live counts for hydration (avoids stale HTML / CDN caching showing wrong totals). */
export async function GET(req: Request) {
  const STRAPI = getStrapiBaseUrl().replace(/\/$/, "");
  const TOKEN = process.env.STRAPI_API_TOKEN?.trim();
  if (!TOKEN) {
    return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
  }

  const eventId = Number(new URL(req.url).searchParams.get("eventId"));
  if (!Number.isFinite(eventId) || eventId < 1) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const counts = await readCountsFromStrapi(STRAPI, TOKEN, eventId);
  if (!counts) {
    return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, goingCount: counts.going, interestedCount: counts.interested },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}

export async function POST(req: Request) {
  const STRAPI = getStrapiBaseUrl().replace(/\/$/, "");
  const TOKEN = process.env.STRAPI_API_TOKEN?.trim();
  if (!TOKEN) {
    return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true, goingCount: 0, interestedCount: 0 });
  }

  const eventId = Number(body.eventId);
  const choice = parseChoice(body.choice);
  const previousChoice = parsePrevious(body.previousChoice);

  if (!Number.isFinite(eventId) || eventId < 1 || !choice) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (previousChoice !== null && previousChoice !== "going" && previousChoice !== "interested") {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const current = await readCountsFromStrapi(STRAPI, TOKEN, eventId);
  if (!current) {
    return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
  }

  let going = current.going;
  let interested = current.interested;

  if (previousChoice === choice) {
    return NextResponse.json({ ok: true, goingCount: going, interestedCount: interested });
  }

  if (previousChoice === "going") going = clamp(going - 1);
  if (previousChoice === "interested") interested = clamp(interested - 1);

  if (choice === "going") going += 1;
  if (choice === "interested") interested += 1;

  const putRes = await fetch(`${STRAPI}/api/events/${eventId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      data: {
        goingCount: going,
        interestedCount: interested,
      },
    }),
  });

  if (!putRes.ok) {
    const t = await putRes.text().catch(() => "");
    console.error("[events/rsvp] Strapi PUT failed", putRes.status, t.slice(0, 200));
    return NextResponse.json({ ok: false, error: "Could not save" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, goingCount: going, interestedCount: interested });
}
