/**
 * Dynasty's published prices: the one source for /pricing, /sell and the
 * admin's Commercial Packages tab.
 *
 * Replaces `src/lib/billing.ts`, whose three packages (Standard R1,450,
 * Showcase R2,950, Prestige Spotlight R5,800) advertised features that do not
 * exist ("Obsidian Glass glow badge", "AI MatchScore boost", homepage banner
 * rotation, SMS alerts) beside a mock payment gateway that always reported
 * success.
 *
 * Rules these numbers must keep (scripts/check-pricing.mjs checks them):
 *  - a longer package is cheaper per day than a shorter one;
 *  - a package plus extensions never costs less than the next package up
 *    for the same or more days, so an extension cannot undercut a package;
 *  - an agent plan's price per listing falls as the plan grows.
 *
 * VAT: private sellers and landlords are consumers, so their prices are shown
 * including VAT (VAT Act s65; the displayed price is binding under CPA s23).
 * Agent plans are business prices, shown excluding VAT and labelled so.
 * Whether Dynasty is VAT-registered is still the owner's decision; if it is
 * not, it cannot charge VAT and the "incl. VAT" labels come off (VAT_REGISTERED).
 *
 * Nothing here is paid online yet. A request is filed with the Dynasty team
 * (support_requests, read on /admin), who invoice by hand.
 */

// No imports, on purpose: scripts/check-pricing.mjs loads this file directly
// with Node's type stripping. Format prices with formatZAR from formatters.

export const VAT_RATE = 0.15;
export const VAT_REGISTERED = true;

export type PackageAudience = "sale" | "rent";

export type ListingPackage = {
  id: string;
  audience: PackageAudience;
  name: string;
  durationDays: number;
  /** Rand, including VAT. What the consumer pays. */
  priceZAR: number;
  popular?: boolean;
  /** One line on who it suits. */
  note: string;
};

export type ListingExtension = {
  id: string;
  audience: PackageAudience;
  durationDays: number;
  /** Rand, including VAT. */
  priceZAR: number;
  popular?: boolean;
};

export type AgentPlan = {
  id: string;
  name: string;
  /** Live listings at once. `null` for Enterprise (agreed per contract). */
  liveListings: number | null;
  /** Rand per month, excluding VAT. `null` means priced per agreement. */
  monthlyZAR: number | null;
  note: string;
  popular?: boolean;
};

/** Homes take about 11 to 12 weeks to sell nationally (2026), so a sale
 *  package starts at 30 days. Rentals let faster; their packages are shorter. */
export const listingPackages: ListingPackage[] = [
  { id: "sell-30", audience: "sale", name: "Sell 30", durationDays: 30, priceZAR: 399, note: "Testing the market, or a home priced to go quickly." },
  { id: "sell-90", audience: "sale", name: "Sell 90", durationDays: 90, priceZAR: 799, popular: true, note: "Covers the time most homes take to sell." },
  { id: "sell-180", audience: "sale", name: "Sell 180", durationDays: 180, priceZAR: 1399, note: "Six months, for a slower market or a higher price." },
  { id: "rent-14", audience: "rent", name: "Rent 14", durationDays: 14, priceZAR: 149, note: "A unit in demand that you expect to let fast." },
  { id: "rent-30", audience: "rent", name: "Rent 30", durationDays: 30, priceZAR: 249, popular: true, note: "Enough time to screen applicants and choose." },
  { id: "rent-90", audience: "rent", name: "Rent 90", durationDays: 90, priceZAR: 449, note: "A larger home, or a let further in advance." },
];

/**
 * More time on a listing that is already live, or on one that has just run
 * out. There used to be exactly one length per audience and it was offered
 * "only while the listing is live", which left the commonest moment of all
 * unpriced: the seller who comes back the week after their package ended and
 * wants the same listing up again (owner, 20 Nov: "Extension Price Options
 * (When Subscription Expires)").
 *
 * Two things changed. There is now a choice of lengths, so somebody who knows
 * they need three more months is not buying six separate extensions; and an
 * extension stays buyable for `RELIST_GRACE_DAYS` after the package ends, so
 * a lapsed listing comes back at the extension price rather than at the price
 * of a new package.
 *
 * The per-day price still falls as the extension gets longer, and every
 * package plus any run of extensions still costs at least what the next
 * package up costs for the same days — scripts/check-pricing.mjs checks both
 * for each length, not just the shortest.
 */
export const listingExtensions: ListingExtension[] = [
  { id: "sale-ext-30", audience: "sale", durationDays: 30, priceZAR: 299, popular: true },
  { id: "sale-ext-60", audience: "sale", durationDays: 60, priceZAR: 549 },
  { id: "sale-ext-90", audience: "sale", durationDays: 90, priceZAR: 749 },
  { id: "rent-ext-14", audience: "rent", durationDays: 14, priceZAR: 129, popular: true },
  { id: "rent-ext-30", audience: "rent", durationDays: 30, priceZAR: 229 },
  { id: "rent-ext-90", audience: "rent", durationDays: 90, priceZAR: 399 },
];

