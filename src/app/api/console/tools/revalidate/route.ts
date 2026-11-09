import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";

export const dynamic = "force-dynamic";

/** Drops every cached page so the next visitor gets a fresh render. */
export const POST = consoleRoute(async (_request, caller) => {
  revalidatePath("/", "layout");
  await recordConsoleEvent(caller, "tools.revalidate", "Cleared the page cache for the whole site");
  return NextResponse.json({ ok: true });
});
