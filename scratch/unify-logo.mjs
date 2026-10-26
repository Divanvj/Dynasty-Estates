/**
 * Unifies the brand mark.
 *
 * Three treatments had accumulated — an image tile on the home page, a slate
 * "D" on nine pages and a gradient "D" on search — so the logo changed shape
 * as you moved around the site.
 *
 * Two shapes are handled separately:
 *  A. tile + "Dynasty / Estates" wordmark  -> <BrandLogo />
 *  B. bare tile followed by a page title   -> <BrandLogo markOnly />
 *     (the page's own title must survive)
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FIX = process.argv.includes("--fix");

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e)) out.push(p);
  }
  return out;
}

// A: whole logo link, tile + wordmark. Two gap spellings are in use.
const FULL = /<Link\s+href="\/"\s+className="flex items-center gap-(?:2\.5 sm:gap-3 shrink-0|3)"[^>]*>[\s\S]*?<\/Link>/g;
// B: the tile on its own (letter D inside a rounded square).
const TILE = /<Link\s+href="\/"\s+className="[^"]*h-10 w-10[^"]*rounded-2xl[^"]*"[^>]*>\s*D\s*<\/Link>/g;

let files = 0, full = 0, tile = 0;

for (const file of walk("src/app")) {
  let text = readFileSync(file, "utf8");
  const before = text;

  text = text.replace(FULL, (block) => {
    if (!/Dynasty/.test(block) || !/Estates/.test(block)) return block;
    full++;
    return "<BrandLogo />";
  });

  text = text.replace(TILE, () => {
    tile++;
    return "<BrandLogo markOnly />";
  });

  if (text !== before) {
    if (!/from "@\/components\/brand-logo"/.test(text)) {
      text = text.replace(/^(import .*?;\n)/m, `$1import BrandLogo from "@/components/brand-logo";\n`);
    }
    if (FIX) writeFileSync(file, text, "utf8");
    console.log(`${FIX ? "updated" : "would update"}  ${file}`);
    files++;
  }
}

console.log(`\nwordmark blocks: ${full}, bare tiles: ${tile}, files: ${files}`);
process.exit(0);
