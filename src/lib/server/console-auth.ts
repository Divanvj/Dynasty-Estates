import { NextResponse } from "next/server";

import { AdminUnavailableError, adminAuth, adminDb } from "./firebase-admin";

/**
 * Who may call a /api/console route. The claim is the authority, exactly as in
 * firestore.rules: `developer` runs the platform, `admin` moderates and may also
 * open the console. The client-side `accountCan("console")` only hides the link.
 */
export const CONSOLE_ROLES = ["developer", "admin"] as const;
export type ConsoleRole = (typeof CONSOLE_ROLES)[number];

export type ConsoleCaller = { uid: string; email: string | null; role: ConsoleRole };

export class ConsoleAuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403,
  ) {
    super(message);
  }
}

export async function requireConsoleCaller(request: Request): Promise<ConsoleCaller> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new ConsoleAuthError("Sign in to use the console.", 401);

  let decoded;
  try {
    // checkRevoked: a revoked or disabled account loses the console at once,
    // not when its hour-long ID token happens to expire.
    decoded = await adminAuth().verifyIdToken(token, true);
  } catch (error) {
    if (error instanceof AdminUnavailableError) throw error;
    throw new ConsoleAuthError("Your session has expired. Sign in again.", 401);
  }

  const role = decoded.role;
  if (role !== "developer" && role !== "admin") {
    throw new ConsoleAuthError("This account does not hold the developer or admin role.", 403);
  }
  return { uid: decoded.uid, email: decoded.email ?? null, role };
}

/** Records a privileged console action. Every write the console makes calls this. */
export async function recordConsoleEvent(
  caller: ConsoleCaller | null,
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  await adminDb()
    .collection("console_events")
    .add({
      actorId: caller?.uid ?? "system",
      actorEmail: caller?.email ?? null,
      actorRole: caller?.role ?? "system",
      action,
      summary,
      details,
      createdAt: new Date(),
    });
}

/**
 * Wraps a console handler: authenticates, then turns the known failures into
 * JSON the console can show, so a missing key reads as "not connected" rather
 * than a stack trace.
 */
export function consoleRoute(
  handler: (request: Request, caller: ConsoleCaller) => Promise<Response>,
) {
  return async (request: Request) => {
    try {
      const caller = await requireConsoleCaller(request);
      return await handler(request, caller);
    } catch (error) {
      if (error instanceof ConsoleAuthError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof AdminUnavailableError) {
        return NextResponse.json({ error: error.message, notConnected: true }, { status: 503 });
      }
      console.error("[console]", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Console request failed." },
        { status: 500 },
      );
    }
  };
}
