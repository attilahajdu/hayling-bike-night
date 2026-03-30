import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Best-effort local JSON queue for dev when Strapi is unreachable.
 * On Netlify/serverless the filesystem is read-only — never throw; log only.
 */
export async function queueFallbackSubmission(payload: Record<string, unknown>): Promise<void> {
  try {
    const dir = path.join(process.cwd(), ".local-run", "submission-queue");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `community-${Date.now()}-${randomUUID()}.json`);
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  } catch (e) {
    console.error("[queue-fallback] cannot write local queue (expected on serverless):", e);
  }
}
