import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { redirectSameOrigin } from "@/lib/request-site";

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

export async function POST(req: Request) {
  if (!TOKEN) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const form = await req.formData();
  if (safe(form.get("website"))) {
    return redirectSameOrigin(req, "/events?ok=1");
  }

  const title = safe(form.get("title"));
  const location = safe(form.get("location"));
  const details = safe(form.get("details"));
  const submitterName = safe(form.get("submitterName"));
  const submitterEmail = safe(form.get("submitterEmail"));
  const consent = safe(form.get("consent"));
  const eventStartRaw = safe(form.get("eventStart"));

  if (!title || !location || !details || !submitterName || !submitterEmail || !consent || !eventStartRaw) {
    return redirectSameOrigin(req, "/events?error=missing");
  }

  const start = new Date(eventStartRaw);
  if (Number.isNaN(start.getTime())) {
    return redirectSameOrigin(req, "/events?error=date");
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
    return redirectSameOrigin(req, "/events?error=network");
  }

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => "");
    console.error("[events/submit] Strapi error", createRes.status, errText.slice(0, 500));
    return redirectSameOrigin(req, "/events?error=strapi");
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

  return redirectSameOrigin(req, "/events?submitted=1");
}
