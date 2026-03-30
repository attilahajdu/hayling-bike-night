/** Community upload limits — direct-to-Supabase avoids Netlify request body limits. */

export const COMMUNITY_UPLOAD_MAX_FILES = 10;
/** Per image (phone photos are often 2–4 MB). */
export const COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE = 15 * 1024 * 1024;
/** Safety cap for one submission (10 × 15 MB). */
export const COMMUNITY_UPLOAD_MAX_TOTAL_BYTES = COMMUNITY_UPLOAD_MAX_FILES * COMMUNITY_UPLOAD_MAX_BYTES_PER_FILE;

export const COMMUNITY_ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
