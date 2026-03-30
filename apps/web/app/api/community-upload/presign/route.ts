import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  COMMUNITY_ALLOWED_MIME,
  COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE,
  COMMUNITY_UPLOAD_MAX_FILES,
  COMMUNITY_UPLOAD_MAX_TOTAL_BYTES,
} from "@/lib/community-upload-config";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "uploads";

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "not_configured", message: "Supabase Storage is not configured on this server." },
      { status: 501 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const files = (body as { files?: Array<{ type?: string; size?: number }> })?.files;
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "no_files" }, { status: 400 });
  }
  if (files.length > COMMUNITY_UPLOAD_MAX_FILES) {
    return NextResponse.json({ error: "too_many", max: COMMUNITY_UPLOAD_MAX_FILES }, { status: 400 });
  }

  let total = 0;
  for (const f of files) {
    const size = typeof f.size === "number" ? f.size : 0;
    const type = typeof f.type === "string" ? f.type : "";
    if (!COMMUNITY_ALLOWED_MIME.has(type)) {
      return NextResponse.json({ error: "bad_type", message: "Only JPEG, PNG, or WebP images are allowed." }, { status: 400 });
    }
    if (size <= 0 || size > COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE) {
      return NextResponse.json(
        {
          error: "file_too_large",
          maxBytes: COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE,
          message: `Each image must be under ${Math.round(COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE / (1024 * 1024))} MB.`,
        },
        { status: 400 },
      );
    }
    total += size;
  }
  if (total > COMMUNITY_UPLOAD_MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: "total_too_large", maxTotalBytes: COMMUNITY_UPLOAD_MAX_TOTAL_BYTES }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const uploads: Array<{ path: string; signedUrl: string; token: string; publicUrl: string }> = [];

  for (const f of files) {
    const type = f.type as string;
    const ext = extFromMime(type);
    const path = `community/${Date.now()}-${randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[community-upload/presign]", error);
      return NextResponse.json({ error: "presign_failed", message: error?.message ?? "Could not create upload URL." }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    uploads.push({
      path: data.path,
      signedUrl: data.signedUrl,
      token: data.token,
      publicUrl: pub.publicUrl,
    });
  }

  return NextResponse.json({ ok: true, bucket: BUCKET, uploads });
}
