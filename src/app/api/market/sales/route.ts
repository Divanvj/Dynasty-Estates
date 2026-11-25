import { NextResponse } from "next/server";

import { adminApp } from "@/lib/server/firebase-admin";
import { salesSummary } from "@/lib/server/sales";

export const dynamic = "force-dynamic";

/**
 * Area figures from sales recorded on Dynasty (lib/sales.ts). Public:
 * ?kind=sale|rental&area=<suburb or city>&type=<home type>. Individual prices
 * appear only where the seller agreed; the rest only inside banded medians.
 *
 * Cached at the edge for six hours (audit item 2.10): the figures move slowly,
 * and asking the same question again and again cannot show the moment one
 * more sale lands in an area. Errors are not cached.
 */
const CACHE = "public, s-maxage=21600, stale-while-revalidate=86400";

export async function GET(request: Request) {
  if (!adminApp()) return NextResponse.json({ error: "Sales figures aren't available right now." }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") === "rental" ? "rental" : "sale";
  const area = (params.get("area") ?? "").slice(0, 80);
  const type = (params.get("type") ?? "").slice(0, 40);
  try {
    return NextResponse.json(await salesSummary({ kind, area, type }), { headers: { "Cache-Control": CACHE } });
  } catch (error) {
    console.error("[market/sales]", error);
    return NextResponse.json({ error: "Sales figures couldn't be loaded. Try again in a moment." }, { status: 500 });
  }
}
