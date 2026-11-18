import { NextResponse } from "next/server";

import { EMAIL_PREFS } from "@/lib/email-prefs";
import { adminApp } from "@/lib/server/firebase-admin";
import { verifyUnsubscribeToken, writeEmailPrefs } from "@/lib/server/email-prefs";

export const dynamic = "force-dynamic";

/**
 * Turns off one kind of e-mail for one person, from the signed token in the
 * e-mail (?t=… or { t } in a JSON body). Mail apps POST here for one-click
 * unsubscribe (List-Unsubscribe-Post); the /email/unsubscribe page does too,
 * after asking. There is deliberately no GET: link scanners open links, and
 * must not unsubscribe anyone.
 */
export async function POST(request: Request) {
  const fromQuery = new URL(request.url).searchParams.get("t");
  const body = fromQuery ? {} : ((await request.json().catch(() => ({}))) as { t?: unknown });
  const token = fromQuery ?? (typeof body.t === "string" ? body.t : "");
  const target = verifyUnsubscribeToken(token);
  if (!target) return NextResponse.json({ error: "This link isn't valid. Choose your e-mails on the Alerts page instead." }, { status: 400 });
  if (!adminApp()) return NextResponse.json({ error: "The server isn't connected right now. Try again in a moment." }, { status: 503 });
  try {
    await writeEmailPrefs(target.uid, { [target.pref]: false }, "link");
    return NextResponse.json({ ok: true, pref: target.pref, label: EMAIL_PREFS[target.pref].label });
  } catch (error) {
    console.error("[email/unsubscribe]", error);
    return NextResponse.json({ error: "That didn't save. Try again in a moment." }, { status: 500 });
  }
}
