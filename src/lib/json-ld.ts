/**
 * Structured data (JSON-LD) for a `<script type="application/ld+json">` tag,
 * written with `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` alone is not safe there: it leaves `<` as it is, so a value
 * containing `</script><script>…` (a listing description, an agent's name)
 * closes the tag and the rest runs as code in every visitor's browser (audit
 * finding S2). This rewrites the characters that can end or confuse the script
 * block as JSON unicode escapes (backslash, "u", four hex digits), which parse
 * back to exactly the same text:
 *
 * - `<`, `>` and `&`, so no tag, comment or entity can form inside the block;
 * - the line and paragraph separators (code points 2028 and 2029), which some
 *   parsers treat as line ends.
 *
 * Every JSON-LD block on the site goes through this; never pass
 * `JSON.stringify(...)` to `dangerouslySetInnerHTML` directly.
 */
const BACKSLASH = String.fromCharCode(92);
const ESCAPED = [0x3c, 0x3e, 0x26, 0x2028, 0x2029];

function unicodeEscape(codePoint: number): string {
  return BACKSLASH + "u" + codePoint.toString(16).padStart(4, "0");
}

export function jsonLd(data: unknown): string {
  let out = JSON.stringify(data) ?? "null";
  for (const codePoint of ESCAPED) {
    out = out.split(String.fromCharCode(codePoint)).join(unicodeEscape(codePoint));
  }
  return out;
}
