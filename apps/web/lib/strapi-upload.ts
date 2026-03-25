const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";
/** Trim: Netlify UI sometimes adds accidental whitespace. */
const TOKEN = process.env.STRAPI_API_TOKEN?.trim();
/** Optional shared secret (same on Netlify + Strapi/Render) — bypasses API token hash issues. */
const COMMUNITY_UPLOAD_SECRET = process.env.COMMUNITY_UPLOAD_SECRET?.trim();

/** Netlify/Vercel/AWS Lambda cannot persist writes to `public/uploads`. */
export function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
}

function strapiUrlIsRemote(): boolean {
  const u = (process.env.STRAPI_URL ?? "").toLowerCase();
  return Boolean(u && !u.includes("localhost") && !u.includes("127.0.0.1"));
}

/**
 * Store files on Strapi (Render) when we're serverless OR when the site points at
 * production Strapi. Netlify often does not set NETLIFY at runtime, so relying on
 * that alone breaks uploads (local `public/` is not writable on Netlify).
 */
export function shouldUploadViaStrapi(): boolean {
  return isServerlessRuntime() || strapiUrlIsRemote();
}

/** Saves image on Strapi (Render) disk; returns absolute URL for DB. */
export async function saveImageViaStrapi(
  file: File,
  folder: "community" | "pro",
): Promise<string> {
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
  return `${STRAPI}${rel}`;
}
