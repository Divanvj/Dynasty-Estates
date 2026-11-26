"use client";

import { useEffect } from "react";

import { type SearchIntent, rememberIntent } from "@/lib/search-intent";

/**
 * Placed on the For Sale and To Rent landing pages: opening one is choosing
 * that side, so the home page and the catalogue follow it. Renders nothing.
 */
export default function RememberIntent({ intent }: { intent: SearchIntent }) {
  useEffect(() => {
    rememberIntent(intent);
  }, [intent]);
  return null;
}
