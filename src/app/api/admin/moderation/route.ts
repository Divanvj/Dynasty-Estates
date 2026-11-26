import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import {
  auditActionForDecision,
  MODERATION_DECISIONS,
  statusForDecision,
  type ModerationDecision,
} from "@/lib/moderation-decisions";
import { AdminAuthError, requireModeratorCaller } from "@/lib/server/admin-auth";
import { AdminUnavailableError, adminDb } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * A moderator's decision on a submitted listing (/admin/moderation, item 1.3).
 * Body `{ listingId, decision: "Approved" | "Needs changes" | "Rejected", feedback }`.
 *
 * The browser used to make two separate writes: an audit entry, then the
 * listing's status, both allowed to any agent. Now an admin or moderator asks
 * the server, which changes the status and files the audit entry in one
 * transaction, so a decision is never applied without its record or recorded
 * without being applied. Nobody reviews their own listing.
 */

class DecisionError extends Error {
  constructor(
    message: string,
    public status: 400 | 403 | 404 | 409,
  ) {
    super(message);
  }
}

type Body = { listingId?: unknown; decision?: unknown; feedback?: unknown };

export async function POST(request: Request) {
  try {
    const caller = await requireModeratorCaller(request);
    const body = (await request.json().catch(() => null)) as Body | null;
    const listingId =
      typeof body?.listingId === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(body.listingId) ? body.listingId : null;
    const decision = MODERATION_DECISIONS.includes(body?.decision as ModerationDecision)
      ? (body?.decision as ModerationDecision)
      : null;
    const feedback = typeof body?.feedback === "string" ? body.feedback.trim().slice(0, 2000) : "";
    if (!listingId || !decision) {
      return NextResponse.json({ error: "Send the listing and a decision (Approved, Needs changes or Rejected)." }, { status: 400 });
    }
    if (decision !== "Approved" && !feedback) {
      return NextResponse.json({ error: "Tell the seller what to change. They see this note." }, { status: 400 });
    }

    const db = adminDb();
    const listingRef = db.doc(`properties/${listingId}`);
    const targetStatus = statusForDecision(decision);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(listingRef);
      if (!snap.exists) throw new DecisionError("That listing no longer exists.", 404);
      const status = String(snap.get("status") ?? "");
      if (status !== "Submitted") {
        throw new DecisionError(`This listing is no longer waiting for review (it is ${status || "without a status"}). Refresh the queue.`, 409);
      }
      if (snap.get("ownerId") === caller.uid) {
        throw new DecisionError("Another admin or moderator has to review your own listing.", 403);
      }
      tx.update(listingRef, {
        status: targetStatus,
        moderationFeedback: feedback,
        moderatedBy: caller.uid,
        moderatedAt: FieldValue.serverTimestamp(),
        // Stamped on the move to Published so structured data can emit a real
        // datePosted and the listing's history has a first-published date.
        ...(targetStatus === "Published" ? { publishedAt: FieldValue.serverTimestamp() } : {}),
      });
      tx.create(db.collection("audit_logs").doc(), {
        actorId: caller.uid,
        actorEmail: caller.email ?? "unknown",
        action: auditActionForDecision(decision),
        resource: `properties/${listingId}`,
        details: `Decision: ${decision}. Feedback: ${feedback || "None"}`,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ status: targetStatus });
  } catch (error) {
    if (error instanceof DecisionError || error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof AdminUnavailableError) {
      return NextResponse.json({ error: "The server isn’t connected to Firebase." }, { status: 503 });
    }
    console.error("[admin/moderation]", error);
    return NextResponse.json({ error: "The decision couldn’t be saved. Try again." }, { status: 500 });
  }
}
