/**
 * Remaining dark-mode gaps found by the contrast audit:
 *  - auth form inputs kept a hardcoded near-white fill
 *  - an insights table head was pure white
 * Everything here is additive: light-mode classes are untouched.
 */
import { readFileSync, writeFileSync } from "node:fs";

const FIX = process.argv.includes("--fix");

const EDITS = [
  {
    file: "src/app/auth/login/page.tsx",
    from: 'className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"',
    to: 'className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"',
  },
  {
    file: "src/app/auth/signup/page.tsx",
    from: 'className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"',
    to: 'className="w-full rounded-[18px] border border-slate-200 bg-[#f6f8f8] px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"',
  },
  {
    file: "src/app/insights/page.tsx",
    from: '<thead className="border-b border-slate-200 bg-white text-[10px] uppercase font-bold text-slate-500">',
    to: '<thead className="border-b border-slate-200 bg-white text-[10px] uppercase font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">',
  },
  {
    file: "src/app/insights/page.tsx",
    from: '<thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">',
    to: '<thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">',
  },
];

let total = 0;
for (const { file, from, to } of EDITS) {
  const text = readFileSync(file, "utf8");
  if (!text.includes(from)) {
    console.log(`skip (not found or already done)  ${file}`);
    continue;
  }
  const count = text.split(from).length - 1;
  if (FIX) writeFileSync(file, text.split(from).join(to), "utf8");
  console.log(`${FIX ? "fixed" : "would fix"} ${count}x  ${file}`);
  total += count;
}
console.log(`\n${total} replacement(s).`);
process.exit(0);
