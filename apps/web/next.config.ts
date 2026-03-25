import type { NextConfig } from "next";

const strapiHost = process.env.STRAPI_URL
  ? new URL(process.env.STRAPI_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/news", destination: "/", permanent: false },
      { source: "/news/:path*", destination: "/", permanent: false },
      { source: "/petitions", destination: "/", permanent: false },
      { source: "/petitions/:path*", destination: "/", permanent: false },
    ];
  },
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
