import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[76svh] overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/hayling-bike-night-hero.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/45" />

      <div className="relative shell flex min-h-[76svh] flex-col justify-end pb-20 pt-24 sm:pb-24">
        <p className="max-w-max rounded-sm border border-white/25 bg-black/35 px-3 py-1.5 font-body text-xs font-medium uppercase tracking-[0.18em] text-zinc-300 backdrop-blur-sm sm:text-sm">
          Hayling Island · Every Thursday
        </p>
        <h1 className="mt-3 max-w-4xl font-display font-black text-6xl uppercase leading-[0.9] text-zinc-200 [text-shadow:0_2px_20px_rgba(0,0,0,0.65)] sm:text-8xl">
          Where The Bikes Come Out.
        </h1>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/gallery" className="btn-primary">This Week&apos;s Gallery</Link>
          <Link href="/upload" className="btn-secondary">Upload Your Shots</Link>
          <a href="#find-us" className="btn-secondary">Find Us</a>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 overflow-hidden bg-accent py-2 text-sm font-medium uppercase tracking-[0.16em] text-[rgb(var(--color-on-accent))]">
        <div className="marquee-track flex w-[200%] gap-10 whitespace-nowrap">
          <span>Every Thursday · April-September · 5pm Till Late · John&apos;s Cafe · PO11 0AS · Free To Attend · All Bikes Welcome →</span>
          <span>Every Thursday · April-September · 5pm Till Late · John&apos;s Cafe · PO11 0AS · Free To Attend · All Bikes Welcome →</span>
          <span>Every Thursday · April-September · 5pm Till Late · John&apos;s Cafe · PO11 0AS · Free To Attend · All Bikes Welcome →</span>
          <span>Every Thursday · April-September · 5pm Till Late · John&apos;s Cafe · PO11 0AS · Free To Attend · All Bikes Welcome →</span>
        </div>
      </div>
    </section>
  );
}
