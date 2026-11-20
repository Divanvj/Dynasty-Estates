// S1-8: a live listing may only move between Published and Under offer.
// Run: node tests/listing-status.test.mjs   (Node 24 strips the TypeScript types)
import assert from "node:assert/strict";

import { isMarketStatus, MARKET_STATUS_MOVE, MARKET_STATUSES, nextMarketStatus } from "../src/lib/listing-status.ts";

// The two statuses point at each other, so one control serves both directions.
assert.equal(nextMarketStatus("Published"), "Under offer");
assert.equal(nextMarketStatus("Under offer"), "Published");

// Nothing else is on the market, so the portals offer no move at all. A draft
// must not reach a publicly readable status this way, and a sold listing is
// reopened by undoing its sale, not by this route.
for (const status of ["Draft", "Submitted", "Needs changes", "Approved", "Sold", "Rented", "Paused", "Archived", "", "published", "UNDER OFFER", "Under  offer"]) {
  assert.equal(nextMarketStatus(status), null, status);
}

// What the route accepts as a request.
for (const status of MARKET_STATUSES) assert.equal(isMarketStatus(status), true, status);
for (const status of [null, undefined, "", "Draft", "Sold", "published", 1, {}, ["Published"]]) {
  assert.equal(isMarketStatus(status), false, String(status));
}

// Every move a portal can ask for has its wording, so no state renders a blank
// button or an empty confirmation.
for (const status of MARKET_STATUSES) {
  const copy = MARKET_STATUS_MOVE[status];
  for (const key of ["button", "title", "body", "confirm"]) {
    assert.equal(typeof copy[key], "string", `${status}.${key}`);
    assert.ok(copy[key].trim().length > 0, `${status}.${key} is empty`);
  }
}

console.log("listing-status: ok");
