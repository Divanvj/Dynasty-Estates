import { NextResponse } from "next/server";

import { consoleRoute, recordConsoleEvent } from "@/lib/server/console-auth";
import { getErrorGroups } from "@/lib/server/console-data";
import { adminDb } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

export const GET = consoleRoute(async (request) => {
  const days = Math.min(30, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 7));
  return NextResponse.json(await getErrorGroups(days));
});

/** Resolve or reopen an error group. */
export const PATCH = consoleRoute(async (request, caller) => {
  const body = (await request.json()) as { fingerprint?: string; resolved?: boolean };
  if (!body.fingerprint || !/^[0-9a-f]{16}$/.test(body.fingerprint) || typeof body.resolved !== "boolean") {
    return NextResponse.json({ error: "fingerprint and resolved are required." }, { status: 400 });
  }
  await adminDb()
    .collection("app_error_groups")
    .doc(body.fingerprint)
    .set(
      { resolved: body.resolved, resolvedAt: new Date(), resolvedBy: caller.email ?? caller.uid },
      { merge: true },
    );
  await recordConsoleEvent(
    caller,
    body.resolved ? "errors.resolve" : "errors.reopen",
    `${body.resolved ? "Resolved" : "Reopened"} error group ${body.fingerprint}`,
    { fingerprint: body.fingerprint },
  );
  return NextResponse.json({ ok: true });
});
