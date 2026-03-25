import Link from "next/link";
import { auth, signIn } from "@/auth";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const hasFacebook = Boolean(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET);

  if (session?.user) {
    return (
      <div className="mx-auto max-w-md shell-px py-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Signed in as {session.user.email}</p>
        <Link href={sp.callbackUrl ?? "/"} className="mt-6 inline-block text-accent">
          Continue →
        </Link>
      </div>
    );
  }

  const oauthBtn =
    "w-full rounded-md border border-zinc-400 bg-elevated py-3 font-display text-xl font-bold uppercase text-ink transition hover:border-accent dark:border-zinc-600 dark:text-zinc-100";

  return (
    <div className="mx-auto max-w-md shell-px py-16">
      <h1 className="font-display text-4xl font-bold uppercase text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
            <button type="submit" className={oauthBtn}>
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
            <button type="submit" className={oauthBtn}>
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
            <button type="submit" className="w-full rounded-md bg-zinc-700 py-3 text-sm text-zinc-100 dark:bg-zinc-600">
              Dev login (no OAuth)
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
