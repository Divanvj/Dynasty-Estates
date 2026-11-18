/**
 * Universal, deterministic currency and number formatters.
 * Avoids Node.js vs Browser ICU locale mismatches (e.g., non-breaking space '18\u00a0350' vs comma '18,350')
 * that trigger React SSR hydration errors.
 */

export function formatNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return "0";
  const num = typeof val === "string" ? parseFloat(val.replace(/[^0-9.-]+/g, "")) : val;
  if (isNaN(num) || !isFinite(num)) return "0";
  const rounded = Math.round(num);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatZAR(val: number | string | null | undefined): string {
  return `R ${formatNumber(val)}`;
}

/**
 * The whole rands of a typed amount, ignoring "R", spaces and commas. Only a
 * point starts cents ("2500000.00"); a comma never does, or deleting a digit
 * from "R 2,500" would leave "R 2,50" and read as R 2.
 */
function priceDigits(raw: string): string {
  return raw.replace(/\.\d*\D*$/, "").replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
}

/**
 * A money field as the person types: "2500000" becomes "R 2,500,000", so
 * nobody has to type the R or the commas (owner request, 18 Nov). Empty stays
 * empty so the placeholder shows.
 */
export function formatPriceInput(raw: string): string {
  const digits = priceDigits(raw);
  return digits ? `R ${formatNumber(digits)}` : "";
}

/**
 * A listing price for display. Prices are stored as the text the lister
 * typed, so the for-sale cards showed "2500000" or "R2 500 000" next to the
 * seeded "R 4,850,000". Every amount now renders the same way; rentals get
 * " / month". Text with no digits ("Price on request", "POA") is kept as is.
 */
export function formatListingPrice(raw: unknown, listingType?: string): string {
  const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim() : "";
  if (!text) return "Price on request";
  const digits = priceDigits(text);
  if (!digits || Number(digits) === 0) return text;
  return `R ${formatNumber(digits)}${listingType === "rent" ? " / month" : ""}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * A date as "2 Nov 2026".
 *
 * `toLocaleDateString()` turns one value into "02/11/2026" for a British
 * reader and "11/2/2026" for an American one. That is two problems at once:
 * the server and the browser can resolve different locales and disagree,
 * which is the hydration hazard this module exists to prevent, and a reader
 * faced with "02/11/2026" cannot tell which of the two orderings they are
 * looking at. Spelling the month settles both.
 *
 * The offset is applied by hand rather than through a time zone name so the
 * result cannot depend on the host's clock: a server in UTC and a phone in
 * Johannesburg produce the same string for the same instant.
 */
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000; // South Africa is UTC+2 all year; it has no daylight saving.

export function formatDate(isoOrDate: string | Date | number | null | undefined): string {
  if (!isoOrDate) return "";
  const parsed = new Date(isoOrDate);
  if (isNaN(parsed.getTime())) return "";
  const d = new Date(parsed.getTime() + SAST_OFFSET_MS);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * A date and time as "2 Nov 2026, 14:05", South African time. It used to
 * print "2026-11-02 12:05 UTC", which made an agent convert every enquiry's
 * time in their head. Same hand-applied offset as `formatDate`, for the same
 * reason.
 */
export function formatDateTime(isoOrDate: string | Date | number | null | undefined): string {
  if (!isoOrDate) return "";
  const parsed = new Date(isoOrDate);
  if (isNaN(parsed.getTime())) return "";
  const d = new Date(parsed.getTime() + SAST_OFFSET_MS);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(parsed)}, ${hh}:${mm}`;
}
