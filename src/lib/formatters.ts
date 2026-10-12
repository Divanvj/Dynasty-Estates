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
