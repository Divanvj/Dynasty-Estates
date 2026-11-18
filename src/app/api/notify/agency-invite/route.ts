import { NextResponse } from "next/server";

import { NotifyError, notifyAgencyInvite, signedInCaller } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

/** Called by the principal's browser right after it saves an invitation. Body: { inviteId }. */
export async function POST(request: Request) {
  try {
    const caller = await signedInCaller(request);
    const body = (await request.json().catch(() => ({}))) as { inviteId?: unknown };
    const inviteId = typeof body.inviteId === "string" && body.inviteId.length <= 300 && !body.inviteId.includes("/") ? body.inviteId : null;
    if (!inviteId) throw new NotifyError("Missing inviteId.", 400);
    return NextResponse.json(await notifyAgencyInvite(caller, inviteId));
  } catch (error) {
    if (error instanceof NotifyError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[notify/agency-invite]", error);
    return NextResponse.json({ error: "The e-mail couldn't be sent." }, { status: 500 });
  }
}
