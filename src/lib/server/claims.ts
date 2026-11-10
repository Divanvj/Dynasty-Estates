/**
 * How a role is stored on a Firebase Auth account.
 *
 *   { role: "buyer" }                      an ordinary account
 *   { role: "developer", developer: true } a developer, working as a developer
 *   { role: "agent", developer: true }     a developer testing the site as an agent
 *
 * `role` is always the role the account is acting with right now, because that
 * is the claim firestore.rules enforces: a developer testing as an agent really
 * gets an agent's permissions, not a picture of them. `developer: true` is what
 * makes the account a developer, so it keeps the console and can always switch
 * back. Only server code (Admin SDK) can set either.
 */

export type ClaimSet = Record<string, unknown> | undefined | null;

/** Roles a developer account can switch itself into for testing. */
export const TEST_ROLES = ["buyer", "seller", "agent", "admin", "developer"] as const;
export type TestRole = (typeof TEST_ROLES)[number];

export function isDeveloperAccount(claims: ClaimSet): boolean {
  return claims?.developer === true || claims?.role === "developer";
}

/** The role the account currently acts with (what the rules see), or null if none is set. */
export function actingRole(claims: ClaimSet): string | null {
  return typeof claims?.role === "string" && claims.role ? claims.role : null;
}

/**
 * The account's real role: "developer" for a developer account whatever it is
 * testing as, otherwise the claim. This is what the console lists and compares
 * against the profile mirror.
 */
export function accountRole(claims: ClaimSet): string | null {
  return isDeveloperAccount(claims) ? "developer" : actingRole(claims);
}

/** The role a developer account is testing as, or null when it is working as itself. */
export function testingAs(claims: ClaimSet): string | null {
  if (!isDeveloperAccount(claims)) return null;
  const role = actingRole(claims);
  return role && role !== "developer" ? role : null;
}

/**
 * Claims for setting an account's real role from the console or a script.
 * Making an account a developer adds the flag; giving a developer any other
 * role removes it, so it stops being a developer rather than "testing" forever.
 */
export function claimsForRole(existing: ClaimSet, role: string): Record<string, unknown> {
  const rest: Record<string, unknown> = { ...(existing ?? {}) };
  delete rest.developer;
  return role === "developer" ? { ...rest, role: "developer", developer: true } : { ...rest, role };
}
