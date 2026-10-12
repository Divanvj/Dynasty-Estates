import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Guards the invariant that broke the publish path: the list of publicly
// readable listing statuses exists in two files that cannot import each other —
// src/lib/types/domain.ts and firestore.rules. When they drifted, the catalogue
// query asked Firestore for statuses the rules did not permit, the whole query
// was denied, and the site silently served demo data instead.
//
// This reads both real files rather than re-declaring their contents, so it fails
// if either side is edited alone. A behavioural test of the rules themselves
// needs @firebase/rules-unit-testing and the Firestore emulator; that belongs
// with the wider test-runner work.

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");

const domainSource = readFileSync(join(appRoot, "src/lib/types/domain.ts"), "utf8");
const rulesSource = readFileSync(join(appRoot, "firestore.rules"), "utf8");

function parseTsStringArray(source, constName) {
  const match = source.match(new RegExp(`${constName}\\s*=\\s*\\[([^\\]]*)\\]`));
  assert.ok(match, `Could not find ${constName} in domain.ts`);
  return match[1]
    .split(",")
    .map((entry) => entry.trim().replace(/^["']|["'],?$/g, ""))
    .filter(Boolean);
}

// Test 1: the two public-status lists are identical.
const domainPublic = parseTsStringArray(domainSource, "PUBLIC_LISTING_STATUSES");

const rulesMatch = rulesSource.match(/function publicStatuses\(\)\s*\{\s*return \[([^\]]*)\]/);
assert.ok(rulesMatch, "Could not find publicStatuses() in firestore.rules");
const rulesPublic = rulesMatch[1]
  .split(",")
  .map((entry) => entry.trim().replace(/^['"]|['"],?$/g, ""))
  .filter(Boolean);

assert.deepEqual(
  rulesPublic,
  domainPublic,
  `firestore.rules publicStatuses() [${rulesPublic}] must match PUBLIC_LISTING_STATUSES [${domainPublic}]`,
);
console.log(`✓ Test 1 Passed: rules and domain agree on public statuses (${domainPublic.join(", ")})`);

// Test 2: everything the catalogue queries for is publicly readable. If a status
// is in the search query but not in the rules, that query is denied outright.
const activeStatuses = parseTsStringArray(domainSource, "ACTIVE_CATALOGUE_STATUSES");
for (const status of activeStatuses) {
  assert.ok(
    domainPublic.includes(status),
    `"${status}" is queried by the catalogue but is not publicly readable`,
  );
}
console.log(`✓ Test 2 Passed: every catalogue status is publicly readable (${activeStatuses.join(", ")})`);

// Test 3: approving a listing must land on a publicly readable status. Approval
// used to write "Approved", which is not public, so an approved listing stayed
// invisible to every visitor.
const moderationSource = readFileSync(join(appRoot, "src/lib/moderation.ts"), "utf8");
const approvedBranch = moderationSource.match(/case "Approved":\s*return "([^"]+)"/);
assert.ok(approvedBranch, "Could not find the Approved branch in statusForDecision()");
assert.ok(
  domainPublic.includes(approvedBranch[1]),
  `Approval writes "${approvedBranch[1]}", which is not in PUBLIC_LISTING_STATUSES — an approved listing would stay invisible`,
);
console.log(`✓ Test 3 Passed: approval writes "${approvedBranch[1]}", which the public can read`);

// Test 4: marketing labels must not leak back into the status vocabulary.
const marketingLabels = ["Live", "Featured", "New listing", "Move-in ready", "Hot property", "Open house"];
for (const label of marketingLabels) {
  assert.ok(
    !domainPublic.includes(label),
    `"${label}" is a display tag, not a lifecycle status — it must not appear in PUBLIC_LISTING_STATUSES`,
  );
  assert.ok(
    !rulesPublic.includes(label),
    `"${label}" is a display tag, not a lifecycle status — it must not appear in firestore.rules`,
  );
}
console.log("✓ Test 4 Passed: no marketing labels in the status vocabulary");

// Test 5: an owner must not be able to publish their own listing.
const ownerSettable = parseTsStringArray(domainSource, "OWNER_SETTABLE_STATUSES");
for (const status of ownerSettable) {
  assert.ok(
    !domainPublic.includes(status),
    `Owners may set "${status}", which is publicly readable — that lets a seller publish without moderation`,
  );
}
console.log(`✓ Test 5 Passed: owners cannot self-publish (may set: ${ownerSettable.join(", ")})`);

console.log("\nAll listing-status tests passed.");
