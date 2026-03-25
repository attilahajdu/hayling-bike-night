"use strict";

const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::photo.photo", ({ strapi }) => ({
  /**
   * Multipart field name must be `files` (Strapi body parser).
   * Auth: Bearer token must match a row in admin::api-token (same salt as Render).
   */
  async uploadCommunityImage(ctx) {
    const raw = ctx.request.headers.authorization;
    const bearer = typeof raw === "string" && raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
    if (!bearer) {
      return ctx.unauthorized();
    }

    const apiTokenService = strapi.admin.services["api-token"];
    const hashed = apiTokenService.hash(bearer);
    const tokenRow = await strapi.query("admin::api-token").findOne({ where: { accessKey: hashed } });
    if (!tokenRow) {
      return ctx.unauthorized();
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
    const maxBytes = 10 * 1024 * 1024;
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
