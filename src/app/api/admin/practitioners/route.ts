import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { daysUntil } from "@/lib/practitioner-compliance";
import { AdminAuthError, requireAdminCaller } from "@/lib/server/admin-auth";
import { actingRole, claimsForRole, isDeveloperAccount } from "@/lib/server/claims";
import { AdminUnavailableError, adminAuth, adminDb } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * An admin's decision on a practitioner application (PLAN.md Phase F, F3).
 * Body `{ uid, decision: "verify" | "reject", note? }`.
 *
 * Verify: the application must be pending and its certificate unexpired; it is
 * marked verified, and an account that is not yet an agent gets the `agent`
 * role claim (and the profile's display mirror). Admin and developer accounts
 * keep their role: they already reach the agent console, and claimsForRole
 * would strip a developer's flag. Reject needs a note, which the applicant
 * sees. Both file an append-only audit_logs entry, in the shape the rule for
 * client-filed entries requires.
 */

type Body = { uid?: unknown; decision?: unknown; note?: unknown };

export async function POST(request: Request) {
  try {
    const caller = await requireAdminCaller(request);
    const body = (await request.json().catch(() => null)) as Body | null;
    const uid = typeof body?.uid === "string" ? body.uid : "";
    const decision = body?.decision === "verify" || body?.decision === "reject" ? body.decision : null;
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";
    if (!uid || !/^[A-Za-z0-9]{1,128}$/.test(uid) || !decision) {
      return NextResponse.json({ error: "Send the account and a decision (verify or reject)." }, { status: 400 });
    }
    if (uid === caller.uid) {
      return NextResponse.json({ error: "Another admin has to decide your own application." }, { status: 403 });
    }
    if (decision === "reject" && !note) {
      return NextResponse.json({ error: "Say why, so the applicant knows what to fix." }, { status: 400 });
    }

    const ref = adminDb().collection("practitioners").doc(uid);
    const snap = await ref.get();
    const data = snap.data();
    if (!snap.exists || !data) return NextResponse.json({ error: "That application no longer exists." }, { status: 404 });
    if (data.status !== "pending") {
      return NextResponse.json({ error: "That application was already decided. Refresh the list." }, { status: 409 });
    }
    const left = daysUntil(String(data.ffcExpiry ?? ""));
    if (decision === "verify" && (left === null || left < 0)) {
      return NextResponse.json({ error: "This certificate has expired. Reject it and ask for the current one." }, { status: 409 });
    }

    let roleChange: { from: string | null; to: string } | null = null;
    if (decision === "verify") {
      const user = await adminAuth().getUser(uid);
      const current = actingRole(user.customClaims);
      if (!isDeveloperAccount(user.customClaims) && current !== "agent" && current !== "admin") {
        await adminAuth().setCustomUserClaims(uid, claimsForRole(user.customClaims, "agent"));
        await adminDb()
          .collection("users")
          .doc(uid)
          .set({ role: "agent", updatedAt: new Date().toISOString() }, { merge: true });
        roleChange = { from: current, to: "agent" };
      }
    }

    const now = FieldValue.serverTimestamp();
    await ref.update({
      status: decision === "verify" ? "verified" : "rejected",
      verifiedAt: decision === "verify" ? now : FieldValue.delete(),
      verifiedBy: caller.uid,
      decisionNote: note,
    });
    await adminDb()
      .collection("audit_logs")
      .add({
        actorId: caller.uid,
        actorEmail: caller.email,
        action: decision === "verify" ? "practitioner.verify" : "practitioner.reject",
        resource: `practitioners/${uid}`,
        // A sentence, as moderation writes it: the audit page shows it as text.
        details: [
          `${String(data.fullName ?? "Applicant")}, FFC ${String(data.ffcNumber ?? "")}, expires ${String(data.ffcExpiry ?? "")}.`,
          roleChange ? `Agent access granted (was ${roleChange.from ?? "no role"}).` : "",
          note ? `Reason: ${note}` : "",
        ]
          .filter(Boolean)
          .join(" "),
        createdAt: now,
      });

    return NextResponse.json({ ok: true, status: decision === "verify" ? "verified" : "rejected", roleChange });
  } catch (error) {
    if (error instanceof AdminAuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof AdminUnavailableError) {
      return NextResponse.json({ error: "The server isn't connected to Firebase yet." }, { status: 503 });
    }
    console.error("[admin/practitioners] decision failed", error);
    return NextResponse.json({ error: "The decision wasn't saved. Try again." }, { status: 500 });
  }
}
