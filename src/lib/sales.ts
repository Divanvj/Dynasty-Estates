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
 * recorded sale but are shown only from MIN_SALES upward, rounded into bands,
 * with the number of sales itself given only as a band, so no single home's
 * private price can be worked out from them (audit item 2.10). With three
 * sales the median *was* one buyer's exact price, and an exact count going up
 * by one showed when a sale had just been added.
 *
 * Not Deeds Office or Lightstone data. A paid feed can later write the same
 * records with another `source`.
 */

export type SaleKind = "sale" | "rental";
export const MIN_SALES = 5;
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
  /** Whether any sale matches the filter in the last SALES_MONTHS. */
  hasSales: boolean;
  /**
   * How many match, as a band (countBand): never the exact number, which
   * would change by one the moment a sale is recorded.
   */
  countBand: string;
  /** Null below MIN_SALES. Every figure is banded (bandAmount, bandDays, bandRatio). */
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

/**
 * A rand figure rounded to two significant figures: R 1 234 567 becomes
 * R 1 200 000, a rent of R 12 345 becomes R 12 000. Coarse enough that no one
 * sale's price can be read back from a median, fine enough to compare areas.
 */
export function bandAmount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const step = 10 ** Math.max(0, Math.floor(Math.log10(value)) - 1);
  return Math.round(value / step) * step;
}

/** Days on the market, to the nearest five. */
export function bandDays(days: number): number {
  if (!Number.isFinite(days) || days <= 0) return 0;
  return Math.round(days / 5) * 5;
}

/** Sold ÷ asking, to the nearest whole percent (0.9634 becomes 0.96). */
export function bandRatio(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 0;
  return Math.round(ratio * 100) / 100;
}

/** How many sales, as words for a band: "none", "fewer than 5", "5–9", "10–19", "20–49", "50 or more". */
export function countBand(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "none";
  if (count < MIN_SALES) return `fewer than ${MIN_SALES}`;
  if (count < 10) return `${MIN_SALES}–9`;
  if (count < 20) return "10–19";
  if (count < 50) return "20–49";
  return "50 or more";
}

export function median(values: number[]): number | null {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
