import { NextResponse } from "next/server";

import { TEST_ROLES, type TestRole } from "@/lib/server/claims";
import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";
import { adminAuth } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * Switches the calling developer account into another role for testing, or
 * back to "developer". It changes the real `role` claim, so firestore.rules
 * treats the account exactly as that role; `developer: true` stays on, which is
 * what lets it come back. The caller must refresh its ID token afterwards
 * (getIdToken(true)) for the new role to apply.
 */
export const POST = consoleRoute(async (request, caller) => {
  if (caller.role !== "developer") {
    return NextResponse.json({ error: "Only developer accounts can switch roles for testing." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { role?: unknown } | null;
  const role = body?.role;
  if (typeof role !== "string" || !TEST_ROLES.includes(role as TestRole)) {
    return NextResponse.json({ error: `Role must be one of: ${TEST_ROLES.join(", ")}.` }, { status: 400 });
  }

  const user = await adminAuth().getUser(caller.uid);
  const from = typeof user.customClaims?.role === "string" ? (user.customClaims.role as string) : "none";
  await adminAuth().setCustomUserClaims(caller.uid, { ...(user.customClaims ?? {}), role, developer: true });
  await recordConsoleEvent(
    caller,
    "testing.switchRole",
    role === "developer" ? "Stopped testing; back to developer" : `Started testing as ${role}`,
    { from, to: role },
  );
  return NextResponse.json({ ok: true, role });
});
