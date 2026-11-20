import { NextResponse } from "next/server";

import { sendVerificationEmail, type VerificationReason } from "@/lib/server/email-verification";
import { NotifyError, signedInCaller } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

/**
 * Sends the signed-in account a link to confirm its e-mail address (S1-6).
 * Body: { reason: "signup" | "resend" }. Called by the browser right after
 * sign-up, and by "Send the link again" on the reminder banner. Rate-limited
 * per account in lib/server/email-verification.ts.
 */
export async function POST(request: Request) {
  try {
    const caller = await signedInCaller(request);
    const body = (await request.json().catch(() => ({}))) as { reason?: unknown };
    const reason: VerificationReason = body.reason === "signup" ? "signup" : "resend";
    return NextResponse.json(await sendVerificationEmail(caller.uid, reason));
  } catch (error) {
    if (error instanceof NotifyError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[auth/verify-email]", error);
    return NextResponse.json({ error: "The e-mail couldn't be sent. Try again in a minute." }, { status: 500 });
  }
}
