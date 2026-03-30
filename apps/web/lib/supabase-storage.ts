import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

/** Single source of truth — presign, getPublicUrl, and verification must use the same bucket. */
export function getSupabaseStorageBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "uploads";
}

const BUCKET = getSupabaseStorageBucketName();

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/**
 * Uploads a file to Supabase Storage and returns the **public** URL.
 * The bucket must exist and have public access enabled (or use signed URLs).
 */
export async function uploadToSupabaseStorage(
  file: File,
  folder: "community" | "pro",
): Promise<string> {
  const supabase = getClient();
  const ext = extFromMime(file.type);
  const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
  const storagePath = `${folder}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`supabase-storage-upload: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return publicUrlData.publicUrl;
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

/**
 * Ensures the browser-reported public URL matches what Supabase would serve for `path`
 * (prevents forging Strapi records pointing at someone else's storage).
 */
export function assertPublicUrlMatchesStoragePath(path: string, claimedPublicUrl: string): boolean {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return false;
  if (!path.startsWith("community/")) return false;
  try {
    const supabase = getClient();
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const a = new URL(claimedPublicUrl);
    const b = new URL(data.publicUrl);
    return a.origin === b.origin && a.pathname === b.pathname;
  } catch {
    return false;
  }
}
