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
      const res = await fetch("/api/events/submit", { method: "POST", body: data, redirect: "manual" });
      const loc = res.headers.get("Location") ?? "";
      const locUrl = loc.startsWith("http") ? new URL(loc) : new URL(loc, window.location.origin);
      if (res.status === 303 || res.status === 302 || res.status === 307) {
        if (locUrl.searchParams.get("submitted") === "1") {
          setStatus("ok");
          setNote("Thanks — an organiser will review your event before it appears on the site.");
          form.reset();
          return;
        }
        if (locUrl.searchParams.get("error")) {
          setStatus("error");
          const err = locUrl.searchParams.get("error");
          if (err === "missing") setNote("Please fill in every field and accept the policy.");
          else if (err === "date") setNote("Check the date and time.");
          else if (err === "network") setNote("Could not reach the server. Try again shortly.");
          else if (err === "strapi") setNote("Could not save your event. Please try again or contact the team.");
          else setNote("Something went wrong.");
          return;
        }
      }
      if (!res.ok && res.status !== 303) throw new Error("Submit failed");
    } catch {
      setStatus("error");
      setNote("Submit failed. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6 sm:p-8">
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Submit a community event</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
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
