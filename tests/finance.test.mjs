// Audit item 2.3: one finance module, and transfer duty that matches the SARS
// table at every bracket edge. Run: node tests/finance.test.mjs
// (Node 24 strips the TypeScript types.)
import assert from "node:assert/strict";

import {
  describeDutyBracket,
  describeDutyRange,
  maxLoanForRepayment,
  monthlyRepayment,
  TRANSFER_DUTY_BRACKETS,
  TRANSFER_DUTY_THRESHOLD,
  transferDuty,
  transferDutyBracket,
  VAT_RATE,
} from "../src/lib/finance.ts";

// The SARS table "2026 (With effect from 1 April 2025)", unchanged for 2027
// (https://www.sars.gov.za/tax-rates/transfer-duty/, checked 25 Nov 2026).
const SARS = [
  // [value, duty]
  [1, 0],
  [1_210_000, 0],
  [1_210_001, 0], // 3% of R1 rounds to R0
  [1_663_800, 13_614],
  [1_663_801, 13_614],
  [2_329_300, 53_544],
  [2_329_301, 53_544],
  [2_994_800, 106_784],
  [2_994_801, 106_784],
  [13_310_000, 1_241_456],
  [13_310_001, 1_241_456],
  // Inside each bracket, worked by hand from the SARS wording.
  [1_500_000, 8_700], // 3% x 290 000
  [2_000_000, 33_786], // 13 614 + 6% x 336 200
  [2_500_000, 67_200], // 53 544 + 8% x 170 700
  [5_000_000, 327_356], // 106 784 + 11% x 2 005 200
  [20_000_000, 2_111_156], // 1 241 456 + 13% x 6 690 000
];
for (const [value, duty] of SARS) assert.equal(transferDuty(value), duty, `duty on R${value}`);

// Each bracket's fixed amount is exactly the duty at the top of the one below,
// so the table has no jumps (a typo in any number would break this).
for (let i = 1; i < TRANSFER_DUTY_BRACKETS.length; i += 1) {
  const below = TRANSFER_DUTY_BRACKETS[i - 1];
  const here = TRANSFER_DUTY_BRACKETS[i];
  assert.equal(here.from, below.to, `bracket ${i} starts where ${i - 1} ends`);
  assert.equal(below.base + (below.to - below.from) * below.rate, here.base, `bracket ${i} base`);
}
assert.equal(TRANSFER_DUTY_THRESHOLD, 1_210_000);
assert.equal(TRANSFER_DUTY_BRACKETS.at(-1).to, null);

// Nonsense in, no duty out.
for (const bad of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) assert.equal(transferDuty(bad), 0, String(bad));

// The wording the calculator shows.
assert.equal(describeDutyBracket(transferDutyBracket(1_000_000)), "0% (no duty up to R 1,210,000)");
assert.equal(describeDutyBracket(transferDutyBracket(1_500_000)), "3% of the value above R 1,210,000");
assert.equal(describeDutyBracket(transferDutyBracket(2_000_000)), "R 13,614 + 6% of the value above R 1,663,800");
assert.equal(describeDutyBracket(transferDutyBracket(50_000_000)), "R 1,241,456 + 13% of the value above R 13,310,000");
assert.equal(describeDutyRange(TRANSFER_DUTY_BRACKETS[0]), "R 0 – R 1,210,000");
assert.equal(describeDutyRange(TRANSFER_DUTY_BRACKETS[1]), "R 1,210,001 – R 1,663,800");
assert.equal(describeDutyRange(TRANSFER_DUTY_BRACKETS[5]), "R 13,310,001 and above");

// Home-loan repayments: R1 000 000 at 12% over 20 years is R11 010.86 a month.
assert.equal(monthlyRepayment(1_000_000, 12, 20), 11_011);
assert.equal(monthlyRepayment(0, 12, 20), 0);
assert.equal(monthlyRepayment(1_000_000, 0, 20), 4_167); // 0%: equal parts
assert.equal(monthlyRepayment(1_000_000, 12, 0), 0);
// The inverse gives the loan back.
assert.ok(Math.abs(maxLoanForRepayment(11_010.86, 12, 20) - 1_000_000) < 1);
assert.equal(maxLoanForRepayment(0, 12, 20), 0);
assert.equal(maxLoanForRepayment(1_000, 0, 10), 120_000);

assert.equal(VAT_RATE, 0.15);

console.log("finance: ok");
