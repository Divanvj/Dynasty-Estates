import { NextResponse } from "next/server";

import { NotifyError, signedInCaller } from "@/lib/server/notify";
import { createSavedSearch, deleteSavedSearch, listSavedSearches, SavedSearchError, setSavedSearchAlerts } from "@/lib/server/saved-searches";

export const dynamic = "force-dynamic";

/** The signed-in person's saved searches (lib/server/saved-searches.ts). */
export async function GET(request: Request) {
  return handle(async () => {
    const caller = await signedInCaller(request);
    return { searches: await listSavedSearches(caller.uid) };
  });
}

/** Body: { query } — the /search query string to save. */
export async function POST(request: Request) {
  return handle(async () => {
    const caller = await signedInCaller(request);
    const body = (await request.json().catch(() => ({}))) as { query?: unknown };
    if (typeof body.query !== "string") throw new SavedSearchError("Missing query.", 400);
    return { search: await createSavedSearch(caller.uid, body.query) };
  });
}

/** Body: { id, alerts } — turns one search's alerts on or off. */
export async function PATCH(request: Request) {
  return handle(async () => {
    const caller = await signedInCaller(request);
    const body = (await request.json().catch(() => ({}))) as { id?: unknown; alerts?: unknown };
    if (typeof body.id !== "string" || typeof body.alerts !== "boolean") throw new SavedSearchError("Missing id or alerts.", 400);
    await setSavedSearchAlerts(caller.uid, body.id, body.alerts);
    return { ok: true };
  });
}

/** Body: { id }. */
export async function DELETE(request: Request) {
  return handle(async () => {
    const caller = await signedInCaller(request);
    const body = (await request.json().catch(() => ({}))) as { id?: unknown };
    if (typeof body.id !== "string") throw new SavedSearchError("Missing id.", 400);
    await deleteSavedSearch(caller.uid, body.id);
    return { ok: true };
  });
}

async function handle(work: () => Promise<Record<string, unknown>>) {
  try {
    return NextResponse.json(await work());
  } catch (error) {
    if (error instanceof NotifyError || error instanceof SavedSearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[saved-searches]", error);
    return NextResponse.json({ error: "Your saved searches couldn't be loaded or saved. Try again in a moment." }, { status: 500 });
  }
}
