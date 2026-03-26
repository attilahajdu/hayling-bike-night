"use client";

import { useState } from "react";

const SUCCESS_NOTE =
  "Nice one — we've got it. You're still the host; the Hayling Bike Night crew just gives it a quick once-over so the calendar stays tidy (no spam, no duplicates). It'll show for everyone once they've waved it through — usually within a day or two.";

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
        if (err === "missing")
          setNote("Fill in the fields marked * and tick the box — we need the lot before we can pass it on.");
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
          Got a ride or meet brewing?
        </h2>
        <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Coffee meet, loop out, fundraiser, pub stop — if it&apos;s bikes and it&apos;s on Hayling or nearby, chuck it in.
          You&apos;re the one putting it on; we&apos;re just the website. The team here only checks new entries so the
          calendar doesn&apos;t turn into a mess.
        </p>

        <details className="group mt-4 rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-950/50">
          <summary className="cursor-pointer list-none font-display text-sm font-bold uppercase tracking-wide text-accent outline-none marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              How does this work?
              <span className="text-zinc-400 transition group-open:rotate-180" aria-hidden>
                ▼
              </span>
            </span>
          </summary>
          <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3 text-sm leading-relaxed text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            <p>
              Your ride or meet <strong className="text-ink dark:text-zinc-200">won&apos;t</strong> appear on the public
              calendar the second you hit send. Someone from the <strong className="text-ink dark:text-zinc-200">Hayling Bike Night</strong>{" "}
              side gives it a quick look (spam filter, sensible dates, that sort of thing). Then it goes live next to the
              official Thursday meets.
            </p>
            <p>
              We need a title, when and where, plus a bit of detail so riders know what they&apos;re joining. Your email
              is only for a rare &quot;can you clarify…?&quot; — not marketing nonsense.
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
        <span>
          I&apos;ve been straight with the details, and I&apos;m fine with the Hayling Bike Night lot emailing me if they
          need to double-check something before it goes on the site.
        </span>
      </label>
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <button type="submit" disabled={status === "submitting"} className="btn-primary w-full sm:w-auto disabled:opacity-60">
        {status === "submitting" ? "Sending…" : "Send it in"}
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
