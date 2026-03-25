"use client";

import { useState } from "react";

export function CommunityEventSubmitForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [note, setNote] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setNote("");
    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      // Use redirect-follow for the main case, but also read Location when available.
      const res = await fetch("/api/events/submit", { method: "POST", body: data, redirect: "manual" });

      const loc = res.headers.get("Location") ?? "";
      const locUrl = loc
        ? (() => {
            try {
              return loc.startsWith("http") ? new URL(loc) : new URL(loc, window.location.origin);
            } catch {
              return null;
            }
          })()
        : null;

      // When `redirect: "manual"` is used, browsers may not return a useful `res.url` for the redirected target.
      // So we primarily rely on `Location`, and only fall back to `res.url` if Location is missing.
      const fallbackUrl = (() => {
        try {
          return res.url ? new URL(res.url) : null;
        } catch {
          return null;
        }
      })();

      const effectiveUrl = locUrl ?? fallbackUrl;
      const submitted = effectiveUrl?.searchParams.get("submitted");
      const err = effectiveUrl?.searchParams.get("error");

      if (submitted === "1") {
        setStatus("ok");
        setNote("Thanks — an organiser will review your event before it appears on the site.");
        form.reset();
        return;
      }

      if (err) {
        setStatus("error");
        if (err === "missing") setNote("Please fill in every field and accept the policy.");
        else if (err === "date") setNote("Check the date and time.");
        else if (err === "network") setNote("Could not reach the server. Try again shortly.");
        else if (err === "strapi") setNote("Could not save your event. Please try again or contact the team.");
        else setNote("Something went wrong.");
        return;
      }

      // Unhappy path: e.g. 500 JSON when STRAPI_API_TOKEN is missing/misconfigured.
      if (!res.ok) {
        let bodyText = "";
        try {
          bodyText = await res.text();
        } catch {
          /* ignore */
        }

        let serverMsg = bodyText;
        try {
          const j = JSON.parse(bodyText);
          serverMsg = j?.error ?? j?.message ?? bodyText;
        } catch {
          /* not JSON */
        }

        console.error("[events/submit] failed", res.status, serverMsg);

        if (res.status === 500 && String(serverMsg).toLowerCase().includes("misconfigured")) {
          setStatus("error");
          setNote(
            "Server misconfigured: STRAPI_API_TOKEN is missing on Netlify. Add `STRAPI_API_TOKEN` under Site settings → Environment variables, then redeploy.",
          );
          return;
        }

        setStatus("error");
        setNote("Submit failed. Please try again.");
        return;
      }

      // Redirect received but we couldn't read redirect params (Location missing).
      // This is usually still a successful submit on this codepath, so don't show a misleading "failed".
      if ([302, 303, 307].includes(res.status)) {
        setStatus("ok");
        setNote("Submitted. If you don't see it yet, refresh the page (moderation may take a moment).");
        return;
      }

      // If we get here, the request likely succeeded but we couldn't parse the redirect params.
      // This should be rare; we surface something actionable instead of a generic "failed".
      console.warn("[events/submit] redirect params not detected", { resStatus: res.status, location: loc, resUrl: res.url });
      setStatus("ok");
      setNote("Submitted. If you don’t see it, refresh the page (moderation may take a moment).");
    } catch {
      setStatus("error");
      setNote("Submit failed. Please try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-3xl border border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 p-6 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.2)] sm:p-10 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950/90"
    >
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
          Submit a ride or meet
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Rides, meets, fundraisers — anything bike-related on Hayling or nearby. We&apos;ll review it before it goes
          live.
        </p>
      </div>

      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Event title *
        <input
          name="title"
          required
          maxLength={180}
          className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
          placeholder="e.g. Charity ride — Southsea loop"
        />
      </label>

      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        When *
        <input
          name="eventStart"
          type="datetime-local"
          required
          className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </label>

      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Location / meet point *
        <input
          name="location"
          required
          maxLength={240}
          className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
          placeholder="e.g. Shell roundabout, then ride out"
        />
      </label>

      <label className="block text-sm text-zinc-700 dark:text-zinc-300">
        Details *
        <textarea
          name="details"
          required
          rows={4}
          maxLength={8000}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-ink dark:border-zinc-600 dark:bg-zinc-950"
          placeholder="What’s happening, pace, who it’s for, any cost…"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-700 dark:text-zinc-300">
          Your name *
          <input
            name="submitterName"
            required
            maxLength={120}
            className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm text-zinc-700 dark:text-zinc-300">
          Email *
          <input
            name="submitterEmail"
            type="email"
            required
            maxLength={180}
            className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-ink dark:border-zinc-600 dark:bg-zinc-950"
          />
        </label>
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>I confirm this is accurate and I&apos;m happy for organisers to contact me about this listing.</span>
      </label>
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full sm:w-auto disabled:opacity-60">
        {status === "submitting" ? "Sending…" : "Submit for review"}
      </button>

      {status === "ok" ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200">
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
