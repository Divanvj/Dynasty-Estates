// Tests for src/lib/json-ld.ts (audit item 1.2): structured data written into
// a <script> block must not be able to close the block.
import assert from "node:assert/strict";

import { jsonLd } from "../src/lib/json-ld.ts";

const BACKSLASH = String.fromCharCode(92);
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

const attack = 'Lovely home</script><script>alert("x")</script><!-- & more';
const listing = { "@type": "RealEstateListing", name: "Test", description: attack };
const out = jsonLd(listing);

// Nothing that could end the script block or open a tag, comment or entity survives.
assert.ok(!out.includes("<"), "no raw < in the output");
assert.ok(!out.includes(">"), "no raw > in the output");
assert.ok(!out.includes("&"), "no raw & in the output");
assert.ok(!/<\/script/i.test(out), "no closing script tag");
assert.ok(out.includes(BACKSLASH + "u003c/script" + BACKSLASH + "u003e"), "the closing tag is escaped, not dropped");

// It is still valid JSON that reads back to exactly the same data.
assert.deepEqual(JSON.parse(out), listing);

// Line and paragraph separators are escaped too, and survive a round trip.
const seps = { text: "a" + LINE_SEP + "b" + PARA_SEP + "c" };
const sepsOut = jsonLd(seps);
assert.ok(!sepsOut.includes(LINE_SEP) && !sepsOut.includes(PARA_SEP), "no raw line or paragraph separators");
assert.ok(sepsOut.includes(BACKSLASH + "u2028") && sepsOut.includes(BACKSLASH + "u2029"), "separators are escaped");
assert.deepEqual(JSON.parse(sepsOut), seps);

// Ordinary data is unchanged.
assert.equal(jsonLd({ "@context": "https://schema.org", price: 1250000 }), '{"@context":"https://schema.org","price":1250000}');
assert.equal(jsonLd(undefined), "null");

console.log("json-ld: ok");
