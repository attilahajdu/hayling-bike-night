import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";

const strapiUrl = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";

async function lookupStrapiUserId(email: string): Promise<number | null> {
  const token = process.env.STRAPI_API_TOKEN;
  if (!token) return null;
  const res = await fetch(`${strapiUrl}/api/users?filters[email][$eq]=${encodeURIComponent(email)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ id: number }> };
  const id = json.data?.[0]?.id;
  return typeof id === "number" ? id : null;
}

function buildProviders(): Provider[] {
  const list: Provider[] = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    list.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
      }),
    );
  }

  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
    list.push(
      Facebook({
        clientId: process.env.AUTH_FACEBOOK_ID,
        clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      }),
    );
  }

  if (process.env.NODE_ENV === "development") {
    list.push(
      Credentials({
        id: "dev",
        name: "Local dev",
        credentials: {},
        authorize: async () => ({
          id: "dev-user",
          name: "Local rider",
          email: "dev@hayling-bike-night.local",
        }),
      }),
    );
  }

  if (list.length === 0) {
    list.push(
      Credentials({
        id: "setup-required",
        name: "Configure OAuth",
        credentials: {},
        authorize: async () => null,
      }),
    );
  }

  return list;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: buildProviders(),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, profile, account, user }) {
      if (account?.provider === "credentials" && user?.email) {
        token.strapiUserId = await lookupStrapiUserId(user.email);
        token.role = "registered";
        return token;
      }
      if (account?.provider && profile && "email" in profile && profile.email) {
        token.strapiUserId = await lookupStrapiUserId(profile.email as string);
        token.provider = account.provider;
        token.role = "registered";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.strapiUserId = token.strapiUserId as number | null | undefined;
        session.user.role = (token.role as string) ?? "registered";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
