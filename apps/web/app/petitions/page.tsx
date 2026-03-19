import Link from "next/link";
import { getPetitions } from "@/lib/strapi";

export const revalidate = 120;

export default async function PetitionsPage() {
  const res = await getPetitions();
  const list = res?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl uppercase text-white">Petitions</h1>
      <p className="mt-2 max-w-2xl text-zinc-400">Have your say on routes, safety, and access — signatures are stored securely.</p>
      <ul className="mt-8 space-y-4">
        {list.length === 0 ? (
          <li className="text-zinc-500">No active petitions.</li>
        ) : (
          list.map((p) => (
            <li key={p.id} className="rounded border border-zinc-800 bg-elevated p-4">
              <Link href={`/petitions/${p.attributes.slug}`} className="font-display text-2xl text-white no-underline hover:text-accent">
                {p.attributes.title}
              </Link>
              <p className="mt-2 text-sm text-zinc-400">
                {p.attributes.currentCount} / {p.attributes.goalCount} signatures
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
