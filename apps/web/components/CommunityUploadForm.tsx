"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Config = {
  directUpload: boolean;
  bucket: string;
  maxFiles: number;
  maxBytesPerFile: number;
  maxTotalBytes: number;
};

function formatMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function CommunityUploadForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [note, setNote] = useState("");
  const [queuedOnly, setQueuedOnly] = useState(false);
  const [progress, setProgress] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setNote("");
    setQueuedOnly(false);
    setProgress("");

    const form = event.currentTarget;
    const input = form.querySelector<HTMLInputElement>('input[name="photoFiles"]');
    const files = input?.files;
    if (!files?.length) {
      setStatus("error");
      setNote("Please choose at least one image.");
      return;
    }

    try {
      const cfgRes = await fetch("/api/community-upload/config");
      if (!cfgRes.ok) throw new Error("config");
      const cfg = (await cfgRes.json()) as Config;

      if (!cfg.directUpload) {
        await submitLegacyMultipart(form);
        return;
      }

      const fileArr = Array.from(files);
      if (fileArr.length > cfg.maxFiles) {
        setStatus("error");
        setNote(`Please upload at most ${cfg.maxFiles} images at a time.`);
        return;
      }

      let total = 0;
      for (const f of fileArr) {
        if (!f.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
          setStatus("error");
          setNote("Only JPEG, PNG, or WebP images are allowed.");
          return;
        }
        if (f.size > cfg.maxBytesPerFile) {
          setStatus("error");
          setNote(`Each image must be under ${formatMb(cfg.maxBytesPerFile)} (one file is too large).`);
          return;
        }
        total += f.size;
      }
      if (total > cfg.maxTotalBytes) {
        setStatus("error");
        setNote(
          `Total size of this batch is too large (max about ${formatMb(cfg.maxTotalBytes)} for all images together). Try fewer photos or smaller files.`,
        );
        return;
      }

      const consent = form.querySelector<HTMLInputElement>('input[name="consent"]')?.checked;
      if (!consent) {
        setStatus("error");
        setNote("Please confirm consent to upload.");
        return;
      }

      setProgress("Preparing upload…");
      const presignRes = await fetch("/api/community-upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: fileArr.map((f) => ({ type: f.type, size: f.size })),
        }),
      });

      const presignJson = (await presignRes.json().catch(() => ({}))) as Record<string, unknown>;
      if (!presignRes.ok) {
        setStatus("error");
        setNote(mapPresignError(presignJson, presignRes.status));
        return;
      }

      const uploads = presignJson.uploads as
        | Array<{ path: string; token: string; publicUrl: string }>
        | undefined;
      const bucket = (presignJson.bucket as string) || cfg.bucket;
      if (!uploads?.length || uploads.length !== fileArr.length) {
        setStatus("error");
        setNote("Could not prepare uploads. Please try again.");
        return;
      }

      const supabase = getBrowserSupabase();

      for (let i = 0; i < fileArr.length; i++) {
        setProgress(`Uploading image ${i + 1} of ${fileArr.length}…`);
        const file = fileArr[i];
        const up = uploads[i];
        const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(up.path, up.token, file, {
          contentType: file.type,
        });
        if (error) {
          setStatus("error");
          setNote(
            `Upload failed on image ${i + 1}: ${error.message}. Check your connection and try again, or upload fewer images at once.`,
          );
          return;
        }
      }

      setProgress("Saving…");
      const uploaderHandle = form.querySelector<HTMLInputElement>('input[name="uploaderHandle"]')?.value?.trim() ?? "";
      const subjectKeywords = form.querySelector<HTMLInputElement>('input[name="subjectKeywords"]')?.value?.trim() ?? "";

      const completeRes = await fetch("/api/community-upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          uploaderHandle: uploaderHandle || null,
          subjectKeywords: subjectKeywords || null,
          uploads: uploads.map((u) => ({ path: u.path, publicUrl: u.publicUrl })),
        }),
      });

      const completeJson = (await completeRes.json().catch(() => ({}))) as Record<string, unknown>;

      if (!completeRes.ok || !completeJson.ok) {
        setStatus("error");
        setNote(
          typeof completeJson.message === "string"
            ? completeJson.message
            : "Could not save your photos for review. Please try again.",
        );
        return;
      }

      const savedCount = Number(completeJson.savedCount ?? 0);
      const queuedCount = Number(completeJson.queuedCount ?? 0);
      const qOnly = Boolean(completeJson.queuedOnly);

      setStatus("ok");
      setQueuedOnly(qOnly);
      if (qOnly && savedCount === 0) {
        setNote(`${queuedCount} image(s) queued locally because the review server could not be reached.`);
      } else if (queuedCount > 0) {
        setNote(`${savedCount} image(s) sent for moderation. ${queuedCount} image(s) queued for retry.`);
      } else {
        setNote(`${savedCount || fileArr.length} image(s) sent for moderation successfully.`);
      }
      setProgress("");
      form.reset();
    } catch {
      setStatus("error");
      setNote("Upload failed. Please check your connection and try again.");
      setProgress("");
    }
  }

  async function submitLegacyMultipart(form: HTMLFormElement) {
    const data = new FormData(form);
    const res = await fetch("/api/community-upload", { method: "POST", body: data });

    if (!res.ok) {
      if (res.status === 413) {
        setStatus("error");
        setNote("That upload is too large for this server’s single-request limit. Configure Supabase direct uploads, or upload fewer/smaller images.");
        return;
      }
      throw new Error("Upload failed");
    }
    const url = new URL(res.url);
    const ok = url.searchParams.get("ok");
    const savedCount = Number(url.searchParams.get("count") ?? "0");
    const queuedCount = Number(url.searchParams.get("queued") ?? "0");

    if (ok) {
      setStatus("ok");
      if (queuedCount > 0 && savedCount === 0) {
        setQueuedOnly(true);
        setNote(`${queuedCount} image(s) queued locally because Strapi write permission is currently restricted.`);
      } else if (queuedCount > 0) {
        setNote(`${savedCount} image(s) sent for moderation. ${queuedCount} image(s) queued locally.`);
      } else {
        setNote(`${savedCount || 1} image(s) sent for moderation successfully.`);
      }
      form.reset();
    } else {
      setStatus("error");
      const err = url.searchParams.get("error");
      const detail = url.searchParams.get("detail");
      if (err === "too-many") setNote("Please upload up to 10 images at a time.");
      else if (detail === "401" || detail === "403")
        setNote(
          "Strapi rejected the API token. Re-paste STRAPI_API_TOKEN in Netlify with no spaces, or regenerate the token in Strapi admin and update Netlify, then redeploy.",
        );
      else if (detail === "404")
        setNote(
          "Upload failed: the photo server is missing the upload route. Deploy the latest Strapi (CMS) from GitHub, then try again.",
        );
      else if (detail === "413") setNote("That file is too large (max 10 MB per image in legacy mode).");
      else setNote("Upload failed. Please check file type and try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" encType="multipart/form-data" className="card space-y-4 p-5">
      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Drop your photos here or click to browse *
        <input
          name="photoFiles"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          className="mt-1 block h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 pt-2 text-ink file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-[rgb(var(--color-on-accent))] dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Up to 10 images per submission. Each file up to about 15 MB (phone photos are fine). Images upload directly to storage — no tiny combined limit.
      </p>

      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Your name / handle (optional)
        <input
          name="uploaderHandle"
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>

      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Tags
        <input
          name="subjectKeywords"
          placeholder="e.g. orange ktm, sunset, john's cafe"
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>I have permission to share this photo and accept the upload policy.</span>
      </label>
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full disabled:opacity-60">
        {status === "submitting" ? progress || "Submitting…" : "Submit For Review"}
      </button>

      {status === "ok" ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200">
          {queuedOnly ? "Saved locally only (not in moderation yet)." : "Submission received."} {note}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {note}
        </p>
      ) : null}
    </form>
  );
}

function mapPresignError(json: Record<string, unknown>, status: number): string {
  const err = json.error as string | undefined;
  const msg = json.message as string | undefined;
  if (err === "too_many" || err === "no_files") return "Please choose at least one image and at most 10 per submission.";
  if (err === "bad_type") return msg || "Only JPEG, PNG, or WebP images are allowed.";
  if (err === "file_too_large") return (msg as string) || "One or more files are too large.";
  if (err === "total_too_large")
    return "The total size of this batch is too large. Try fewer photos or smaller files.";
  if (err === "not_configured") return "Direct uploads are not configured. Ask the site admin to set Supabase environment variables.";
  if (status === 413) return "Request too large. Try uploading fewer images at once.";
  if (msg) return msg;
  return "Could not start upload. Please try again.";
}
