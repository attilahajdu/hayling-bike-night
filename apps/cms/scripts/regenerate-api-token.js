"use strict";

/**
 * Regenerates the Strapi API token using the same API_TOKEN_SALT as Render,
 * then writes the plaintext token into apps/web/.env.local.
 *
 * Run from repo root: npm run regenerate-api-token --workspace cms
 * Or: cd apps/cms && node scripts/regenerate-api-token.js
 */
const fs = require("fs");
const path = require("path");
const Strapi = require("@strapi/strapi");

async function main() {
  const appDir = path.join(__dirname, "..");
  const appContext = await Strapi.compile({ appDir });
  const app = await Strapi(appContext).load();

  const row = await app.query("admin::api-token").findOne({
    where: { name: "hayling-bike-night-web" },
  });
  if (!row) {
    throw new Error('No API token named "hayling-bike-night-web". Create one in Strapi admin first.');
  }

  const apiTokenService = app.admin.services["api-token"];
  const result = await apiTokenService.regenerate(row.id);

  const envPath = path.join(appDir, "..", "web", ".env.local");
  let env = fs.readFileSync(envPath, "utf8");
  env = env.replace(/^STRAPI_API_TOKEN=.*$/m, `STRAPI_API_TOKEN=${result.accessKey}`);
  fs.writeFileSync(envPath, env, "utf8");

  console.log("Updated apps/web/.env.local with new STRAPI_API_TOKEN (matches Render salt).");
  console.log("You must paste the same value into Netlify → Environment variables → STRAPI_API_TOKEN → Redeploy.");

  await app.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
