import { NextResponse } from "next/server";

import { consoleRoute } from "@/lib/server/console-auth";
import { adminConfigError } from "@/lib/server/firebase-admin";
import { buildInfo } from "@/lib/server/platform-checks";

export const dynamic = "force-dynamic";

/** Confirms the caller's console access server-side; the shell gates on this. */
export const GET = consoleRoute(async (_request, caller) =>
  NextResponse.json({ caller, build: buildInfo(), adminError: adminConfigError() }),
);
