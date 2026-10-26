/**
 * Adds dark-mode counterparts to light-only utility classes.
 *
 * Translucent white cards (bg-white/45 etc.) read as washed-out grey once the
 * page behind them is dark, and slate text on them loses contrast. Each rule
 * only fires when that element has NO dark: variant for the same property, so
 * anything already themed by hand is left exactly as it is.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FIX = process.argv.includes("--fix");
const ROOTS = ["src/app", "src/components"];
// Owned by the other agent's theme work — never touched here.
const SKIP = new Set(["theme-provider.tsx", "theme-toggle.tsx"]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(e) && !SKIP.has(e)) out.push(p);
  }
  return out;
}

/** Each rule: does this class list need a dark counterpart, and which one. */
const RULES = [
  { name: "surface", need: /\bbg-white(\/\d+)?\b/, has: /\bdark:bg-/, add: "dark:bg-white/5" },
  { name: "border", need: /\bborder-white(\/\d+)?\b/, has: /\bdark:border-/, add: "dark:border-white/10" },
  { name: "text-strong", need: /\btext-slate-(950|900)\b/, has: /\bdark:text-/, add: "dark:text-white" },
  { name: "text-body", need: /\btext-slate-(800|700|600)\b/, has: /\bdark:text-/, add: "dark:text-slate-300" },
  { name: "text-muted", need: /\btext-slate-(500|400)\b/, has: /\bdark:text-/, add: "dark:text-slate-400" },
];

const tally = Object.fromEntries(RULES.map((r) => [r.name, 0]));
let filesChanged = 0;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");

    // Only plain double-quoted className strings: template literals carry
    // conditional branches that a blind append would corrupt.
    const next = text.replace(/className="([^"{}]*)"/g, (whole, cls) => {
      let out = cls;
      for (const rule of RULES) {
        if (rule.need.test(out) && !rule.has.test(out)) {
          out = `${out} ${rule.add}`;
          tally[rule.name]++;
        }
      }
      return out === cls ? whole : `className="${out}"`;
    });

    if (next !== text) {
      if (FIX) writeFileSync(file, next, "utf8");
      filesChanged++;
    }
  }
}

console.log(FIX ? "APPLIED" : "DRY RUN");
for (const [k, v] of Object.entries(tally)) console.log(`  ${k.padEnd(12)} ${v}`);
console.log(`  ${"files".padEnd(12)} ${filesChanged}`);
process.exit(0);
