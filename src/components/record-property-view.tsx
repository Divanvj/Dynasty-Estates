"use client";

import { useEffect } from "react";

import { recordPropertyView } from "@/lib/recently-viewed";

/**
 * Records that this property was viewed. Renders nothing.
 *
 * Kept as its own component so the property page can stay a Server Component —
 * only this leaf needs to be client-side.
 */
export default function RecordPropertyView({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    recordPropertyView(propertyId);
  }, [propertyId]);

  return null;
}
