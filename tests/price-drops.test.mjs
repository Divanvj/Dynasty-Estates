// S1-10: which price changes are worth an e-mail.
// Run: node tests/price-drops.test.mjs   (Node 24 strips the TypeScript types)
import assert from "node:assert/strict";

import { dropPercent, dropReasonLabel, materialDrop, MIN_DROP_FRACTION, priceNumber } from "../src/lib/price-drops.ts";

// Asking prices are strings on the listing document.
assert.equal(priceNumber("R 2 450 000"), 2450000);
assert.equal(priceNumber("R2,450,000"), 2450000);
assert.equal(priceNumber("R 18 500 / month"), 18500);
assert.equal(priceNumber(2450000), 2450000);
assert.equal(priceNumber(2450000.4), 2450000);

// No figure to compare: "Price on request", empty, rubbish, zero, negative.
for (const raw of ["Price on request", "", "   ", "R", null, undefined, 0, -5, {}, []]) {
  assert.equal(priceNumber(raw), 0, JSON.stringify(raw));
}

// A real cut.
assert.deepEqual(materialDrop(2_450_000, 2_200_000), { from: 2_450_000, to: 2_200_000, percent: 10 });
assert.deepEqual(materialDrop(18_500, 17_000), { from: 18_500, to: 17_000, percent: 8 });

// Rounding the asking price down by a hair is not news.
assert.equal(materialDrop(2_450_000, 2_449_000), null);
assert.equal(materialDrop(2_450_000, 2_450_000), null);
// Exactly on the threshold counts; a rand under it does not.
assert.notEqual(materialDrop(1_000_000, 990_000), null);
assert.equal(materialDrop(1_000_000, 990_001), null);
assert.equal(MIN_DROP_FRACTION, 0.01);

// A price going up is never an alert.
assert.equal(materialDrop(2_200_000, 2_450_000), null);

// "Price on request" must not read as a drop to nothing, or a rise from it.
assert.equal(materialDrop(2_450_000, 0), null);
assert.equal(materialDrop(0, 2_450_000), null);
assert.equal(materialDrop(0, 0), null);

// Percentages are whole numbers, and nonsense input is 0 rather than NaN.
assert.equal(dropPercent(1_000_000, 875_000), 13);
assert.equal(dropPercent(1_000_000, 1_000_000), 0);
assert.equal(dropPercent(0, 100), 0);
assert.equal(dropPercent(100, 0), 0);

// Why the person is hearing about it.
assert.equal(dropReasonLabel("saved"), "You saved this home");
assert.equal(dropReasonLabel("search", "3 bed houses in Camps Bay"), "Matches your search: 3 bed houses in Camps Bay");
assert.equal(dropReasonLabel("search"), "Matches a search you saved");

console.log("price-drops: ok");
