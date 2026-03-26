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
    "inline-flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:min-h-[52px] sm:flex-row sm:gap-2 sm:py-3.5";
  const btnIdle = "border-zinc-200 bg-white text-ink hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-accent/50";
  const btnActive = "border-accent bg-accent text-[rgb(var(--color-on-accent))] shadow-md shadow-accent/20";

  return (
    <section
      className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.07] to-transparent p-5 shadow-sm dark:border-accent/30 dark:from-accent/[0.12] sm:p-6"
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="font-display text-base font-bold uppercase tracking-wide text-accent">
        Going or interested?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Tap if you plan to ride or you&apos;re still deciding — it helps others see what&apos;s shaping up. Tell mates
        with share (Facebook or your phone&apos;s apps).
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row" role="group" aria-label="RSVP">
        <button
          type="button"
          disabled={busy !== null}
          aria-pressed={selected === "going"}
          onClick={() => onPick("going")}
          className={`${btnBase} ${selected === "going" ? btnActive : btnIdle} disabled:opacity-60`}
        >
          <span className="font-display text-xs font-bold uppercase tracking-wide sm:text-sm">I&apos;m going</span>
          <span
            className={`tabular-nums text-xs ${selected === "going" ? "text-[rgb(var(--color-on-accent))]/90" : "text-zinc-500 dark:text-zinc-400"}`}
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
          <span className="font-display text-xs font-bold uppercase tracking-wide sm:text-sm">I&apos;m interested</span>
          <span
            className={`tabular-nums text-xs ${selected === "interested" ? "text-[rgb(var(--color-on-accent))]/90" : "text-zinc-500 dark:text-zinc-400"}`}
          >
            {interested} {interested === 1 ? "person" : "people"}
          </span>
        </button>
      </div>

      <div className="relative mt-5" ref={shareWrapRef}>
        <button
          type="button"
          onClick={() => void handleSharePrimaryClick()}
          className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto"
        >
          <ShareIcon />
          Share this event
        </button>

        {shareOpen ? (
          <div
            className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-600 dark:bg-zinc-900 sm:left-auto sm:right-0 sm:min-w-[240px]"
            role="menu"
            aria-label="Share options"
          >
            <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">Share via</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void onCopyLink();
                }}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {copyDone ? "Link copied" : "Copy link"}
              </button>
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-accent no-underline hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
        <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      ) : null}
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
