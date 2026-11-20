// S1-7: the sign-in return path must stay on this site.
// Run: node tests/return-path.test.mjs   (Node 24 strips the TypeScript types)
import assert from "node:assert/strict";

import { authHref, safeReturnPath } from "../src/lib/return-path.ts";

const allowed = {
  "/property/clifftop-villa": "/property/clifftop-villa",
  "/search?listingType=sale&intent=buy": "/search?listingType=sale&intent=buy",
  "/alerts#top": "/alerts#top",
  "/": "/",
};
for (const [input, expected] of Object.entries(allowed)) assert.equal(safeReturnPath(input), expected, input);

const refused = [
  null, undefined, "", "   ",
  "https://evil.example/phish", "http://evil.example", "//evil.example/x", "/\\evil.example", "\\\\evil.example",
  "javascript:alert(1)", "evil.example/x", "property/x",
  "/auth/login", "/auth/signup?next=/x", "/auth",
  "/x\n/y", "/" + "a".repeat(600),
];
for (const input of refused) assert.equal(safeReturnPath(input), null, String(input));

// Percent-encoded slashes stay an (unknown) path on this site, never another host.
for (const input of ["/%2F%2Fevil.example", "/%5Cevil.example"]) {
  const out = safeReturnPath(input);
  assert.ok(out && out.startsWith("/") && !out.startsWith("//") && new URL(out, "https://dynasty.test").host === "dynasty.test", input);
}

assert.equal(authHref("/property/a?b=1"), "/auth/login?next=%2Fproperty%2Fa%3Fb%3D1");
assert.equal(authHref("/"), "/auth/login");
assert.equal(authHref("https://evil.example"), "/auth/login");
assert.equal(authHref("/saved", "/auth/signup"), "/auth/signup?next=%2Fsaved");
console.log(`return-path: ${Object.keys(allowed).length + refused.length + 4} checks passed`);
