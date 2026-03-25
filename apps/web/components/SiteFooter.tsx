import Link from "next/link";
import { getFacebookPageUrl } from "@/lib/social";

export function SiteFooter() {
  const facebookUrl = getFacebookPageUrl();
  return (
    <footer className="mt-16 bg-zinc-950 pt-12 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] text-zinc-300 dark:bg-black dark:text-zinc-400">
      <div className="shell">
        <div>
          <p className="font-display font-bold text-3xl uppercase tracking-[0.14em] text-zinc-300">Hayling Bike Night</p>
          <p className="mt-2 text-sm text-zinc-400">Every Thursday, 5pm-late · April-September · Hayling Island</p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-display font-bold text-xl uppercase text-zinc-300">Gallery</p>
            <div className="mt-2 space-y-1 text-sm">
              <Link href="/gallery" className="block text-zinc-300 no-underline hover:text-accent">This Week&apos;s Drop</Link>
              <Link href="/gallery" className="block text-zinc-300 no-underline hover:text-accent">Archive</Link>
              <Link href="/submit-album" className="block text-zinc-300 no-underline hover:text-accent">Submit Album</Link>
              <Link href="/upload" className="block text-zinc-300 no-underline hover:text-accent">Upload Photos</Link>
            </div>
          </div>
          <div>
            <p className="font-display font-bold text-xl uppercase text-zinc-300">Community</p>
            <div className="mt-2 space-y-1 text-sm">
              <Link href="/events" className="block text-zinc-300 no-underline hover:text-accent">Local events</Link>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-zinc-300 no-underline hover:text-accent"
              >
                Facebook
              </a>
              <Link href="/faq" className="block text-zinc-300 no-underline hover:text-accent">FAQ</Link>
            </div>
          </div>
          <div>
            <p className="font-display font-bold text-xl uppercase text-zinc-300">Legal & Info</p>
            <div className="mt-2 space-y-1 text-sm">
              <Link href="/about" className="block text-zinc-300 no-underline hover:text-accent">About</Link>
              <Link href="/legal" className="block text-zinc-300 no-underline hover:text-accent">Privacy / Legal</Link>
              <p className="mt-3 text-xs text-zinc-400">Photos may link to external photographer shops for full-resolution purchases.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-500 sm:flex-row">
          <p>© 2026 Hayling Bike Night</p>
          <p>Hayling Island · PO11</p>
        </div>
      </div>
    </footer>
  );
}
