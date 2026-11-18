import { NextResponse } from "next/server";

import { readEmailPrefs, writeEmailPrefs } from "@/lib/server/email-prefs";
import { NotifyError, signedInCaller } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

/** The signed-in person's e-mail preferences (lib/email-prefs.ts). */
export async function GET(request: Request) {
  try {
    const caller = await signedInCaller(request);
    return NextResponse.json({ prefs: await readEmailPrefs(caller.uid) });
  } catch (error) {
    return failed(error);
  }
}

/** Body: { enquiryEmails?: boolean, weeklyReports?: boolean, savedSearchAlerts?: boolean }. */
export async function POST(request: Request) {
  try {
    const caller = await signedInCaller(request);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json({ prefs: await writeEmailPrefs(caller.uid, body as Record<string, boolean>, "settings") });
  } catch (error) {
    return failed(error);
  }
}

function failed(error: unknown) {
  if (error instanceof NotifyError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("[email/preferences]", error);
  return NextResponse.json({ error: "Your e-mail settings couldn't be loaded or saved. Try again in a moment." }, { status: 500 });
}
