import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      strapiUserId?: number | null;
      role?: string;
    };
  }

  interface User {
    strapiUserId?: number | null;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    strapiUserId?: number | null;
    provider?: string;
    role?: string;
  }
}
