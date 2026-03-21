/**
 * Strapi TS build emits JS to dist/ but does not copy schema.json files.
 * Without them, content types are not registered and createCoreRouter fails at runtime.
 */
const fs = require("fs");
const path = require("path");

const apiRoot = path.join(__dirname, "..", "src", "api");
const distApiRoot = path.join(__dirname, "..", "dist", "src", "api");

function copyJsonTree(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, ent.name);
    const d = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      copyJsonTree(s, d);
    } else if (ent.name.endsWith(".json")) {
      fs.copyFileSync(s, d);
    }
  }
}

if (!fs.existsSync(distApiRoot)) {
  console.error("copy-content-type-schemas: dist/src/api not found; run strapi build first");
  process.exit(1);
}

for (const name of fs.readdirSync(apiRoot, { withFileTypes: true })) {
  if (!name.isDirectory() || name.name.startsWith(".")) continue;
  const contentTypes = path.join(apiRoot, name.name, "content-types");
  const dest = path.join(distApiRoot, name.name, "content-types");
  copyJsonTree(contentTypes, dest);
}

console.log("copy-content-type-schemas: synced content-types JSON into dist/");
