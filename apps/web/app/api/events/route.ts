import { getEvents } from "@/lib/strapi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upcoming = searchParams.get("upcoming") === "1";
  const res = await getEvents({ upcoming });
  if (!res) {
    return Response.json({ error: "Upstream unavailable" }, { status: 502 });
  }
  return Response.json(res, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
