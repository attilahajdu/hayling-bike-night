import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { redirectSameOrigin } from "@/lib/request-site";

const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";
const TOKEN = process.env.STRAPI_API_TOKEN;

function safe(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function redirectTo(req: Request, path: string) {
  return redirectSameOrigin(req, path);
}

async function saveImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("invalid-file-type");
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error("file-too-large");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
  const relativePath = `/uploads/pro/${fileName}`;
  const fullDir = path.join(process.cwd(), "public", "uploads", "pro");
  const fullPath = path.join(fullDir, fileName);

  await mkdir(fullDir, { recursive: true });
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(arrayBuffer));
  return relativePath;
}

async function queueFallbackSubmission(payload: Record<string, unknown>) {
  const dir = path.join(process.cwd(), ".local-run", "submission-queue");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `pro-${Date.now()}-${randomUUID()}.json`);
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function POST(req: Request) {
  if (!TOKEN) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const form = await req.formData();
  if (safe(form.get("website"))) return redirectTo(req, "/submit-album?ok=1");

  const title = safe(form.get("title"));
  const albumUrl = safe(form.get("albumUrl"));
  const submittedByName = safe(form.get("submittedByName"));
  const submittedByEmail = safe(form.get("submittedByEmail"));
  const shortDescription = safe(form.get("shortDescription"));
  const thumbnailFile = form.get("thumbnailFile");

  if (!title || !albumUrl || !submittedByName || !submittedByEmail || !(thumbnailFile instanceof File) || thumbnailFile.size === 0) {
    return redirectTo(req, "/submit-album?error=missing");
  }

  let coverImageUrl = "";
  try {
    coverImageUrl = await saveImage(thumbnailFile);
  } catch {
    return redirectTo(req, "/submit-album?error=file");
  }

  let galleryEntryId: number | null = null;
  let eventId: number | null = null;
  const geRes = await fetch(`${STRAPI}/api/gallery-entries?sort=galleryLiveAt:desc&pagination[pageSize]=1&populate=event`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (geRes.ok) {
    const geJson = await geRes.json();
    const ge = geJson?.data?.[0];
    galleryEntryId = ge?.id ?? null;
    eventId = ge?.attributes?.event?.data?.id ?? null;
  }

  const data: Record<string, unknown> = {
    title,
    // Schema marks slug as required UID, so provide it explicitly.
    slug: `${slugify(title) || "official-album"}-${Date.now().toString().slice(-6)}`,
    albumUrl,
    shopUrl: safe(form.get("shopUrl")) || null,
    coverImageUrl,
    shortDescription: shortDescription || null,
    submittedByName,
    submittedByEmail,
    status: "pending",
    // Strapi draft & publish: without publishedAt entries are API "drafts" (hidden from publicationState=live).
    // Publish the document immediately; custom `status` stays pending until moderation approves the site listing.
    publishedAt: new Date().toISOString(),
  };
  if (galleryEntryId != null) data.galleryEntry = galleryEntryId;
  if (eventId != null) data.event = eventId;

  const createRes = await fetch(`${STRAPI}/api/official-albums`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ data }),
  });
  if (!createRes.ok) {
    const strapiBody = (await createRes.text()).slice(0, 4000);
    await queueFallbackSubmission({
      type: "pro",
      createdAt: new Date().toISOString(),
      title,
      albumUrl,
      coverImageUrl,
      shortDescription: shortDescription || null,
      submittedByName,
      submittedByEmail,
      websiteUrl: safe(form.get("shopUrl")) || null,
      galleryEntryId,
      eventId,
      strapiStatus: createRes.status,
      strapiBody,
    });
    // Do not set ok=1 — Strapi did not store this row (usually missing API token scope: Official album → create).
    return redirectTo(req, `/submit-album?queued=1&code=${createRes.status}`);
  }

  return redirectTo(req, "/submit-album?ok=1");
}
