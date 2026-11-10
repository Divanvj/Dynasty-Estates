// Checks the rules src/lib/pricing.ts promises, so a price change cannot
// quietly make one package undercut another.
//
//   node scripts/check-pricing.mjs
//
// Needs Node 22.18+ (type stripping on by default); CI runs Node 24.

import {
  agentPlans,
  listingExtensions,
  listingPackages,
} from "../src/lib/pricing.ts";

const problems = [];

for (const audience of ["sale", "rent"]) {
  const pkgs = listingPackages
    .filter((p) => p.audience === audience)
    .sort((a, b) => a.durationDays - b.durationDays);
  const ext = listingExtensions.find((e) => e.audience === audience);

  if (pkgs.length === 0) problems.push(`${audience}: no packages`);
  if (pkgs.filter((p) => p.popular).length > 1) problems.push(`${audience}: more than one "popular" package`);

  for (let i = 1; i < pkgs.length; i++) {
    const shorter = pkgs[i - 1];
    const longer = pkgs[i];
    if (longer.priceZAR <= shorter.priceZAR) {
      problems.push(`${longer.name} (R${longer.priceZAR}) should cost more than ${shorter.name} (R${shorter.priceZAR})`);
    }
    if (longer.priceZAR / longer.durationDays >= shorter.priceZAR / shorter.durationDays) {
      problems.push(`${longer.name} is not cheaper per day than ${shorter.name}`);
    }
  }

  if (!ext) {
    problems.push(`${audience}: no extension`);
    continue;
  }

  // Any package + n extensions must cost at least as much as every package
  // that gives the same or more days, or that bigger package is pointless.
  for (const start of pkgs) {
    for (let n = 1; n <= 12; n++) {
      const days = start.durationDays + n * ext.durationDays;
      const cost = start.priceZAR + n * ext.priceZAR;
      for (const rival of pkgs) {
        if (rival === start || rival.durationDays > days) continue;
        if (cost < rival.priceZAR) {
          problems.push(
            `${start.name} + ${n} x ${ext.durationDays}-day extension = R${cost} for ${days} days, cheaper than ${rival.name} (R${rival.priceZAR}, ${rival.durationDays} days)`,
          );
        }
      }
    }
  }
}

const priced = agentPlans.filter((p) => p.monthlyZAR && p.liveListings);
for (let i = 1; i < priced.length; i++) {
  const a = priced[i - 1];
  const b = priced[i];
  if (b.liveListings <= a.liveListings) problems.push(`${b.name} should allow more listings than ${a.name}`);
  if (b.monthlyZAR <= a.monthlyZAR) problems.push(`${b.name} should cost more than ${a.name}`);
  if (b.monthlyZAR / b.liveListings >= a.monthlyZAR / a.liveListings) {
    problems.push(`${b.name} is not cheaper per listing than ${a.name}`);
  }
}
if (agentPlans.filter((p) => p.popular).length > 1) problems.push(`agents: more than one "popular" plan`);

const ids = [...listingPackages, ...agentPlans].map((p) => p.id);
if (new Set(ids).size !== ids.length) problems.push("duplicate package or plan id");

if (problems.length) {
  console.error(`Pricing rules broken (${problems.length}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `Pricing rules hold: ${listingPackages.length} packages, ${listingExtensions.length} extensions, ${agentPlans.length} agent plans.`,
);
