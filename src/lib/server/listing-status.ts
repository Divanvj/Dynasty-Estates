import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "./firebase-admin";
import { type Caller, ownListing, SaleError } from "./sales";
import { isMarketStatus, nextMarketStatus, type MarketStatus } from "@/lib/listing-status";

/**
 * S1-8 — moves one of the caller's live listings between `Published` and
 * `Under offer`. See lib/listing-status.ts for why the move is made here
 * instead of by a client write. Errors reuse SaleError so the route reports
 * them the same way /api/listings/[id]/sale does.
 */

const FORBIDDEN = "Only the listing's agent or seller can change its status.";

function wanted(body: unknown): MarketStatus {
  const status = (body as { status?: unknown } | null)?.status;
  if (!isMarketStatus(status)) throw new SaleError("Choose either Published or Under offer.", 400);
  return status;
}

export async function setMarketStatus(caller: Caller, listingId: string, body: unknown): Promise<{ status: MarketStatus }> {
  const status = wanted(body);
  const { ref } = await ownListing(caller, listingId, FORBIDDEN);

  const changed = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new SaleError("This listing no longer exists.", 404);
    const current = String(snap.data()?.status ?? "");
    // Already there: no write, no audit entry — two portals open at once, or a
    // double tap, should not read as a failure.
    if (current === status) return false;
    const move = nextMarketStatus(current);
    if (!move) {
      throw new SaleError(
        `Only a listing that is on the market can be marked ${status === "Under offer" ? "under offer" : "available"}; this one is ${current.toLowerCase() || "not live"}.`,
        409,
      );
    }
    if (move !== status) throw new SaleError("This listing's status changed since the page loaded. Refresh it.", 409);
    tx.update(ref, { status, updatedAt: FieldValue.serverTimestamp() });
    return true;
  });

  if (changed) {
    await adminDb()
      .collection("audit_logs")
      .add({
        actorId: caller.uid,
        actorEmail: caller.email,
        action: status === "Under offer" ? "listing.underOffer" : "listing.backOnMarket",
        resource: `properties/${listingId}`,
        details:
          status === "Under offer"
            ? "Marked under offer from the portal; the listing stays in search."
            : "Put back on the market from the portal.",
        createdAt: FieldValue.serverTimestamp(),
      });
  }

  return { status };
}
