import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "@/components/MarkdownBody";
import { SignPetitionForm } from "@/components/SignPetitionForm";
import { getPetitionBySlug } from "@/lib/strapi";

export const revalidate = 60;

export default async function PetitionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = await getPetitionBySlug(slug);
  if (!row) notFound();
  const p = row.attributes;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/petitions" className="text-sm text-zinc-500 no-underline hover:text-accent dark:text-zinc-400">
        ← Petitions
      </Link>
      <h1 className="mt-4 font-display text-4xl font-bold uppercase text-ink">{p.title}</h1>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        {p.currentCount} / {p.goalCount} signatures
      </p>
      <div className="mt-8">
        <MarkdownBody source={p.description} />
      </div>
      <SignPetitionForm petitionId={row.id} slug={slug} />
    </div>
  );
}
