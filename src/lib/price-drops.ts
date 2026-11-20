/**
 * S1-10 — what counts as a price drop worth e-mailing about. No Firebase
 * import: the nightly job (lib/server/price-drops.ts) and the tests share it.
 *
 * A listing's asking price is a string on the document ("R 2 450 000"), so
 * every comparison here is on the rand figure parsed out of it.
 */

/**
 * Smaller cuts are recorded but not e-mailed. An agent rounding R2 450 000
 * down to R2 449 000 has not changed the deal, and a buyer who is alerted for
 * that stops reading the next one. One percent of the asking price is a real
 * move at every price Dynasty lists.
 */
export const MIN_DROP_FRACTION = 0.01;

export type PriceDrop = { from: number; to: number; percent: number };

/** The rand figure in "R 2 450 000", or 0 when there isn't one. */
export function priceNumber(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
  const digits = String(raw ?? "").replace(/[^0-9]/g, "");
  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Whole percent off, rounded to the nearest percent (12.4% → 12). */
export function dropPercent(from: number, to: number): number {
  if (from <= 0 || to <= 0 || to >= from) return 0;
  return Math.round(((from - to) / from) * 100);
}

/**
 * The drop to tell people about, or null. Only downwards, only when both
 * prices are real figures, and only when it is at least MIN_DROP_FRACTION of
 * what it was — "price on request" (0) is not a drop to zero, and a listing
 * that goes from 0 to a real price is not a drop either.
 */
export function materialDrop(from: number, to: number): PriceDrop | null {
  if (from <= 0 || to <= 0 || to >= from) return null;
  if (from - to < from * MIN_DROP_FRACTION) return null;
  return { from, to, percent: dropPercent(from, to) };
}

/** Why this person is being told, shown on each home in the e-mail. */
export type DropReason = "saved" | "search";

export function dropReasonLabel(reason: DropReason, searchLabel?: string): string {
  if (reason === "saved") return "You saved this home";
  return searchLabel ? `Matches your search: ${searchLabel}` : "Matches a search you saved";
}
