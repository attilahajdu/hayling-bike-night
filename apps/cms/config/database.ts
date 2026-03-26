import path from "path";

export default ({ env }: { env: any }) => {
  const client = env("DATABASE_CLIENT", "postgres");

  if (client === "sqlite") {
    return {
      connection: {
        client: "sqlite",
        connection: { filename: path.join(__dirname, "..", env("DATABASE_FILENAME", ".tmp/data.db")) },
        useNullAsDefault: true,
      },
    };
  }

  return {
    connection: {
      client: "postgres",
      connection: {
        connectionString: env("DATABASE_URL"),
        ssl: env.bool("DATABASE_SSL", false)
          ? { rejectUnauthorized: env.bool("DATABASE_SSL_REJECT_UNAUTHORIZED", true) }
          : false,
      },
      // Keep small: Supabase free/small tiers hit "Max client connections reached" quickly
      // (Strapi default 10 + deploy retries + other apps sharing the same DB).
      pool: {
        min: env.int("DATABASE_POOL_MIN", 0),
        max: env.int("DATABASE_POOL_MAX", 3),
        acquireTimeoutMillis: env.int("DATABASE_POOL_ACQUIRE_TIMEOUT_MS", 60000),
      },
    },
  };
};
