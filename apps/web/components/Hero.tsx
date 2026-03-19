export function Hero() {
  return (
    <section className="relative isolate overflow-hidden border-b border-zinc-800 bg-gradient-to-br from-zinc-900 via-surface to-black">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(-45deg,transparent,transparent_6px,rgba(255,255,255,0.03)_6px,rgba(255,255,255,0.03)_7px)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <p className="font-display text-5xl uppercase leading-none text-white sm:text-7xl">Hayling Bike Night</p>
        <p className="mt-4 max-w-2xl text-lg text-zinc-300">
          Fully marshalled motorcycle meet — every <span className="text-accent">Thursday</span>, 5pm–late, April through
          September. John&apos;s Café, Hayling Island <span className="text-zinc-400">(PO11 0AS)</span>.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="/api/calendar.ics"
            className="inline-flex items-center justify-center rounded border border-accent bg-accent px-5 py-3 font-display text-xl uppercase tracking-wide text-black no-underline hover:bg-orange-500"
          >
            Add to calendar
          </a>
          <a
            href="/gallery"
            className="inline-flex items-center justify-center rounded border border-zinc-600 bg-elevated px-5 py-3 font-display text-xl uppercase tracking-wide text-white no-underline hover:border-accent"
          >
            Find photos
          </a>
        </div>
        <p className="mt-6 text-xs text-zinc-500">
          Tip: use the gallery search with your plate, bike colour, or jacket — we tag shots so riders can spot themselves.
        </p>
      </div>
    </section>
  );
}
