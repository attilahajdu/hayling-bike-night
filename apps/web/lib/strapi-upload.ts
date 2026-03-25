import { getStrapiBaseUrl, strapiOriginIsRemote } from "./strapi-env";
import { isSupabaseStorageConfigured, uploadToSupabaseStorage } from "./supabase-storage";

const STRAPI = getStrapiBaseUrl();
const TOKEN = process.env.STRAPI_API_TOKEN?.trim();
const COMMUNITY_UPLOAD_SECRET = process.env.COMMUNITY_UPLOAD_SECRET?.trim();

export function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
}

/**
 * True when images should NOT be saved to local `public/uploads`.
 * Supabase Storage is preferred when configured; Strapi disk is the legacy fallback.
 */
export function shouldUploadViaStrapi(): boolean {
  if (isSupabaseStorageConfigured()) return true;
  return isServerlessRuntime() || strapiOriginIsRemote();
}

/**
 * Saves image via the best available backend:
 *  1. Supabase Storage (if configured) — persistent, CDN-backed, survives Render restarts.
 *  2. Strapi disk on Render (legacy fallback) — ephemeral, files lost on restart.
 *
 * Returns the public URL to store in the Strapi photo record.
 */
export async function saveImageViaStrapi(
  file: File,
  folder: "community" | "pro",
): Promise<string> {
  if (isSupabaseStorageConfigured()) {
    return uploadToSupabaseStorage(file, folder);
  }

  const form = new FormData();
  form.append("files", file);
  const q = folder === "pro" ? "?folder=pro" : "";
  const headers: Record<string, string> = {};
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  if (COMMUNITY_UPLOAD_SECRET) headers["x-community-upload-secret"] = COMMUNITY_UPLOAD_SECRET;

  const res = await fetch(`${STRAPI}/api/photos/community-image${q}`, {
    method: "POST",
    headers: Object.keys(headers).length ? headers : {},
    body: form,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`strapi-upload-${res.status}-${t.slice(0, 120)}`);
  }
  const json = (await res.json()) as { path?: string };
  const rel = json.path ?? "";
  if (!rel.startsWith("/")) throw new Error("strapi-upload-invalid-path");
  return rel;
}
