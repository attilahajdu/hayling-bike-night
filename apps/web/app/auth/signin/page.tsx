import Link from "next/link";
import { auth, signIn } from "@/auth";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const hasFacebook = Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET);

  if (session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-zinc-300">Signed in as {session.user.email}</p>
        <Link href={sp.callbackUrl ?? "/"} className="mt-6 inline-block text-accent">
          Continue →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl uppercase text-white">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {hasGoogle || hasFacebook
          ? "Use a social account linked below."
          : "Add Google/Facebook OAuth keys (see README), or use dev login locally."}
      </p>
      <div className="mt-8 flex flex-col gap-4">
        {hasGoogle ? (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: sp.callbackUrl ?? "/" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded border border-zinc-600 bg-elevated py-3 font-display text-xl uppercase text-white hover:border-accent"
            >
              Continue with Google
            </button>
          </form>
        ) : null}
        {hasFacebook ? (
          <form
            action={async () => {
              "use server";
              await signIn("facebook", { redirectTo: sp.callbackUrl ?? "/" });
            }}
          >
            <button
              type="submit"
              className="w-full rounded border border-zinc-600 bg-elevated py-3 font-display text-xl uppercase text-white hover:border-accent"
            >
              Continue with Facebook
            </button>
          </form>
        ) : null}
        {process.env.NODE_ENV === "development" ? (
          <form
            action={async () => {
              "use server";
              await signIn("dev", { redirectTo: sp.callbackUrl ?? "/" });
            }}
          >
            <button type="submit" className="w-full rounded bg-zinc-700 py-3 text-sm text-white">
              Dev login (no OAuth)
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
