import { NextResponse } from "next/server";

import { recordConsoleEvent } from "@/lib/server/console-auth";
import { exportAccountData } from "@/lib/server/data-export";
import { AdminUnavailableError, adminApp, adminAuth } from "@/lib/server/firebase-admin";
import { allowRequest } from "@/lib/server/telemetry";

export const dynamic = "force-dynamic";

/**
 * POST with `Authorization: Bearer <ID token>`: a JSON file of the caller's own
 * data (src/lib/server/data-export.ts). POST, not GET, so the token travels in
 * a header rather than a URL. Revoked sessions are refused, three exports an
 * hour per account, and each export is recorded in the console's event log.
 */
export async function POST(request: Request) {
  if (!adminApp()) return NextResponse.json({ error: "Downloads aren't available right now. Try again later." }, { status: 503 });
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(token, true)).uid;
  } catch (error) {
    if (error instanceof AdminUnavailableError) {
      return NextResponse.json({ error: "Downloads aren't available right now. Try again later." }, { status: 503 });
    }
    return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
  }

  if (!allowRequest(`account-export:${uid}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "You've downloaded your data three times in the last hour. Try again later." }, { status: 429 });
  }

  try {
    const data = await exportAccountData(uid);
    await recordConsoleEvent(null, "account.export", "An account downloaded its own data", { uid }).catch((error) =>
      console.error("[account/export] could not record the export:", error),
    );
    const day = data.exportedAt.slice(0, 10);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="dynasty-estates-my-data-${day}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[account/export]", error);
    return NextResponse.json({ error: "Your data couldn't be gathered. Try again in a moment." }, { status: 500 });
  }
}
