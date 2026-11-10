import { NextResponse } from "next/server";

import { accountRole, claimsForRole, isDeveloperAccount } from "@/lib/server/claims";
import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";
import { ASSIGNABLE_ROLES, getUsers, type AssignableRole } from "@/lib/server/console-data";
import { adminAuth, adminDb } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

export const GET = consoleRoute(async () => NextResponse.json({ users: await getUsers() }));

type Action =
  | { action: "setRole"; uid: string; role: AssignableRole }
  | { action: "revokeSessions"; uid: string }
  | { action: "setDisabled"; uid: string; disabled: boolean };

export const PATCH = consoleRoute(async (request, caller) => {
  const body = (await request.json()) as Action;
  if (!body?.uid || typeof body.uid !== "string") {
    return NextResponse.json({ error: "uid is required." }, { status: 400 });
  }
  // Locking yourself out of the console is never what was meant.
  if (body.uid === caller.uid && body.action !== "revokeSessions") {
    return NextResponse.json(
      { error: "You cannot change your own role or disable your own account here." },
      { status: 400 },
    );
  }

  const target = await adminAuth().getUser(body.uid);
  const label = target.email ?? target.phoneNumber ?? target.uid;
  // A developer testing as another role is still a developer here.
  const currentRole = accountRole(target.customClaims);
  const targetIsDeveloper = isDeveloperAccount(target.customClaims);

  if (body.action === "setRole") {
    if (!ASSIGNABLE_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Unknown role." }, { status: 400 });
    }
    // Only a developer may hand out or take away the developer role.
    if ((body.role === "developer" || targetIsDeveloper) && caller.role !== "developer") {
      return NextResponse.json({ error: "Only a developer can grant or remove the developer role." }, { status: 403 });
    }
    await adminAuth().setCustomUserClaims(target.uid, claimsForRole(target.customClaims, body.role));
    // The profile role is a display mirror of the claim; keep them agreeing.
    await adminDb()
      .doc(`users/${target.uid}`)
      .set({ role: body.role, updatedAt: new Date().toISOString() }, { merge: true });
    await recordConsoleEvent(caller, "users.setRole", `Changed ${label} from ${currentRole ?? "no role"} to ${body.role}`, {
      uid: target.uid,
      from: currentRole,
      to: body.role,
    });
    return NextResponse.json({
      ok: true,
      note: "The new role applies when that account next refreshes its sign-in (within an hour, or at once on sign-in).",
    });
  }

  if (body.action === "revokeSessions") {
    await adminAuth().revokeRefreshTokens(target.uid);
    await recordConsoleEvent(caller, "users.revokeSessions", `Signed ${label} out everywhere`, { uid: target.uid });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "setDisabled") {
    if (targetIsDeveloper && caller.role !== "developer") {
      return NextResponse.json({ error: "Only a developer can disable a developer account." }, { status: 403 });
    }
    await adminAuth().updateUser(target.uid, { disabled: body.disabled === true });
    if (body.disabled) await adminAuth().revokeRefreshTokens(target.uid);
    await recordConsoleEvent(
      caller,
      body.disabled ? "users.disable" : "users.enable",
      `${body.disabled ? "Disabled" : "Re-enabled"} ${label}`,
      { uid: target.uid },
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
});
