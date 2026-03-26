"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const STORAGE_PREFIX = "hayling:event-rsvp:";

type Choice = "going" | "interested";

function readStoredChoice(eventId: number): Choice | null {
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + eventId);
    if (v === "going" || v === "interested") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredChoice(eventId: number, choice: Choice | null) {
  try {
    const key = STORAGE_PREFIX + eventId;
    if (choice == null) localStorage.removeItem(key);
    else localStorage.setItem(key, choice);
  } catch {
    /* ignore */
  }
}

export function EventEngagement({
  eventId,
  slug,
  title,
  dateLine,
  initialGoing,
  initialInterested,
}: {
  eventId: number;
  slug: string;
  title: string;
  /** Short line for share text, e.g. "Thu 3 Apr, 17:00" */
  dateLine: string;
  initialGoing: number;
  initialInterested: number;
}) {
  const router = useRouter();
  const headingId = useId();
  const shareWrapRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("");
  const [going, setGoing] = useState(initialGoing);
  const [interested, setInterested] = useState(initialInterested);
  const [selected, setSelected] = useState<Choice | null>(null);
  const [busy, setBusy] = useState<Choice | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    setSelected(readStoredChoice(eventId));
  }, [eventId]);

  useEffect(() => {
    setGoing(initialGoing);
    setInterested(initialInterested);
  }, [initialGoing, initialInterested]);

  // Always sync totals from API on load — avoids stale cached HTML showing 0 after refresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/events/rsvp?eventId=${eventId}`, { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          goingCount?: number;
          interestedCount?: number;
        } | null;
        if (cancelled || !data?.ok) return;
        setGoing(data.goingCount ?? 0);
        setInterested(data.interestedCount ?? 0);
      } catch {
        /* keep SSR props */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!shareOpen) return;
    function onDocClick(e: MouseEvent) {
      if (shareWrapRef.current && !shareWrapRef.current.contains(e.target as Node)) setShareOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [shareOpen]);

  const eventUrl = origin ? `${origin}/events/${slug}` : "";
  const shareText = `${title} — ${dateLine}. Hayling Bike Night local events.`;
  const facebookShareUrl = eventUrl
    ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`
    : "#";

  const postRsvp = useCallback(
    async (choice: Choice, previousChoice: Choice | null) => {
      setErr(null);
      setBusy(choice);
      try {
        const res = await fetch("/api/events/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            choice,
            previousChoice,
            website: "",
          }),
        });
        const data = (await res.json().catch(() => null)) as {
          ok?: boolean;
          goingCount?: number;
          interestedCount?: number;
          error?: string;
        } | null;
        if (!res.ok || !data?.ok) {
          setErr(data?.error ?? "Something went wrong. Try again.");
          return;
        }
        setGoing(data.goingCount ?? 0);
        setInterested(data.interestedCount ?? 0);
        setSelected(choice);
        writeStoredChoice(eventId, choice);
        router.refresh();
      } catch {
        setErr("Could not reach the server. Try again.");
      } finally {
        setBusy(null);
      }
    },
    [eventId, router],
  );

  function onPick(choice: Choice) {
    if (busy) return;
    if (selected === choice) return;
    void postRsvp(choice, selected);
  }

  async function handleSharePrimaryClick() {
    setErr(null);
    if (!eventUrl) return;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        const payload = { title, text: shareText, url: eventUrl };
        const can =
          typeof navigator.canShare !== "function" ? true : navigator.canShare(payload);
        if (can) {
          await navigator.share(payload);
          return;
        }
        await navigator.share({ url: eventUrl });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    setShareOpen((o) => !o);
  }

  async function onCopyLink() {
    if (!eventUrl) return;
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setErr("Could not copy — try sharing via Facebook below.");
    }
  }

  const btnBase =
    "group inline-flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl border px-5 py-4 text-center shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:min-h-[56px] sm:flex-row sm:gap-3 sm:py-4";
  const btnIdle =
    "border-zinc-200/90 bg-white/90 text-ink backdrop-blur-sm hover:-translate-y-0.5 hover:border-accent/30 hover:bg-white hover:shadow-md dark:border-zinc-600/80 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:border-accent/40 dark:hover:bg-zinc-800";
  const btnActive =
    "border-transparent bg-accent text-[rgb(var(--color-on-accent))] shadow-lg shadow-accent/25 ring-2 ring-accent/20 ring-offset-2 ring-offset-[rgb(var(--color-card))] dark:ring-offset-zinc-900";

  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/90 to-accent/[0.06] p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.12)] dark:border-zinc-600/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-accent/[0.08] sm:rounded-[2rem] sm:p-8"
      aria-labelledby={headingId}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl dark:bg-accent/15"
        aria-hidden
      />
      <div className="relative">
        <h2
          id={headingId}
          className="font-display text-lg font-bold tracking-tight text-ink dark:text-zinc-100 sm:text-xl"
        >
          Who&apos;s coming?
        </h2>
        <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-zinc-600 dark:text-zinc-400">
          Tap if you&apos;re planning to ride or still weighing it up — everyone sees the same totals. Share the event
          with mates when you&apos;re ready.
        </p>
        <p className="mt-2 text-xs leading-snug text-zinc-500 dark:text-zinc-500">
          Your choice is remembered on <strong className="font-medium text-zinc-600 dark:text-zinc-400">this device</strong>{" "}
          only (so another browser can add its own tap — that&apos;s normal).
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:gap-4" role="group" aria-label="RSVP">
          <button
            type="button"
            disabled={busy !== null}
            aria-pressed={selected === "going"}
            onClick={() => onPick("going")}
            className={`${btnBase} ${selected === "going" ? btnActive : btnIdle} disabled:opacity-60`}
          >
            <span className="font-display text-sm font-bold tracking-wide">I&apos;m going</span>
            <span
              className={`tabular-nums text-sm ${selected === "going" ? "text-[rgb(var(--color-on-accent))]/90" : "text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300"}`}
            >
              {going} {going === 1 ? "person" : "people"}
            </span>
          </button>
          <button
            type="button"
            disabled={busy !== null}
            aria-pressed={selected === "interested"}
            onClick={() => onPick("interested")}
            className={`${btnBase} ${selected === "interested" ? btnActive : btnIdle} disabled:opacity-60`}
          >
            <span className="font-display text-sm font-bold tracking-wide">I&apos;m interested</span>
            <span
              className={`tabular-nums text-sm ${selected === "interested" ? "text-[rgb(var(--color-on-accent))]/90" : "text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300"}`}
            >
              {interested} {interested === 1 ? "person" : "people"}
            </span>
          </button>
        </div>

        <div className="relative mt-6" ref={shareWrapRef}>
          <button
            type="button"
            onClick={() => void handleSharePrimaryClick()}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200/90 bg-white/90 px-5 py-3.5 text-[0.9375rem] font-semibold text-ink shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:border-zinc-500 sm:w-auto"
          >
            <ShareIcon />
            Share this event
          </button>

          {shareOpen ? (
            <div
              className="absolute left-0 right-0 top-full z-10 mt-3 rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-xl dark:border-zinc-600 dark:bg-zinc-900 sm:left-auto sm:right-0 sm:min-w-[260px]"
              role="menu"
              aria-label="Share options"
            >
              <p className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Share via</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    void onCopyLink();
                  }}
                  className="rounded-xl border border-zinc-200/80 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {copyDone ? "Link copied" : "Copy link"}
                </button>
                <a
                  href={facebookShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  className="rounded-xl border border-zinc-200/80 px-4 py-2.5 text-sm font-medium text-accent no-underline transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  onClick={(e) => {
                    if (!eventUrl) e.preventDefault();
                    setShareOpen(false);
                  }}
                >
                  Facebook
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {err ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {err}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
