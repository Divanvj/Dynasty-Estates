/**
 * Money maths shared by every calculator on the site (audit item 2.3): SARS
 * transfer duty and home-loan repayments. There used to be three copies of the
 * duty brackets (calculators-view twice, true-cost-calculator once), all
 * wrong: thresholds from before 1 April 2025, no 6% band at all, and fixed
 * amounts (R25 250, R98 250, R1 129 775) that match no SARS table.
 *
 * Pure: no imports, so the browser, the server and the tests
 * (tests/finance.test.mjs) all use the same code.
 */

/** South African VAT, as a fraction. */
export const VAT_RATE = 0.15;

export type DutyBracket = {
  /** Duty is charged on the value above this (rand). */
  from: number;
  /** The top of the bracket, inclusive; null for the last one. */
  to: number | null;
  /** Fixed duty for the brackets below (rand). */
  base: number;
  /** Rate on the value above `from`, as a fraction. */
  rate: number;
};

/**
 * SARS transfer duty, the same for individuals and companies, as published at
 * https://www.sars.gov.za/tax-rates/transfer-duty/ : "2026 (With effect from
 * 1 April 2025)", and listed as "No changes from last year" for 2027 (with
 * effect from 1 April 2026). Checked against that page on 25 November 2026.
 * When SARS publishes a new table (usually with the February budget), change
 * these numbers and TRANSFER_DUTY_TABLE_LABEL, and the bracket-edge tests.
 */
export const TRANSFER_DUTY_BRACKETS: readonly DutyBracket[] = [
  { from: 0, to: 1_210_000, base: 0, rate: 0 },
  { from: 1_210_000, to: 1_663_800, base: 0, rate: 0.03 },
  { from: 1_663_800, to: 2_329_300, base: 13_614, rate: 0.06 },
  { from: 2_329_300, to: 2_994_800, base: 53_544, rate: 0.08 },
  { from: 2_994_800, to: 13_310_000, base: 106_784, rate: 0.11 },
  { from: 13_310_000, to: null, base: 1_241_456, rate: 0.13 },
];

/** Shown next to the calculators so a reader knows which table they are looking at. */
export const TRANSFER_DUTY_TABLE_LABEL = "SARS rates from 1 April 2025 (unchanged from 1 April 2026)";

/** The duty-free threshold: the top of the 0% bracket. */
export const TRANSFER_DUTY_THRESHOLD = TRANSFER_DUTY_BRACKETS[0].to as number;

/** The bracket a property value falls in. */
export function transferDutyBracket(value: number): DutyBracket {
  const price = Number.isFinite(value) && value > 0 ? value : 0;
  return TRANSFER_DUTY_BRACKETS.find((b) => b.to === null || price <= b.to) ?? TRANSFER_DUTY_BRACKETS[0];
}

/** Transfer duty on a property value, to the nearest rand. */
export function transferDuty(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const bracket = transferDutyBracket(value);
  return Math.round(bracket.base + (value - bracket.from) * bracket.rate);
}

/** "R 1,663,800" — the format the calculators already use. */
function rand(value: number): string {
  return `R ${Math.round(value).toLocaleString("en-US")}`;
}

function percent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

/** "R 13,614 + 6% of the value above R 1,663,800", or "0% (no duty up to R 1,210,000)". */
export function describeDutyBracket(bracket: DutyBracket): string {
  if (bracket.rate === 0) return `0% (no duty up to ${rand(bracket.to ?? 0)})`;
  const share = `${percent(bracket.rate)} of the value above ${rand(bracket.from)}`;
  return bracket.base ? `${rand(bracket.base)} + ${share}` : share;
}

/** "R 1,210,001 – R 1,663,800", "R 13,310,001 and above". */
export function describeDutyRange(bracket: DutyBracket): string {
  const low = bracket.from === 0 ? "R 0" : rand(bracket.from + 1);
  return bracket.to === null ? `${low} and above` : `${low} – ${rand(bracket.to)}`;
}

/**
 * The monthly repayment on a home loan (a standard annuity), to the nearest
 * rand. A 0% rate repays the loan in equal parts.
 */
export function monthlyRepayment(loan: number, annualRatePercent: number, years: number): number {
  const months = Math.round(years * 12);
  if (!(loan > 0) || !(months > 0)) return 0;
  const r = annualRatePercent / 100 / 12;
  if (!(r > 0)) return Math.round(loan / months);
  const growth = Math.pow(1 + r, months);
  return Math.round((loan * r * growth) / (growth - 1));
}

/** The largest loan a monthly repayment can carry: the inverse of monthlyRepayment (not rounded). */
export function maxLoanForRepayment(repayment: number, annualRatePercent: number, years: number): number {
  const months = Math.round(years * 12);
  if (!(repayment > 0) || !(months > 0)) return 0;
  const r = annualRatePercent / 100 / 12;
  if (!(r > 0)) return repayment * months;
  const growth = Math.pow(1 + r, months);
  return (repayment * (growth - 1)) / (r * growth);
}
