const STORAGE_KEY = "dynasty_recently_viewed";
const MAX_ENTRIES = 8;
/** Fired after a write so any mounted component can re-read without polling. */
export const RECENTLY_VIEWED_EVENT = "dynasty_recently_viewed_change";

/**
 * The visitor's own recent property views, kept in their browser.
 *
 * Deliberately not a recommendation engine. It is the viewer's actual history,
 * which is honest about what it is and needs no model, no server and no profile
 * — and every read is wrapped because localStorage throws in private mode and
 * returns nothing when site data is cleared.
 */
export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Records a view, most recent first, without duplicating an existing entry. */
export function recordPropertyView(propertyId: string): void {
  if (typeof window === "undefined" || !propertyId) return;
  try {
    const next = [propertyId, ...getRecentlyViewed().filter((id) => id !== propertyId)].slice(
      0,
      MAX_ENTRIES,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  } catch {
    // Storage unavailable; the feature degrades to its fallback and nothing else
    // on the page depends on it.
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(RECENTLY_VIEWED_EVENT));
  } catch {
    // No-op.
  }
}
