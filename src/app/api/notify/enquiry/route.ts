import { NextResponse } from "next/server";

import { NotifyError, notifyEnquiry, signedInCaller } from "@/lib/server/notify";

export const dynamic = "force-dynamic";

/** Called by the buyer's browser right after it saves an enquiry. Body: { inquiryId }. */
export async function POST(request: Request) {
  try {
    const caller = await signedInCaller(request);
    const body = (await request.json().catch(() => ({}))) as { inquiryId?: unknown };
    const inquiryId = typeof body.inquiryId === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(body.inquiryId) ? body.inquiryId : null;
    if (!inquiryId) throw new NotifyError("Missing inquiryId.", 400);
    return NextResponse.json(await notifyEnquiry(caller, inquiryId));
  } catch (error) {
    if (error instanceof NotifyError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[notify/enquiry]", error);
    return NextResponse.json({ error: "The e-mail couldn't be sent." }, { status: 500 });
  }
}
