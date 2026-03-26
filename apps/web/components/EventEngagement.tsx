"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const STORAGE_V2 = "hayling:event-rsvp-v2:";
const STORAGE_LEGACY = "hayling:event-rsvp:";

type LocalState = { going: boolean; interested: boolean };

function readLocalState(eventId: number): LocalState {
  try {
    const v2 = localStorage.getItem(STORAGE_V2 + eventId);
    if (v2) {
      const p = JSON.parse(v2) as unknown;
      if (p && typeof p === "object") {
        const o = p as Record<string, unknown>;
        return {
          going: o.going === true,
          interested: o.interested === true,
        };
      }
    }
    const leg = localStorage.getItem(STORAGE_LEGACY + eventId);
    if (leg === "going") return { going: true, interested: false };
    if (leg === "interested") return { going: false, interested: true };
  } catch {
    /* ignore */
  }
  return { going: false, interested: false };
}

function writeLocalState(eventId: number, s: LocalState) {
  try {
    localStorage.setItem(STORAGE_V2 + eventId, JSON.stringify(s));
    localStorage.removeItem(STORAGE_LEGACY + eventId);
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
  dateLine: string;
  initialGoing: number;
  initialInterested: number;
}) {
  const router = useRouter();
  const sectionId = useId();
  const shareWrapRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("");
  const [going, setGoing] = useState(initialGoing);
  const [interested, setInterested] = useState(initialInterested);
  const [goingOn, setGoingOn] = useState(false);
  const [interestedOn, setInterestedOn] = useState(false);
  const [busy, setBusy] = useState<"going" | "interested" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    const s = readLocalState(eventId);
    setGoingOn(s.going);
    setInterestedOn(s.interested);
  }, [eventId]);

  useEffect(() => {
    setGoing(initialGoing);
    setInterested(initialInterested);
  }, [initialGoing, initialInterested]);

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
        /* keep SSR */
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
  const shareText = `${title} — ${dateLine}. Hayling Bike Night rides and meetups.`;
  const facebookShareUrl = eventUrl
    ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`
    : "#";

  const applyDelta = useCallback(
    async (field: "going" | "interested", delta: 1 | -1) => {
      setErr(null);
      setBusy(field);
      try {
        const res = await fetch("/api/events/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            field,
            delta,
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
          return false;
        }
        setGoing(data.goingCount ?? 0);
        setInterested(data.interestedCount ?? 0);
        router.refresh();
        return true;
      } catch {
        setErr("Could not reach the server. Try again.");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [eventId, router],
  );

  async function toggleInterested() {
    if (busy) return;
    const next = !interestedOn;
    const delta: 1 | -1 = next ? 1 : -1;
    const ok = await applyDelta("interested", delta);
    if (ok) {
      setInterestedOn(next);
      writeLocalState(eventId, { going: goingOn, interested: next });
    }
  }

  async function toggleGoing() {
    if (busy) return;
    const next = !goingOn;
    const delta: 1 | -1 = next ? 1 : -1;
    const ok = await applyDelta("going", delta);
    if (ok) {
      setGoingOn(next);
      writeLocalState(eventId, { going: next, interested: interestedOn });
    }
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
      setErr("Could not copy — try Facebook below.");
    }
  }

  const rowBtn = (active: boolean, disabled: boolean) =>
    `w-full rounded-full px-5 py-3.5 text-[0.9375rem] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${
      active
        ? "bg-ink text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
        : "border border-zinc-300/90 bg-transparent text-ink hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50"
    }`;

  return (
    <section
      id={sectionId}
      className="w-full border-t border-zinc-200/80 pt-10 dark:border-zinc-700/80"
      aria-labelledby={`${sectionId}-label`}
    >
      <div className="flex flex-col gap-1">
        <h2 id={`${sectionId}-label`} className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Who&apos;s coming
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Counts are for everyone. You can mark both &quot;interested&quot; and &quot;going&quot; — we only remember your taps on{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">this device</span>.
        </p>
      </div>

      <div className="mt-6 flex w-full flex-col gap-6">
        {/* Interested first (left when row; top when stacked) */}
        <div className="w-full space-y-2">
          <p className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{interested}</span>{" "}
            {interested === 1 ? "person is" : "people are"} interested
          </p>
          <button
            type="button"
            disabled={busy !== null}
            aria-pressed={interestedOn}
            onClick={() => void toggleInterested()}
            className={rowBtn(interestedOn, busy !== null)}
          >
            {interestedOn ? "Interested — tap to undo" : "I’m interested"}
          </button>
        </div>

        <div className="w-full space-y-2">
          <p className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{going}</span>{" "}
            {going === 1 ? "person is" : "people are"} going
          </p>
          <button
            type="button"
            disabled={busy !== null}
            aria-pressed={goingOn}
            onClick={() => void toggleGoing()}
            className={rowBtn(goingOn, busy !== null)}
          >
            {goingOn ? "Going — tap to undo" : "I’m going"}
          </button>
        </div>
      </div>

      <div className="relative mt-8 w-full" ref={shareWrapRef}>
        <button
          type="button"
          onClick={() => void handleSharePrimaryClick()}
          className="w-full rounded-full border border-zinc-300/90 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
        >
          Share event
        </button>

        {shareOpen ? (
          <div
            className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
            role="menu"
            aria-label="Share options"
          >
            <div className="flex flex-col gap-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => void onCopyLink()}
                className="rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {copyDone ? "Copied" : "Copy link"}
              </button>
              <a
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className="rounded-xl px-3 py-2 text-sm text-accent no-underline hover:bg-zinc-50 dark:hover:bg-zinc-800"
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
    </section>
  );
}
