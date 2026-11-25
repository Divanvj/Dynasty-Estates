// Audit item 2.10: public area sales figures must not let anyone work out a
// single sale's price. Run: node tests/sales-figures.test.mjs
// (Node 24 strips the TypeScript types.)
import assert from "node:assert/strict";

import { bandAmount, bandDays, bandRatio, countBand, median, MIN_SALES } from "../src/lib/sales.ts";

// At least five sales before any figure is shown. With three, the median was
// the middle buyer's exact price.
assert.equal(MIN_SALES, 5);

// Two significant figures.
assert.equal(bandAmount(1_234_567), 1_200_000);
assert.equal(bandAmount(1_250_000), 1_300_000);
assert.equal(bandAmount(845_000), 850_000);
assert.equal(bandAmount(12_345), 12_000);
assert.equal(bandAmount(23_456), 23_000);
assert.equal(bandAmount(9_999_999), 10_000_000);
assert.equal(bandAmount(95), 95);
for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) assert.equal(bandAmount(bad), 0, String(bad));

// A median of five or more, once banded, no longer equals any one sale's price.
const prices = [1_180_000, 1_215_500, 1_234_567, 1_260_000, 1_310_000];
const shown = bandAmount(median(prices));
assert.equal(shown, 1_200_000);
assert.ok(!prices.includes(shown), "the banded median must not be one buyer's price");

// Days to the nearest five; ratio to the nearest whole percent.
assert.equal(bandDays(33), 35);
assert.equal(bandDays(32), 30);
assert.equal(bandDays(0), 0);
assert.equal(bandRatio(0.9634), 0.96);
assert.equal(bandRatio(1.004), 1);
assert.equal(bandRatio(Number.NaN), 0);

// The count is only ever a band, so one more sale doesn't show as count + 1.
assert.equal(countBand(0), "none");
for (const n of [1, 2, 3, 4]) assert.equal(countBand(n), "fewer than 5", String(n));
for (const n of [5, 6, 9]) assert.equal(countBand(n), "5–9", String(n));
assert.equal(countBand(10), "10–19");
assert.equal(countBand(19), "10–19");
assert.equal(countBand(20), "20–49");
assert.equal(countBand(49), "20–49");
assert.equal(countBand(50), "50 or more");
assert.equal(countBand(Number.NaN), "none");

console.log("sales-figures: ok");
