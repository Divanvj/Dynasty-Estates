"use client";

import { useSyncExternalStore } from "react";

export type UserRole = "Buyer" | "Seller" | "Agent" | "Admin" | "Developer";

/**
 * The active role is derived from the signed-in account, never chosen by the
 * visitor. Only the auth layer (sign-in / sign-out / profile sync) may write it
 * via setActiveUserRole; anonymous visitors always resolve to "Buyer".
 *
 * This is a *mirror*, not an authority. The authority is the Firebase custom
 * claim, which `resolveUserRole` in src/lib/auth.ts reads and which the
 * Firestore rules test as `request.auth.token.role`. What is kept here is a
 * copy, so the UI can render the right chrome without an async claim read on
 * every component. Treating it as permission would be a mistake: a claim cannot
 * be forged, a localStorage value can.
 */

/**
 * What an account may do. Derived from the role rather than asked for, because
 * in South Africa the distinction is a legal one — under the Property
 * Practitioners Act a person may not act as a property practitioner without a
 * valid Fidelity Fund Certificate, so "agency" is a verified status and cannot
 * be a preference a visitor selects.
 */
export type Capability = "sell" | "agency" | "admin" | "console";

/**
 * What this account may do. Deliberately mirrors the guard on each route, so the
 * menu offers exactly what the page will admit — change one and change the
 * other, or the two drift and the menu starts advertising locked doors.
 *
 * Takes the signed-in flag as well as the role because the role alone cannot
 * answer it: selling privately is open to anyone with an account, so "sell"
 * turns on authentication rather than on a claim.
 */
export function accountCan(
  capability: Capability,
  account: { role: UserRole; signedIn: boolean }
): boolean {
  // Nothing is offered to a visitor who has not signed in. Every one of these
  // ends in a Firestore write keyed to request.auth.uid, which would be denied.
  if (!account.signedIn) return false;

  switch (capability) {
    case "sell":
      // Any account, not only one carrying a seller claim. Listing privately
      // needs no licence, and firestore.rules already agrees: its /properties
      // create rule admits any signed-in user filing a Draft or Submitted
      // listing they own, reserving the published states for practitioners.
      // The UI was the only thing being stricter than the data layer.
      return true;
    case "agency":
      // A regulated status. See the note on Capability above.
      return account.role === "Agent" || account.role === "Admin";
    case "admin":
      return account.role === "Admin";
    case "console":
      // The developer console (/console). A platform role, not a moderation
      // one: developers get the console but not /admin. Admins get both. The
      // console's API routes re-check the claim server-side; this only decides
      // whether the menu offers the link.
      return account.role === "Developer" || account.role === "Admin";
    default:
      return false;
  }
}

const ROLE_STORAGE_KEY = "dynasty_active_role";
const ROLE_EVENT_NAME = "dynasty_role_change";

export function getActiveUserRole(): UserRole {
  if (typeof window === "undefined") return "Buyer";
  try {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    if (
      stored === "Buyer" ||
      stored === "Seller" ||
      stored === "Agent" ||
      stored === "Admin" ||
      stored === "Developer"
    ) {
      return stored;
    }
  } catch {
    return "Buyer";
  }
  return "Buyer";
}

export function setActiveUserRole(role: UserRole): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // Continue if storage is restricted
  }
  window.dispatchEvent(new CustomEvent(ROLE_EVENT_NAME, { detail: role }));
  window.dispatchEvent(new Event("storage"));
}

function subscribeRole(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(ROLE_EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(ROLE_EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

function getRoleSnapshot(): UserRole {
  return getActiveUserRole();
}

function getServerRoleSnapshot(): UserRole {
  return "Buyer";
}

const emptySubscribe = () => () => {};

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * The role alone. Capabilities need the auth state too, so compose this with
 * `useAuth()` and `accountCan` at the call site — this module deliberately does
 * not import the auth provider, which imports it.
 */
export function useUserRole(): {
  role: UserRole;
  isMounted: boolean;
} {
  // Before hydration every visitor reads as "Buyer", which is the safe default:
  // the server snapshot carries no privileges, so nothing gated is rendered into
  // the HTML and then taken away a frame later.
  const role = useSyncExternalStore(subscribeRole, getRoleSnapshot, getServerRoleSnapshot);
  const isMounted = useIsMounted();

  return { role, isMounted };
}

