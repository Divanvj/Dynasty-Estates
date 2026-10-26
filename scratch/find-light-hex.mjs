/**
 * Finds hardcoded light hex backgrounds that have no dark counterpart.
 * These are what leave white-on-white text once the codemod adds dark:text-*.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FIX = process.argv.includes("--fix");
const SKIP = new Set(["theme-provider.tsx", "theme-toggle.tsx"]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e) && !SKIP.has(e)) out.push(p);
  }
  return out;
}

const lum = (hex) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const found = new Map();
let changed = 0;

for (const file of [...walk("src/app"), ...walk("src/components")]) {
  const text = readFileSync(file, "utf8");

  const next = text.replace(/className="([^"{}]*)"/g, (whole, cls) => {
    if (/dark:bg-/.test(cls)) return whole;
    const m = cls.match(/\bbg-\[(#[0-9a-fA-F]{6})\]/);
    if (!m) return whole;
    if (lum(m[1]) < 0.55) return whole; // already a dark surface, leave it

    found.set(m[1], (found.get(m[1]) ?? 0) + 1);
    // white/5 matches the treatment used across the rest of the dark theme
    return whole.replace(`bg-[${m[1]}]`, `bg-[${m[1]}] dark:bg-white/5`);
  });

  if (next !== text) {
    if (FIX) writeFileSync(file, next, "utf8");
    changed++;
  }
}

console.log(FIX ? "APPLIED" : "DRY RUN");
for (const [hex, n] of [...found].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${hex}  x${n}  (luminance ${lum(hex).toFixed(2)})`);
}
console.log(`  files: ${changed}`);
process.exit(0);
