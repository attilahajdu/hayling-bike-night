export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl shell-px py-12">
      <h1 className="font-display text-4xl font-bold uppercase text-ink">FAQ</h1>
      <div className="mt-8 space-y-6 text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="font-display text-2xl font-bold text-ink">How fast do uploads go live?</h2>
          <p className="mt-2">Usually within 24 hours after moderation.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink">Can I buy full-resolution photos here?</h2>
          <p className="mt-2">Official photographer albums link to each photographer&apos;s own shop.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink">What if my image should be removed?</h2>
          <p className="mt-2">Contact organisers through the published channels and include the gallery link.</p>
        </section>
      </div>
    </div>
  );
}
