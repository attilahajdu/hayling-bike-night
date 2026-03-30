"use strict";

const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { createCoreController } = require("@strapi/strapi").factories;

function timingSafeEqualStrings(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a.length || a.length !== b.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

module.exports = createCoreController("api::photo.photo", ({ strapi }) => ({
  /**
   * Multipart field name must be `files` (Strapi body parser).
   * Auth (either):
   * - Bearer API token (must match DB hash; same API_TOKEN_SALT as when token was created), or
   * - Header x-community-upload-secret matching COMMUNITY_UPLOAD_SECRET (optional; avoids token/salt drift).
   */
  async uploadCommunityImage(ctx) {
    const shared = process.env.COMMUNITY_UPLOAD_SECRET?.trim();
    const headerSecret = ctx.get("x-community-upload-secret")?.trim();
    let authorized = shared && headerSecret && timingSafeEqualStrings(shared, headerSecret);

    if (!authorized) {
      const raw = ctx.request.headers.authorization;
      const bearer = typeof raw === "string" && raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
      if (!bearer) {
        return ctx.unauthorized();
      }

      const apiTokenService = strapi.admin.services["api-token"];
      const tokenRow = await apiTokenService.getBy({ accessKey: apiTokenService.hash(bearer) });
      if (!tokenRow) {
        return ctx.unauthorized();
      }
      authorized = true;
    }

    const rawFiles = ctx.request.files?.files;
    const file = Array.isArray(rawFiles) ? rawFiles[0] : rawFiles;
    const tempPath = file.filepath || file.path;
    if (!tempPath) {
      return ctx.badRequest("No image file (use multipart field name: files)");
    }

    const mime = file.mimetype || file.type || "";
    if (!mime.startsWith("image/")) {
      return ctx.badRequest("Invalid file type");
    }
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      return ctx.throw(413, "File too large");
    }

    const ext =
      mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const subdir = ctx.query?.folder === "pro" ? "pro" : "community";
    const destDir = path.join(strapi.dirs.static.public, "uploads", subdir);
    const destPath = path.join(destDir, fileName);

    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(tempPath, destPath);

    ctx.body = { path: `/uploads/${subdir}/${fileName}` };
  },
}));
