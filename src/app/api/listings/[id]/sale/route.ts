import { NextResponse } from "next/server";

import { getSale, recordSale, saleCaller, SaleError, undoSale } from "@/lib/server/sales";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** The recorded sale on one of the caller's listings (or any, for an admin). */
export async function GET(request: Request, context: Context) {
  return handle(async () => ({ sale: await getSale(await saleCaller(request), (await context.params).id) }));
}

/** Body: { price, soldOn, pricePublic }. Marks the listing Sold / Rented, or corrects the recorded sale. */
export async function PUT(request: Request, context: Context) {
  return handle(async () => {
    const caller = await saleCaller(request);
    const body = await request.json().catch(() => ({}));
    return { sale: await recordSale(caller, (await context.params).id, body) };
  });
}

/** "Not sold after all": back on the market, record removed. */
export async function DELETE(request: Request, context: Context) {
  return handle(async () => undoSale(await saleCaller(request), (await context.params).id));
}

async function handle(work: () => Promise<Record<string, unknown>>) {
  try {
    return NextResponse.json(await work());
  } catch (error) {
    if (error instanceof SaleError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[listings/sale]", error);
    return NextResponse.json({ error: "The sale couldn't be saved. Try again in a moment." }, { status: 500 });
  }
}
