import type { NextConfig } from "next";
import { getStrapiOriginForRewrites } from "./lib/strapi-env";

function strapiHostnameForNextImage(): string | undefined {
  const origin = getStrapiOriginForRewrites();
  if (!origin) return undefined;
  try {
    return new URL(origin).hostname;
  } catch {
    return undefined;
  }
}

const strapiHost = strapiHostnameForNextImage();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/news", destination: "/", permanent: false },
      { source: "/news/:path*", destination: "/", permanent: false },
      { source: "/petitions", destination: "/", permanent: false },
      { source: "/petitions/:path*", destination: "/", permanent: false },
    ];
  },
  // Strapi upload proxy: use `app/strapi-uploads/[[...path]]/route.ts` (runtime fetch).
  // External `rewrites()` to Render are unreliable on Netlify for binary `/uploads/*`.
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "1337", pathname: "/uploads/**" },
      ...(strapiHost
        ? [{ protocol: "https" as const, hostname: strapiHost, pathname: "/uploads/**" }]
        : []),
    ],
  },
};

export default nextConfig;