/**
 * How long after a package ends an extension may still be bought.
 *
 * Two weeks is deliberately short. The listing's photos, checks and enquiry
 * history are all still on file in that window, so bringing it back is the
 * same work as extending it; past that we would be reviving a listing whose
 * price and availability nobody has confirmed, which is a new listing and is
 * priced as one.
 *
 * Nothing in the app enforces this yet: no listing carries a paid-until date,
 * because nothing is paid online (see the note at the top of this file). It
 * is published so the team quoting by hand quotes one number, and so the
 * expiry work has a rule to build against.
 */
export const RELIST_GRACE_DAYS = 14;

/** Only live listings count towards a plan: drafts, paused, sold and let do not. */
export const agentPlans: AgentPlan[] = [
  { id: "starter", name: "Starter", liveListings: 3, monthlyZAR: 0, note: "For a newly registered agent getting started." },
  { id: "solo", name: "Solo", liveListings: 10, monthlyZAR: 399, note: "An individual practitioner." },
  { id: "team", name: "Team", liveListings: 25, monthlyZAR: 799, popular: true, note: "A small team or a busy agent." },
  { id: "agency", name: "Agency", liveListings: 60, monthlyZAR: 1499, note: "An independent agency." },
  { id: "branch", name: "Branch", liveListings: 150, monthlyZAR: 2999, note: "An established branch." },
  { id: "enterprise", name: "Enterprise", liveListings: null, monthlyZAR: null, note: "Several branches, a franchise or a developer." },
];

/** What every private package includes. Only features that exist today. */
export const packageInclusions: string[] = [
  "Up to 30 photos, each checked for quality and for copies of other listings",
  "A floor plan, and a link to a 3D or video tour",
  "The True Cost of the home and its solar and water backup on the listing",
  "Enquiry and viewing-request buttons on your listing",
  "A check by our team before the listing goes live",
];

/** What every agent plan includes. Only features that exist today. */
export const planInclusions: string[] = [
  "The listing tools private sellers get: photos, floor plan, tour link",
  "The agent dashboard: your listings, their views and your enquiries",
  "A profile in the verified agent directory, once your PPRA registration is checked",
];

/**
 * Planned, not built. Shown on /pricing as "not available yet" with no price,
 * so the plan stays visible without selling anything that does not exist.
 */
export const plannedFeatures: { name: string; detail: string }[] = [
  { name: "Your enquiry inbox", detail: "Buyers' questions and viewing requests delivered to you, in your seller portal and by email." },
  { name: "Pay online", detail: "Card and instant EFT at checkout. Until then, we email an invoice." },
  { name: "Boosts and featured placement", detail: "Lift a listing to the top of its suburb for a day, a week or a month." },
  { name: "WhatsApp and SMS lead alerts", detail: "A new enquiry reaches your phone the moment it arrives." },
  { name: "Listing performance reports", detail: "Views, saves and enquiries over time, to send to your seller." },
  { name: "Intelligence Console", detail: "For agents: the full funnel from search impression to sale, and cost per lead." },
  { name: "Comparable sales and CMA reports", detail: "Price a listing against similar homes nearby." },
];

export function exclVat(amountInclVat: number): number {
  return Math.round((amountInclVat / (1 + VAT_RATE)) * 100) / 100;
}

export function inclVat(amountExclVat: number): number {
  return Math.round(amountExclVat * (1 + VAT_RATE) * 100) / 100;
}

/** Price per 30 days, for comparing packages of different lengths. */
export function perMonth(pkg: Pick<ListingPackage, "priceZAR" | "durationDays">): number {
  return Math.round((pkg.priceZAR / pkg.durationDays) * 30);
}

export function packagesFor(audience: PackageAudience): ListingPackage[] {
  return listingPackages.filter((pkg) => pkg.audience === audience);
}

/** Every extension length for an audience, shortest first. */
export function extensionsFor(audience: PackageAudience): ListingExtension[] {
  return listingExtensions
    .filter((ext) => ext.audience === audience)
    .sort((a, b) => a.durationDays - b.durationDays);
}

/** The shortest extension — the "from" price, and what a single tap buys. */
export function extensionFor(audience: PackageAudience): ListingExtension | undefined {
  return extensionsFor(audience)[0];
}

/**
 * Whether a listing whose package ended `daysSinceExpiry` ago can still be
 * extended, or has to be bought as a new package. Day 0 is the day it ended.
 */
export function canExtendAfterExpiry(daysSinceExpiry: number): boolean {
  return daysSinceExpiry >= 0 && daysSinceExpiry <= RELIST_GRACE_DAYS;
}

export function durationLabel(days: number): string {
  return `${days} days`;
}
