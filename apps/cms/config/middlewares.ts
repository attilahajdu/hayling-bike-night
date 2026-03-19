export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  {
    name: "strapi::cors",
    config: {
      enabled: true,
      /* Only allow configured origins in production to reduce cross-site abuse. */
      origin: (
        process.env.CORS_ORIGIN ??
        (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000")
      )
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      headers: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    },
  },
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
