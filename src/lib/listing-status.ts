import type { ListingLifecycleStatus } from "./types/domain";

/**
 * S1-8 — "Under offer" and back to live.
 *
 * A listing that is on the market sits in one of two statuses: `Published`
 * (openly for sale or to rent) and `Under offer` (an offer is in, the home is
 * still listed and still searchable — see ACTIVE_CATALOGUE_STATUSES). Moving
 * between them is the only status change a portal offers on a live listing;
 * closing it is the sale panel's job (lib/sales.ts) and publishing is a
 * moderator's.
 *
 * Why this goes through /api/listings/[id]/status rather than a client write:
 * `Under offer` is a public status, and firestore.rules lets a listing's own
 * owner write only Draft / Submitted / Paused / Archived. Widening that would
 * also let an owner move an unmoderated Draft straight into a publicly
 * readable status, so the server makes the move instead, checks the transition
 * and files an audit entry. Agents could write it directly under the rules;
 * they use the same route so both portals behave identically.
 */

export const MARKET_STATUSES = ["Published", "Under offer"] as const satisfies readonly ListingLifecycleStatus[];

export type MarketStatus = (typeof MARKET_STATUSES)[number];

export function isMarketStatus(value: unknown): value is MarketStatus {
  return typeof value === "string" && (MARKET_STATUSES as readonly string[]).includes(value);
}

/**
 * The move a portal may ask for from `current`, or null when the listing is
 * not on the market (a draft, or already sold) and cannot move at all.
 */
export function nextMarketStatus(current: string): MarketStatus | null {
  if (current === "Published") return "Under offer";
  if (current === "Under offer") return "Published";
  return null;
}

/** What each move is called and what it does, in one place for both portals. */
export const MARKET_STATUS_MOVE: Record<MarketStatus, { button: string; title: string; body: string; confirm: string }> = {
  "Under offer": {
    button: "Mark as under offer",
    title: "Mark this listing as under offer?",
    body: "Buyers see an “Under offer” label on the listing and in search. It stays listed and enquiries still reach you, so you can fall back on them if the offer fails.",
    confirm: "Mark as under offer",
  },
  Published: {
    button: "Back on the market",
    title: "Put this listing back on the market?",
    body: "The “Under offer” label comes off and the listing reads as openly available again.",
    confirm: "Back on the market",
  },
};
