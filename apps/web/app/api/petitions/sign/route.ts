import { NextResponse } from "next/server";

const STRAPI = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "http://localhost:1337";
const TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(req: Request) {
  if (!TOKEN) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const body = (await req.json()) as {
    petitionId?: number;
    slug?: string;
    name?: string;
    email?: string;
    postcode?: string;
    consent?: boolean;
  };

  if (!body.name?.trim() || !body.email?.trim() || !body.consent) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const petitionId = body.petitionId;
  if (typeof petitionId !== "number") {
    return NextResponse.json({ error: "Invalid petition" }, { status: 400 });
  }

  const sigRes = await fetch(`${STRAPI}/api/petition-signatures`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        postcode: body.postcode?.trim() || null,
        consent: true,
        signedAt: new Date().toISOString(),
        petition: petitionId,
      },
    }),
  });

  if (!sigRes.ok) {
    const t = await sigRes.text();
    console.error("Strapi signature create failed", sigRes.status, t);
    return NextResponse.json({ error: "Could not save signature" }, { status: 502 });
  }

  const petRes = await fetch(`${STRAPI}/api/petitions/${petitionId}?populate=*`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (petRes.ok) {
    const pet = (await petRes.json()) as { data?: { attributes?: { currentCount?: number } } };
    const current = pet.data?.attributes?.currentCount ?? 0;
    await fetch(`${STRAPI}/api/petitions/${petitionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ data: { currentCount: current + 1 } }),
    });
  }

  return NextResponse.json({ ok: true });
}
