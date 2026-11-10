import { NextResponse } from "next/server";

import { LISTING_EVENTS, LISTING_ID_PATTERN, type ListingEvent } from "@/lib/listing-stats";
import { AdminUnavailableError } from "@/lib/server/firebase-admin";
import { recordListingEvent } from "@/lib/server/listing-stats";
import { allowRequest, clientKey } from "@/lib/server/telemetry";

/**
 * Public: counts a listing view, save or contact click (docs/dashboards/PLAN.md,
 * F1). Body `{ listingId, event }`. Nothing identifying is stored; the caller's
 * address is used only in memory to throttle repeats, and is never written.
 *
 * Limits per address: a view of the same listing counts once per 30 minutes,
 * a save or contact click once per minute, and 120 events a minute overall.
 * This is per server instance, so it blunts casual inflation, not a determined
 * attack — the counts are a guide, not an audited figure.
 */

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|curl|wget|python|node-fetch|axios/i;
const REPEAT_WINDOW_MS: Record<ListingEvent, number> = { view: 30 * 60 * 1000, save: 60 * 1000, contact: 60 * 1000 };

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

  const text = await request.text();
  if (text.length > 500) return NextResponse.json({ counted: false }, { status: 413 });
  let body: { listingId?: unknown; event?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ counted: false }, { status: 400 });
  }
  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  const event = (LISTING_EVENTS as readonly string[]).includes(String(body.event)) ? (body.event as ListingEvent) : null;
  if (!LISTING_ID_PATTERN.test(listingId) || !event) {
    return NextResponse.json({ counted: false }, { status: 400 });
  }

  const who = clientKey(request);
  if (!allowRequest(`track:${who}`, 120)) return NextResponse.json({ counted: false }, { status: 429 });
  // A repeat inside the window is accepted quietly but not counted again.
  if (!allowRequest(`track:${who}:${event}:${listingId}`, 1, REPEAT_WINDOW_MS[event])) {
    return NextResponse.json({ counted: false, reason: "repeat" });
  }

  try {
    const result = await recordListingEvent(listingId, event);
    return NextResponse.json({ counted: result === "counted" });
  } catch (error) {
    if (error instanceof AdminUnavailableError) {
      return NextResponse.json({ counted: false, reason: "not-configured" }, { status: 503 });
    }
    console.error("[track] event not recorded", error);
    return NextResponse.json({ counted: false }, { status: 500 });
  }
}
