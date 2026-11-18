/**
 * Sold prices recorded on Dynasty Estates (owner decision 2026-11-19): the
 * listing's agent or private seller marks it Sold or Rented with the price and
 * date. Shared by the browser and the server, so nothing here imports Firebase.
 *
 * Where it lives:
 *   sales/{listingId}       the full record, price always — server only (Admin
 *                           SDK; no client rule), read through /api routes.
 *   properties/{id}.sale    { soldOn, price? } on the public listing; `price`
 *                           only when the seller agreed to show it.
 * Area figures (median sold price, sold vs asking, days to sell) count every
 * recorded sale but are shown only from MIN_SALES upward, so no single
 * home's private price can be worked out from them.
 *
 * Not Deeds Office or Lightstone data. A paid feed can later write the same
 * records with another `source`.
 */

export type SaleKind = "sale" | "rental";
export const MIN_SALES = 3;
/** Area figures look back this far. */
export const SALES_MONTHS = 12;

export type SaleInput = {
  /** Rand: the selling price, or the monthly rent for a rental. */
  price: number;
  /** "YYYY-MM-DD": the day the offer was accepted (or the lease signed). */
  soldOn: string;
  /** The seller (or landlord) agreed the price may be shown on the listing. */
  pricePublic: boolean;
};

/** What the owner sees about their own recorded sale. */
export type SaleRecord = SaleInput & {
  listingId: string;
  kind: SaleKind;
  askingPrice: number | null;
  daysOnMarket: number | null;
  recordedAt: string;
};

/** One sale whose price may be shown, for the lists on the market page and report. */
export type PublicSale = {
  listingId: string;
  title: string;
  location: string;
  type: string;
  beds: number;
  price: number;
  soldOn: string;
};

export type SalesSummary = {
  kind: SaleKind;
  /** Every recorded sale matching the filter in the last SALES_MONTHS. */
  count: number;
  /** Null below MIN_SALES. */
  figures: {
    medianPrice: number;
    /** Median of sold ÷ asking, e.g. 0.96; null when fewer than MIN_SALES had an asking price. */
    medianRatio: number | null;
    /** Median days from going live to the sale; null when fewer than MIN_SALES had both dates. */
    medianDays: number | null;
    medianPerSqm: number | null;
  } | null;
  /** Newest first, at most 20; only prices the seller agreed to show. */
  publicSales: PublicSale[];
};

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Words for a kind of sale: "Sold" / "Rented", "selling price" / "monthly rent". */
export function saleWords(kind: SaleKind) {
  return kind === "rental"
    ? { status: "Rented", verb: "rented", mark: "Mark as rented", price: "Monthly rent", agreed: "The landlord agreed to show the rent on the listing" }
    : { status: "Sold", verb: "sold", mark: "Mark as sold", price: "Selling price", agreed: "The seller agreed to show the price on the listing" };
}

export function median(values: number[]): number | null {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
