"use client";

import { useSyncExternalStore } from "react";

export type UserRole = "Buyer" | "Seller" | "Agent" | "Admin";

/**
 * The active role is derived from the signed-in account, never chosen by the
 * visitor. Only the auth layer (sign-in / sign-out / profile sync) may write it
 * via setActiveUserRole; anonymous visitors always resolve to "Buyer".
 */

const ROLE_STORAGE_KEY = "dynasty_active_role";
const ROLE_EVENT_NAME = "dynasty_role_change";

export function getActiveUserRole(): UserRole {
  if (typeof window === "undefined") return "Buyer";
  try {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    if (stored === "Buyer" || stored === "Seller" || stored === "Agent" || stored === "Admin") {
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

export function useUserRole(): {
  role: UserRole;
  isMounted: boolean;
} {
  const role = useSyncExternalStore(subscribeRole, getRoleSnapshot, getServerRoleSnapshot);
  const isMounted = useIsMounted();

  return { role, isMounted };
}

