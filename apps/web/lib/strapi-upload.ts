const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";
const TOKEN = process.env.STRAPI_API_TOKEN;

/** Netlify/Vercel/AWS Lambda cannot persist writes to `public/uploads`. */
export function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
}

/** Saves image on Strapi (Render) disk; returns absolute URL for DB. */
export async function saveImageViaStrapi(
  file: File,
  folder: "community" | "pro",
): Promise<string> {
  const form = new FormData();
  form.append("files", file);
  const q = folder === "pro" ? "?folder=pro" : "";
  const res = await fetch(`${STRAPI}/api/photos/community-image${q}`, {
    method: "POST",
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
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
