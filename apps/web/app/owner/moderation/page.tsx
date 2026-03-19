import { auth } from "@/auth";
import { ModerationClient } from "@/components/ModerationClient";
import { getPendingPhotos } from "@/lib/strapi";
import { isOwnerEmail } from "@/lib/owner";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OwnerModerationPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/auth/signin?callbackUrl=/owner/moderation");
  }
  if (!isOwnerEmail(session.user.email)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-white">No access</h1>
        <p className="mt-4 text-zinc-400">Your account is not listed as an organiser.</p>
      </div>
    );
  }

  const token = process.env.STRAPI_API_TOKEN;
  if (!token) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl text-white">Configure API token</h1>
        <p className="mt-4 text-zinc-400">Set STRAPI_API_TOKEN on the server to load the queue.</p>
      </div>
    );
  }

  const res = await getPendingPhotos(token);
  const items = res?.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-4xl uppercase text-white">Photo queue</h1>
      <p className="mt-2 text-lg text-zinc-400">Large buttons — tap approve or reject.</p>
      <ModerationClient items={items} />
    </div>
  );
}
