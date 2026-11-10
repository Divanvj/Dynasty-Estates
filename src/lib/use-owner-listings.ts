"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";

import { getSellerListings, type SellerListing } from "./seller-listings";

export type LoadState = "loading" | "ready" | "error";

/**
 * The signed-in account as the agent console needs it: undefined while auth
 * is resolving, null when signed out, otherwise the uid.
 */
export function useAccountUid(): string | null | undefined {
  const { user, loading } = useAuth();
  if (loading) return undefined;
  return user?.uid ?? null;
}

/** Listings the signed-in account filed (ownerId == uid). */
export function useOwnerListings(uid: string | null | undefined) {
  // Tagged with the uid it was loaded for, so a role switch never shows stale rows.
  const [loaded, setLoaded] = useState<{ uid: string; items: SellerListing[]; failed: boolean } | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getSellerListings(uid)
      .then((items) => {
        if (!cancelled) setLoaded({ uid, items, failed: false });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Could not load this account's listings:", error);
        setLoaded({ uid, items: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const current = uid && loaded?.uid === uid ? loaded : null;
  const state: LoadState = uid === null ? "ready" : !current ? "loading" : current.failed ? "error" : "ready";
  return { items: current?.items ?? [], state };
}
