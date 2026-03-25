"use client";

import { useState } from "react";

export function CommunityUploadForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [note, setNote] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setNote("");

    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      const res = await fetch("/api/community-upload", { method: "POST", body: data });

      if (!res.ok) throw new Error("Upload failed");
      const url = new URL(res.url);
      const ok = url.searchParams.get("ok");
      const savedCount = Number(url.searchParams.get("count") ?? "0");
      const queuedCount = Number(url.searchParams.get("queued") ?? "0");

      if (ok) {
        setStatus("ok");
        if (queuedCount > 0 && savedCount === 0) {
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
        if (err === "too-many") setNote("Please upload up to 20 images at a time.");
        else if (detail === "401" || detail === "403")
          setNote("Upload failed: the site could not authenticate with the photo server. Ask the admin to check API tokens.");
        else if (detail === "404")
          setNote(
            "Upload failed: the photo server is missing the upload route. Deploy the latest Strapi (CMS) from GitHub, then try again.",
          );
        else if (detail === "413") setNote("That file is too large (max 10 MB per image).");
        else setNote("Upload failed. Please check file type and try again.");
      }
    } catch {
      setStatus("error");
      setNote("Upload failed. Please try again.");
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
      <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">You can upload up to 20 images per submission.</p>

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
      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full disabled:opacity-60">{status === "submitting" ? "Submitting..." : "Submit For Review"}</button>

      {status === "ok" ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200">
          Submission received. {note}
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
