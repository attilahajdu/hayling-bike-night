"use client";

import { useState } from "react";

export function SignPetitionForm({ petitionId, slug }: { petitionId: number; slug: string }) {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(formData: FormData) {
    setStatus("idle");
    const website = formData.get("website");
    if (website) return;
    const res = await fetch("/api/petitions/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petitionId,
        slug,
        name: formData.get("name"),
        email: formData.get("email"),
        postcode: formData.get("postcode"),
        consent: formData.get("consent") === "on",
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setStatus("err");
      setMsg(j.error ?? "Could not sign right now.");
      return;
    }
    setStatus("ok");
    setMsg("Thank you — your signature was recorded.");
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit(new FormData(e.currentTarget));
      }}
      className="card mt-10 space-y-4 p-6"
    >
      <h2 className="font-display text-2xl font-bold uppercase text-ink">Sign this petition</h2>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div>
        <label htmlFor="name" className="block text-xs uppercase text-zinc-500 dark:text-zinc-400">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-xs uppercase text-zinc-500 dark:text-zinc-400">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label htmlFor="postcode" className="block text-xs uppercase text-zinc-500 dark:text-zinc-400">
          Postcode (optional)
        </label>
        <input
          id="postcode"
          name="postcode"
          className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-ink dark:border-zinc-600 dark:bg-zinc-950"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" name="consent" required className="mt-1" />
        I consent to my name being counted toward this petition.
      </label>
      <button
        type="submit"
        className="rounded-md bg-accent px-4 py-2 font-display text-lg font-bold uppercase tracking-wide text-[rgb(var(--color-on-accent))] shadow-none ring-1 ring-white/10 transition hover:bg-accentHover dark:font-semibold dark:ring-white/10"
      >
        Sign
      </button>
      {status !== "idle" ? (
        <p className={status === "ok" ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{msg}</p>
      ) : null}
    </form>
  );
}
