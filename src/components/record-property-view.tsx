"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";

import { auth } from "@/lib/firebase";
import { recordPropertyView } from "@/lib/recently-viewed";
import { trackListing } from "@/lib/track-client";

/**
 * Records that this property was viewed. Renders nothing.
 *
 * Two separate records: the visitor's own "recently viewed" list (kept in
 * their browser), and — for listings that have an owner — one anonymous view
 * on the owner's statistics (/api/track). The owner looking at their own
 * listing is not counted.
 *
 * Kept as its own component so the property page can stay a Server Component —
 * only this leaf needs to be client-side.
 */
export default function RecordPropertyView({ propertyId, ownerId }: { propertyId: string; ownerId?: string }) {
  useEffect(() => {
    recordPropertyView(propertyId);
  }, [propertyId]);

  useEffect(() => {
    if (!ownerId) return;
    if (!auth) {
      trackListing(propertyId, "view");
      return;
    }
    // Wait for the first auth answer so the owner's own visit is not counted.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user?.uid !== ownerId) trackListing(propertyId, "view");
    });
    return unsubscribe;
  }, [propertyId, ownerId]);

  return null;
}
