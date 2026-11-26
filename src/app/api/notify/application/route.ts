import { NextResponse } from "next/server";

import { NotifyError, notifyApplication, signedInCaller } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

/** Called by the tenant's browser right after it saves a tenancy application. Body: { applicationId }. */
export async function POST(request: Request) {
  try {
    const caller = await signedInCaller(request);
    const body = (await request.json().catch(() => ({}))) as { applicationId?: unknown };
    const applicationId =
      typeof body.applicationId === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(body.applicationId) ? body.applicationId : null;
    if (!applicationId) throw new NotifyError("Missing applicationId.", 400);
    return NextResponse.json(await notifyApplication(caller, applicationId));
  } catch (error) {
    if (error instanceof NotifyError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[notify/application]", error);
    return NextResponse.json({ error: "The e-mail couldn't be sent." }, { status: 500 });
  }
}
