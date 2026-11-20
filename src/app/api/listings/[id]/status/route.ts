import { NextResponse } from "next/server";

import { setMarketStatus } from "@/lib/server/listing-status";
import { saleCaller, SaleError } from "@/lib/server/sales";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** Body: { status: "Under offer" | "Published" }. S1-8, see lib/listing-status.ts. */
export async function PUT(request: Request, context: Context) {
  try {
    const caller = await saleCaller(request);
    const body = await request.json().catch(() => ({}));
    return NextResponse.json(await setMarketStatus(caller, (await context.params).id, body));
  } catch (error) {
    if (error instanceof SaleError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[listings/status]", error);
    return NextResponse.json({ error: "The status couldn't be changed. Try again in a moment." }, { status: 500 });
  }
}
