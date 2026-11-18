import { NextResponse } from "next/server";

import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";
import { adminDb } from "@/lib/server/firebase-admin";
import { MAIL_LOG, mailSetup, sendMail } from "@/lib/server/mail";
import { testEmail } from "@/lib/server/mail-templates";

export const dynamic = "force-dynamic";

/** E-mail set-up (never the key) and the last 50 e-mails attempted. */
export const GET = consoleRoute(async () => {
  const snapshot = await adminDb().collection(MAIL_LOG).orderBy("at", "desc").limit(50).get();
  return NextResponse.json({
    setup: mailSetup(),
    log: snapshot.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
});

/**
 * Sends a test e-mail to the signed-in console user, or with { to: "alerts" }
 * to the MAIL_ALERTS_TO addresses (useful when the console account's own
 * address is not a real inbox).
 */
export const POST = consoleRoute(async (request, caller) => {
  const body = (await request.json().catch(() => ({}))) as { to?: unknown };
  const setup = mailSetup();
  const recipients = body.to === "alerts" ? setup.alertsTo : caller.email ? [caller.email] : [];
  if (!recipients.length) {
    return NextResponse.json({ error: body.to === "alerts" ? "MAIL_ALERTS_TO is not set." : "This account has no e-mail address to send a test to." }, { status: 400 });
  }
  const mail = testEmail({ requestedBy: caller.email ?? caller.uid, provider: setup.provider ?? "no provider" });
  let result: Awaited<ReturnType<typeof sendMail>> = { status: "skipped", reason: "No recipient." };
  for (const to of recipients) result = await sendMail({ kind: "test", to: { email: to }, ref: "console", ...mail });
  await recordConsoleEvent(caller, "email.test", `Test e-mail to ${recipients.join(", ")}: ${result.status}`, {
    status: result.status,
    detail: result.status === "sent" ? result.messageId : result.status === "skipped" ? result.reason : result.error,
  });
  return NextResponse.json({ result });
});
