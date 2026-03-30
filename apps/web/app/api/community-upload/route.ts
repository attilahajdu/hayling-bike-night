import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createCommunityPhotoRecord, fetchGalleryContext } from "@/lib/community-upload-strapi";
import {
  COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE,
} from "@/lib/community-upload-config";
import { redirectSameOrigin } from "@/lib/request-site";
import { shouldUploadViaStrapi, saveImageViaStrapi } from "@/lib/strapi-upload";

const TOKEN = process.env.STRAPI_API_TOKEN?.trim();

function safe(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : "";
}

function redirectTo(req: Request, path: string) {
  return redirectSameOrigin(req, path);
}

async function saveImage(file: File, folder: "community" | "pro") {
  if (!file.type.startsWith("image/")) throw new Error("invalid-file-type");
  if (file.size > COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE) throw new Error("file-too-large");

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

/** Legacy: multipart body through this server (local dev without Supabase direct upload). */
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
  if (photoFiles.length > 10) {
    return redirectTo(req, "/upload?error=too-many");
  }

  const { galleryEntryId, eventId } = await fetchGalleryContext(TOKEN);

  const uploaderHandle = safe(form.get("uploaderHandle")) || null;
  const subjectKeywords = safe(form.get("subjectKeywords")) || null;
  let savedCount = 0;
  let queuedCount = 0;

  const useStrapiDisk = shouldUploadViaStrapi();
  let lastUploadError = "";

  for (const photoFile of photoFiles) {
    let imageUrl = "";
    try {
      imageUrl = useStrapiDisk
        ? await saveImageViaStrapi(photoFile, "community")
        : await saveImage(photoFile, "community");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      lastUploadError = msg;
      console.error("[community-upload] save failed", msg);
      continue;
    }

    let createRes: Response;
    try {
      createRes = await createCommunityPhotoRecord(TOKEN, {
        imageUrl,
        uploaderHandle,
        subjectKeywords,
        galleryEntryId,
        eventId,
      });
    } catch {
      await queueFallbackSubmission({
        type: "community",
        createdAt: new Date().toISOString(),
        imageUrl,
        uploaderHandle,
        subjectKeywords,
        galleryEntryId,
        eventId,
        strapiStatus: "network_error",
      });
      queuedCount += 1;
      continue;
    }
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
    const m = /strapi-upload-(\d+)/.exec(lastUploadError);
    const detail = m?.[1] ?? "";
    const q = detail ? `?error=file&detail=${encodeURIComponent(detail)}` : "?error=file";
    return redirectTo(req, `/upload${q}`);
  }
  return redirectTo(req, `/upload?ok=1&count=${savedCount}&queued=${queuedCount}`);
}
