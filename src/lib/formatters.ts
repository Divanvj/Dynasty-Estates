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

export function formatDateTime(isoOrDate: string | Date | number | null | undefined): string {
  if (!isoOrDate) return "";
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
  } catch {
    return "";
  }
}
