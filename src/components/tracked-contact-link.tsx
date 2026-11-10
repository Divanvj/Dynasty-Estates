"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import { trackListing } from "@/lib/track-client";

/**
 * A plain contact link (WhatsApp, Call) on a listing that also counts one
 * contact click on the owner's statistics. Behaves exactly like an <a>.
 */
export default function TrackedContactLink({
  listingId,
  children,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { listingId: string; children: ReactNode }) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackListing(listingId, "contact");
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
