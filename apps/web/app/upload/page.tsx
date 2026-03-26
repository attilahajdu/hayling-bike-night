import Link from "next/link";
import { CommunityUploadForm } from "@/components/CommunityUploadForm";

export default function UploadPage() {
  return (
    <div className="shell py-12">
      <h1 className="section-title">Upload Your Shots</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <aside className="card p-5">
          <details className="group rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-950/50">
            <summary className="cursor-pointer list-none font-display text-sm font-bold uppercase tracking-wide text-accent outline-none marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                How does this work?
                <span className="text-zinc-400 transition group-open:rotate-180" aria-hidden>
                  ▼
                </span>
              </span>
            </summary>
            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <ol className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                <li><strong>1.</strong> Select one or multiple photos (up to 10).</li>
                <li><strong>2.</strong> Add optional name/handle and tags.</li>
                <li><strong>3.</strong> We review and publish within 24 hours.</li>
              </ol>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                This form is for community riders sharing phone shots. If you shoot the meet professionally and host a gallery elsewhere, use the weekly link flow instead.
              </p>
            </div>
          </details>
          <Link
            href="/submit-album"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-3 text-center font-display text-[0.8rem] font-bold uppercase tracking-wide text-ink no-underline shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 sm:text-[0.85rem]"
          >
            Photographer? Submit a link to your gallery
          </Link>
        </aside>

        <CommunityUploadForm />
      </div>
    </div>
  );
}
