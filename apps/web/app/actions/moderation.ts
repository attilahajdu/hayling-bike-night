"use server";

import { auth } from "@/auth";
import { isOwnerEmail } from "@/lib/owner";

const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";
const TOKEN = process.env.STRAPI_API_TOKEN;

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.email || !isOwnerEmail(session.user.email)) {
    throw new Error("Unauthorized");
  }
}

export async function setPhotoStatus(photoId: number, status: "published" | "rejected") {
  await requireOwner();
  if (!TOKEN) throw new Error("Missing STRAPI_API_TOKEN");

  const res = await fetch(`${STRAPI}/api/photos/${photoId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ data: { status } }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Strapi error ${res.status}: ${t}`);
  }
}
