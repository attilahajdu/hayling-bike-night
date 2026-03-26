import { auth } from "@/auth";
import { ModerationClient } from "@/components/ModerationClient";
import { getPendingCommunityEvents, getPendingOfficialAlbums, getPendingPhotos } from "@/lib/strapi";
import { isOwnerEmail } from "@/lib/owner";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OwnerModerationPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/auth/signin?callbackUrl=/owner/moderation");
  if (!isOwnerEmail(session.user.email)) {
    return <div className="mx-auto max-w-lg shell-px py-16 text-center"><h1 className="font-display font-bold text-3xl text-zinc-200">No access</h1><p className="mt-4 text-zinc-400">Your account isn&apos;t on the moderation list for this site.</p></div>;
  }

  const token = process.env.STRAPI_API_TOKEN;
  if (!token) {
    return <div className="mx-auto max-w-lg shell-px py-16 text-center"><h1 className="font-display font-bold text-3xl text-zinc-200">Configure API token</h1><p className="mt-4 text-zinc-400">Set STRAPI_API_TOKEN on the server to load the queue.</p></div>;
  }

  const [photoRes, albumRes, eventRes] = await Promise.all([
    getPendingPhotos(token),
    getPendingOfficialAlbums(token),
    getPendingCommunityEvents(),
  ]);

  return (
    <div className="mx-auto max-w-4xl shell-px py-8">
      <h1 className="font-display font-bold text-4xl uppercase text-zinc-200">Moderation queue</h1>
      <p className="mt-2 text-lg text-zinc-400">
        Wave through suggested rides and meets, community photos, and pro album links before they go live on the site.
      </p>
      <ModerationClient items={photoRes?.data ?? []} albums={albumRes?.data ?? []} events={eventRes?.data ?? []} />
    </div>
  );
}
