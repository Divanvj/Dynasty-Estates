// Tests for src/lib/cleanup-guard.ts (audit item 1.8): the nightly listing-file
// clean-up must refuse to run when its numbers look like a bad read.
import assert from "node:assert/strict";

import { cleanupVerdict, MAX_DELETE_SHARE, MIN_FILES_FOR_SHARE_CHECK } from "../src/lib/cleanup-guard.ts";

// An ordinary night: most files are in use, a few old orphans go.
assert.deepEqual(cleanupVerdict({ listings: 40, referenced: 300, scanned: 320, matched: 300, candidates: 12 }), { ok: true });

// An empty project, or a new one: nothing to compare, nothing wrong.
assert.deepEqual(cleanupVerdict({ listings: 0, referenced: 0, scanned: 0, matched: 0, candidates: 0 }), { ok: true });

// Listings were read but none referred to a file: every file would look unused.
const noPaths = cleanupVerdict({ listings: 40, referenced: 0, scanned: 320, matched: 0, candidates: 320 });
assert.equal(noPaths.ok, false);
assert.match(noPaths.reason, /none referred to a file/);

// Paths were read, but none matches a file in the bucket (wrong bucket, new URL format).
const noMatch = cleanupVerdict({ listings: 40, referenced: 300, scanned: 320, matched: 0, candidates: 20 });
assert.equal(noMatch.ok, false);
assert.match(noMatch.reason, /bucket or the download-URL format/);

// More than half of all files in one night: held back...
const tooMany = cleanupVerdict({ listings: 40, referenced: 100, scanned: 320, matched: 100, candidates: 200 });
assert.equal(tooMany.ok, false);
assert.match(tooMany.reason, /200 of 320 files \(63%\)/);

// ...but not for a handful of files in a small bucket.
assert.deepEqual(cleanupVerdict({ listings: 2, referenced: 4, scanned: 10, matched: 4, candidates: MIN_FILES_FOR_SHARE_CHECK - 11 }), { ok: true });

// Exactly at the limit is allowed; just over is not.
assert.deepEqual(cleanupVerdict({ listings: 10, referenced: 50, scanned: 100, matched: 50, candidates: 100 * MAX_DELETE_SHARE }), { ok: true });
assert.equal(cleanupVerdict({ listings: 10, referenced: 49, scanned: 100, matched: 49, candidates: 100 * MAX_DELETE_SHARE + 1 }).ok, false);

console.log("cleanup-guard: ok");
