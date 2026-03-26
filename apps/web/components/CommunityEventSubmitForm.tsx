"use client";

import { useState } from "react";

const SUCCESS_NOTE =
  "Thanks — we received your listing. It will not appear on the calendar until an organiser approves it (usually within a day or two).";

function isRedirectStatus(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

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
      const locUrl = loc
        ? (() => {
            try {
              return loc.startsWith("http") ? new URL(loc) : new URL(loc, window.location.origin);
            } catch {
              return null;
            }
          })()
        : null;

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
        setNote(SUCCESS_NOTE);
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

      // Successful POSTs use redirects; `fetch` reports 302/303/etc. as `!res.ok`, so handle redirects
      // before the generic `!res.ok` branch (otherwise users always see "Submit failed" on Netlify).
      if (isRedirectStatus(res.status)) {
        setStatus("ok");
        setNote(SUCCESS_NOTE);
        form.reset();
        return;
      }

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

      console.warn("[events/submit] unexpected success shape", { resStatus: res.status, location: loc, resUrl: res.url });
      setStatus("ok");
      setNote(SUCCESS_NOTE);
      form.reset();
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
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Tell riders about a ride, meet-up, fundraiser, or anything bike-related on Hayling or nearby. It stays private
          until an organiser checks it.
        </p>

        <details className="group mt-4 rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-950/50">
          <summary className="cursor-pointer list-none font-display text-sm font-bold uppercase tracking-wide text-accent outline-none marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              Find out more
              <span className="text-zinc-400 transition group-open:rotate-180" aria-hidden>
                ▼
              </span>
            </span>
          </summary>
          <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3 text-sm leading-relaxed text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            <p>
              Your listing is sent to the moderation queue — it does <strong className="text-ink dark:text-zinc-200">not</strong>{" "}
              show on the public calendar straight away. After approval, it appears with the other local events.
            </p>
            <p>
              You&apos;ll need a title, date and time, location, and a short description. We only use your email if we
              need to clarify something about your listing.
            </p>
          </div>
        </details>
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
