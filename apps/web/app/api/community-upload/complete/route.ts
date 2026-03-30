import { NextResponse } from "next/server";
import { createCommunityPhotoRecord, fetchGalleryContext } from "@/lib/community-upload-strapi";
import { queueFallbackSubmission } from "@/lib/queue-fallback-local";
import { assertPublicUrlMatchesStoragePath } from "@/lib/supabase-storage";

const TOKEN = process.env.STRAPI_API_TOKEN?.trim();

type Body = {
  consent?: boolean;
  uploaderHandle?: string | null;
  subjectKeywords?: string | null;
  uploads?: Array<{ path?: string; publicUrl?: string }>;
};

export async function POST(req: Request) {
  try {
    return await handleCompletePost(req);
  } catch (e) {
    console.error("[community-upload/complete] unhandled", e);
    return NextResponse.json(
      { ok: false, error: "server_error", message: "Could not complete upload. Please try again." },
      { status: 500 },
    );
  }
}

async function handleCompletePost(req: Request) {
  if (!TOKEN) {
    return NextResponse.json({ error: "misconfigured", message: "Server misconfigured (missing STRAPI_API_TOKEN)." }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.consent) {
    return NextResponse.json({ error: "consent_required", message: "Please confirm consent to upload." }, { status: 400 });
  }

  const uploads = Array.isArray(body.uploads) ? body.uploads : [];
  if (uploads.length === 0) {
    return NextResponse.json({ error: "no_uploads", message: "No images to register." }, { status: 400 });
  }

  const uploaderHandle = typeof body.uploaderHandle === "string" ? body.uploaderHandle.trim() || null : null;
  const subjectKeywords = typeof body.subjectKeywords === "string" ? body.subjectKeywords.trim() || null : null;

  const { galleryEntryId, eventId } = await fetchGalleryContext(TOKEN);

  let savedCount = 0;
  let queuedCount = 0;
  const errors: string[] = [];

  for (const u of uploads) {
    const p = typeof u.path === "string" ? u.path.trim() : "";
    const publicUrl = typeof u.publicUrl === "string" ? u.publicUrl.trim() : "";
    if (!p || !publicUrl) {
      errors.push("Missing path or URL for one image.");
      continue;
    }
    if (!assertPublicUrlMatchesStoragePath(p, publicUrl)) {
      errors.push("Invalid image URL for one image.");
      continue;
    }

    let createRes: Response;
    try {
      createRes = await createCommunityPhotoRecord(TOKEN, {
        imageUrl: publicUrl,
        uploaderHandle,
        subjectKeywords,
        galleryEntryId,
        eventId,
      });
    } catch {
      await queueFallbackSubmission({
        type: "community",
        createdAt: new Date().toISOString(),
        imageUrl: publicUrl,
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
        imageUrl: publicUrl,
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
    return NextResponse.json(
      {
        ok: false,
        error: "none_saved",
        message: errors.length ? errors.join(" ") : "Could not save any photos. Please try again.",
        errors,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    savedCount,
    queuedCount,
    queuedOnly: savedCount === 0 && queuedCount > 0,
    errors: errors.length ? errors : undefined,
  });
}
