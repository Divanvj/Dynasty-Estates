// S1-11: the signed link that stops one kind of e-mail, or one saved search.
// Run: node tests/unsubscribe-token.test.mjs   (Node 24 strips the TypeScript types)
import assert from "node:assert/strict";

import { buildUnsubscribeToken, readUnsubscribeToken, searchIdFromTarget, searchTarget } from "../src/lib/unsubscribe-token.ts";

const KEY = "a-test-signing-secret-long-enough";
const OTHER = "a-different-secret-also-long-ok!!";
const UID = "iwbbItRxbIPbhtyDbtNCvY9ZGsn1";
const SEARCH = "Ab12Cd34Ef56Gh78Ij90";

// A preference link stops that preference.
const prefToken = buildUnsubscribeToken(UID, "savedSearchAlerts", KEY);
assert.ok(prefToken);
assert.deepEqual(readUnsubscribeToken(prefToken, KEY), { uid: UID, target: "savedSearchAlerts" });

// A per-search link carries one search and no preference, so nothing else the
// person gets is touched.
const searchToken = buildUnsubscribeToken(UID, searchTarget(SEARCH), KEY);
assert.ok(searchToken);
assert.deepEqual(readUnsubscribeToken(searchToken, KEY), { uid: UID, target: `search-${SEARCH}` });
assert.equal(searchIdFromTarget(`search-${SEARCH}`), SEARCH);
assert.equal(searchIdFromTarget("savedSearchAlerts"), null);

// The two are different links even for the same person.
assert.notEqual(prefToken, searchToken);

// Signed, so neither the person nor the search can be swapped for another.
const [, , sig] = searchToken.split(".");
assert.equal(readUnsubscribeToken(`someoneelse1234.${searchTarget(SEARCH)}.${sig}`, KEY), null);
assert.equal(readUnsubscribeToken(`${UID}.${searchTarget("Zz99Zz99Zz99Zz99Zz99")}.${sig}`, KEY), null);
assert.equal(readUnsubscribeToken(`${UID}.savedSearchAlerts.${sig}`, KEY), null);

// Another secret cannot mint one, and a token does not survive a rotation.
assert.equal(readUnsubscribeToken(buildUnsubscribeToken(UID, "weeklyReports", OTHER), KEY), null);

// Rubbish in, null out — never a throw, never a partial target.
for (const token of ["", ".", "..", "a.b", "a.b.c.d", `${UID}.savedSearchAlerts`, `${UID}..${sig}`, `${UID}.search-.${sig}`, "../../etc/passwd"]) {
  assert.equal(readUnsubscribeToken(token, KEY), null, JSON.stringify(token));
}

// No secret configured: no links are minted, and none are accepted.
assert.equal(buildUnsubscribeToken(UID, "weeklyReports", ""), null);
assert.equal(buildUnsubscribeToken(UID, "weeklyReports", "too-short"), null);
assert.equal(readUnsubscribeToken(prefToken, ""), null);

// A target or uid that is not the right shape is refused outright.
assert.equal(buildUnsubscribeToken(UID, "search-not a valid id", KEY), null);
assert.equal(buildUnsubscribeToken(UID, "", KEY), null);
assert.equal(buildUnsubscribeToken("not a uid", "weeklyReports", KEY), null);

console.log("unsubscribe-token: ok");
