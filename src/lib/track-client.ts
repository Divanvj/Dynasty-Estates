import type { ListingEvent } from "./listing-stats";

/**
 * Browser side of listing statistics: tells /api/track that a listing was
 * viewed, saved or contacted. Fire-and-forget — a failed count never shows the
 * visitor an error. A view is sent once per listing per browser session (the
 * server also ignores repeats from the same address for 30 minutes).
 */

const SESSION_KEY = "dynasty_tracked_views";

function alreadyViewed(listingId: string): boolean {
  try {
    const seen: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]");
    if (Array.isArray(seen) && seen.includes(listingId)) return true;
    const next = [...(Array.isArray(seen) ? seen : []), listingId].slice(-200);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // Private mode or blocked storage: fall back to the server's own throttle.
  }
  return false;
}

export function trackListing(listingId: string, event: ListingEvent): void {
  if (typeof window === "undefined" || !listingId) return;
  if (event === "view" && alreadyViewed(listingId)) return;
  const body = JSON.stringify({ listingId, event });
  try {
    // sendBeacon survives the page unloading (a contact link opens WhatsApp).
    const sent = navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Counting must never become an error the visitor sees.
  }
}
