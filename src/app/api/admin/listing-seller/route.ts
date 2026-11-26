import { NextResponse } from "next/server";

import { AdminAuthError, requireAdminCaller } from "@/lib/server/admin-auth";
import { AdminUnavailableError, adminAuth, adminDb } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * A listing owner's name and e-mail address, for an admin reviewing the
 * listing ("Contact seller" on /admin/moderation). Body `{ listingId }`.
 *
 * Listings used to carry the owner's address (ownerEmail) on the listing
 * itself, which anyone can read once it is published (audit item 1.5). The
 * address now stays in Firebase Auth and comes out here, to admins only, one
 * listing at a time. Buyers never see it: their enquiries are e-mailed to the
 * owner by the server (/api/notify/enquiry).
 */
export async function POST(request: Request) {
  try {
    await requireAdminCaller(request);
    const body = (await request.json().catch(() => null)) as { listingId?: unknown } | null;
    const listingId =
      typeof body?.listingId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(body.listingId) ? body.listingId : null;
    if (!listingId) return NextResponse.json({ error: "Send the listing." }, { status: 400 });

    const listing = await adminDb().doc(`properties/${listingId}`).get();
    if (!listing.exists) return NextResponse.json({ error: "That listing no longer exists." }, { status: 404 });
    const ownerId = listing.get("ownerId");
    if (typeof ownerId !== "string" || !ownerId) {
      return NextResponse.json({ error: "This listing has no owner on record." }, { status: 404 });
    }
    const owner = await adminAuth().getUser(ownerId).catch(() => null);
    if (!owner) return NextResponse.json({ error: "The seller’s account no longer exists." }, { status: 404 });

    return NextResponse.json(
      { name: owner.displayName ?? null, email: owner.email ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof AdminUnavailableError) {
      return NextResponse.json({ error: "The server isn’t connected to Firebase." }, { status: 503 });
    }
    console.error("[admin/listing-seller]", error);
    return NextResponse.json({ error: "The seller’s details couldn’t be loaded." }, { status: 500 });
  }
}
