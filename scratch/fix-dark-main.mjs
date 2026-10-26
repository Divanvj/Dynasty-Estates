/**
 * Page <main> elements hardcode the light page background, so dark mode left
 * every page light while the components inside switched to dark styling —
 * producing pale-on-pale text. They now follow --background, which the theme
 * provider already flips (#dce4e3 light / #081012 dark).
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

let changed = 0;
// Components render <main> too (RoleGuard), so both trees are covered.
for (const file of [...walk("src/app"), ...walk("src/components")]) {
  const text = readFileSync(file, "utf8");

  const next = text.replace(/className="([^"{}]*)"/g, (whole, cls) => {
    if (/dark:bg-\[/.test(cls)) return whole; // already has a themed surface
    // The standard light page background -> follow the theme variable.
    if (cls.includes("bg-[#dce4e3]")) {
      return whole.replace("bg-[#dce4e3]", "bg-[var(--background)]");
    }
    // Auth pages use their own lighter blue; keep it, add a dark counterpart.
    if (cls.includes("bg-[#dfeaf0]")) {
      return whole.replace("bg-[#dfeaf0]", "bg-[#dfeaf0] dark:bg-[var(--background)]");
    }
    return whole;
  });

  if (next !== text) {
    console.log(`${FIX ? "fixed " : "would fix"}  ${file}`);
    if (FIX) writeFileSync(file, next, "utf8");
    changed++;
  }
}
console.log(`\n${changed} file(s).`);
process.exit(0);
