"use client";

import { useState } from "react";

export function ProAlbumSubmitForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error" | "queued">("idle");
  const [note, setNote] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setNote("");

    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      const res = await fetch("/api/official-albums/submit", { method: "POST", body: data });
      if (!res.ok) throw new Error("Submit failed");

      const url = new URL(res.url);
      const ok = url.searchParams.get("ok");
      const queued = url.searchParams.get("queued");
      const code = url.searchParams.get("code");
      if (queued) {
        setStatus("queued");
        setNote(
          `Strapi did not save this album (HTTP ${code ?? "?"}). Usually the server API token is missing permission: Official album → create (use a Full access token, or add that scope). A copy was written to apps/web/.local-run/submission-queue/ with the error details — import it manually in Strapi admin if needed.`,
        );
        form.reset();
      } else if (ok) {
        setStatus("ok");
        setNote("Saved in Strapi as pending — approve it in Strapi (Official album) or on /owner/moderation.");
        form.reset();
      } else {
        setStatus("error");
        setNote("Submission failed. Please check required fields.");
      }
    } catch {
      setStatus("error");
      setNote("Submission failed. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" encType="multipart/form-data" className="card space-y-4 p-5">
      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Album title *
        <input
          name="title"
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Album URL *
        <input
          name="albumUrl"
          required
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Thumbnail upload *
        <input
          name="thumbnailFile"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="mt-1 block h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 pt-2 text-ink file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-[rgb(var(--color-on-accent))] dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Main website link
        <input
          name="shopUrl"
          placeholder="https://..."
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Optional one-sentence intro
        <input
          name="shortDescription"
          maxLength={140}
          placeholder="One short line about you"
          className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-700 dark:text-zinc-300">
          Your name *
          <input
            name="submittedByName"
            required
            className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm text-zinc-700 dark:text-zinc-300">
          Email *
          <input
            name="submittedByEmail"
            type="email"
            required
            className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
      </div>
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full disabled:opacity-60">{status === "submitting" ? "Submitting..." : "Submit Album"}</button>

      {status === "ok" ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200">
          {note}
        </p>
      ) : null}
      {status === "queued" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {note}
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
