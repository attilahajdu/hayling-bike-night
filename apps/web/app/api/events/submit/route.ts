import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";
const TOKEN = process.env.STRAPI_API_TOKEN?.trim();

function safe(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** JSON-only responses so fetch() never relies on redirect/opaque status 0. */
export async function POST(req: Request) {
  if (!TOKEN) {
    return NextResponse.json({ error: "misconfigured", message: "Server misconfigured" }, { status: 500 });
  }

  const form = await req.formData();
  if (safe(form.get("website"))) {
    return NextResponse.json({ ok: true });
  }

  const title = safe(form.get("title"));
  const location = safe(form.get("location"));
  const details = safe(form.get("details"));
  const submitterName = safe(form.get("submitterName"));
  const submitterEmail = safe(form.get("submitterEmail"));
  const consent = safe(form.get("consent"));
  const eventStartRaw = safe(form.get("eventStart"));

  if (!title || !location || !details || !submitterName || !submitterEmail || !consent || !eventStartRaw) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }

  const start = new Date(eventStartRaw);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "date" }, { status: 400 });
  }

  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  const slugBase = slugify(title) || "event";
  const slug = `community-${slugBase}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;

  const noteBlocks = [
    {
      type: "paragraph",
      children: [{ type: "text", text: details.slice(0, 8000) }],
    },
  ];

  const basePayload = {
    title: title.slice(0, 180),
    slug,
    dateStart: start.toISOString(),
    dateEnd: end.toISOString(),
    location: location.slice(0, 240),
    eventKind: "community" as const,
    submitterName: submitterName.slice(0, 120),
    submitterEmail: submitterEmail.slice(0, 180),
  };

  let createRes: Response;
  try {
    createRes = await fetch(`${STRAPI}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      // Keep community submissions in Strapi draft state until an organiser approves.
      // Moderation queue uses `publicationState=preview` (drafts), while the public events page uses `publicationState=live`.
      body: JSON.stringify({ data: { ...basePayload, note: noteBlocks, publishedAt: null } }),
    });
    if (!createRes.ok && createRes.status === 400) {
      createRes = await fetch(`${STRAPI}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ data: { ...basePayload, note: details.slice(0, 8000), publishedAt: null } }),
      });
    }
  } catch {
    return NextResponse.json({ error: "network" }, { status: 503 });
  }

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => "");
    console.error("[events/submit] Strapi error", createRes.status, errText.slice(0, 500));
    return NextResponse.json({ error: "strapi" }, { status: 502 });
  }

  // Force newly created community events to stay as drafts.
  // Some Strapi setups may treat `publishedAt: null` differently during create; doing a post-create PUT removes ambiguity.
  try {
    const createdJson = await createRes.json().catch(() => null);
    const createdId: number | null = createdJson?.data?.id ?? createdJson?.id ?? null;
    if (createdId) {
      await fetch(`${STRAPI}/api/events/${createdId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ data: { publishedAt: null } }),
      });
    }
  } catch {
    // If we can't force draft mode, we still created the event; moderation will handle it.
  }

  return NextResponse.json({ ok: true, submitted: true });
}
