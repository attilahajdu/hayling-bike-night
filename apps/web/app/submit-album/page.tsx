import { ProAlbumSubmitForm } from "@/components/ProAlbumSubmitForm";

export default function SubmitAlbumPage() {
  return (
    <div className="shell py-12">
      <h1 className="section-title">Submit An Official Album</h1>
      <p className="mt-3 max-w-3xl text-zinc-700 dark:text-zinc-300">
        For professional photographers: share your gallery URL, upload one thumbnail, and link your main website.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <aside className="card p-5 text-sm text-zinc-700 dark:text-zinc-300">
          <p className="font-display font-bold text-3xl uppercase text-ink">Weekly pro flow</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>One gallery URL per weekly drop.</li>
            <li>One thumbnail upload for listing.</li>
            <li>Optional one-sentence intro and website link.</li>
          </ul>
        </aside>

        <ProAlbumSubmitForm />
      </div>
    </div>
  );
}
