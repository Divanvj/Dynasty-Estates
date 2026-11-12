import { AdminUnavailableError, adminAuth } from "./firebase-admin";

/**
 * Who may call an /api/admin route: an account whose `role` claim is "admin",
 * exactly what firestore.rules' isAdmin() checks. A developer account testing
 * as admin carries role "admin" too, so it passes, as it does in the rules.
 * Kept apart from console-auth.ts: the developer console is a separate area.
 */
export type AdminCaller = { uid: string; email: string | null };

export class AdminAuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403,
  ) {
    super(message);
  }
}

export async function requireAdminCaller(request: Request): Promise<AdminCaller> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new AdminAuthError("Sign in as an admin to do this.", 401);
  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token, true);
  } catch (error) {
    if (error instanceof AdminUnavailableError) throw error;
    throw new AdminAuthError("Your session has expired. Sign in again.", 401);
  }
  if (decoded.role !== "admin") throw new AdminAuthError("Only an admin can do this.", 403);
  return { uid: decoded.uid, email: decoded.email ?? null };
}
