import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";
const TOKEN = process.env.STRAPI_API_TOKEN;

function safe(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

function redirectTo(req: Request, path: string) {
  return NextResponse.redirect(new URL(path, req.url), { status: 303 });
}

async function saveImage(file: File, folder: "community" | "pro") {
  if (!file.type.startsWith("image/")) throw new Error("invalid-file-type");
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error("file-too-large");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
  const relativePath = `/uploads/${folder}/${fileName}`;
  const fullDir = path.join(process.cwd(), "public", "uploads", folder);
  const fullPath = path.join(fullDir, fileName);

  await mkdir(fullDir, { recursive: true });
  const arrayBuffer = await file.arrayBuffer();
  await writeFile(fullPath, Buffer.from(arrayBuffer));
  return relativePath;
}

async function queueFallbackSubmission(payload: Record<string, unknown>) {
  const dir = path.join(process.cwd(), ".local-run", "submission-queue");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `community-${Date.now()}-${randomUUID()}.json`);
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function POST(req: Request) {
  if (!TOKEN) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const form = await req.formData();
  if (safe(form.get("website"))) return redirectTo(req, "/upload?ok=1");

  const consent = safe(form.get("consent"));
  const rawFiles = form.getAll("photoFiles");
  const photoFiles = rawFiles.filter((f): f is File => f instanceof File && f.size > 0);
  if (!consent || photoFiles.length === 0) {
    return redirectTo(req, "/upload?error=missing");
  }
  if (photoFiles.length > 20) {
    return redirectTo(req, "/upload?error=too-many");
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

  const uploaderHandle = safe(form.get("uploaderHandle")) || null;
  const subjectKeywords = safe(form.get("subjectKeywords")) || null;
  let savedCount = 0;
  let queuedCount = 0;

  for (const photoFile of photoFiles) {
    let imageUrl = "";
    try {
      imageUrl = await saveImage(photoFile, "community");
    } catch {
      continue;
    }

    const createRes = await fetch(`${STRAPI}/api/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({
        data: {
          title: uploaderHandle ? `Community upload by ${uploaderHandle}` : "Community upload",
          imageUrl,
          thumbnailUrl: imageUrl,
          status: "pending",
          isExternal: false,
          uploaderHandle,
          submittedBy: uploaderHandle || "Community",
          subjectKeywords,
          consentConfirmed: true,
          galleryEntry: galleryEntryId,
          event: eventId,
        },
      }),
    });
    if (!createRes.ok) {
      await queueFallbackSubmission({
        type: "community",
        createdAt: new Date().toISOString(),
        imageUrl,
        uploaderHandle,
        subjectKeywords,
        galleryEntryId,
        eventId,
        strapiStatus: createRes.status,
      });
      queuedCount += 1;
      continue;
    }
    savedCount += 1;
  }

  if (savedCount === 0 && queuedCount === 0) {
    return redirectTo(req, "/upload?error=file");
  }
  return redirectTo(req, `/upload?ok=1&count=${savedCount}&queued=${queuedCount}`);
}
