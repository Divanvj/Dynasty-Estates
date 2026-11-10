import type { Metadata } from "next";
import Link from "next/link";

import { CheckIcon, SunIcon } from "@/components/icons";
import { formatZAR } from "@/lib/formatters";
import { VAT_REGISTERED, packagesFor, perMonth } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Sell your home privately",
  description:
    "Advertise your home to buyers yourself, for a once-off fee. Dynasty takes no commission on the sale.",
  alternates: { canonical: absoluteUrl("/sell") },
};

/*
  S13, the seller landing page. Dynasty is a portal (owner decision, 10 Nov):
  it sells advertising, not an agent's service, so this page explains how to
  list and what it costs, and never offers a valuation or "one of our agents".
*/

const panel =
  "rounded-panel border border-white/70 bg-white/55 shadow-[0_20px_45px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-panel/80 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]";

/** The example listing card. Figures use the same bond maths and defaults as
 *  the True Cost calculator on a real listing (10% deposit, 11.75%, 20 years). */
const EXAMPLE = { price: 1_850_000, levy: 1_450, rates: 1_120 };
function exampleBond(price: number): number {
  const loan = price - Math.round(price * 0.1);
  const r = 11.75 / 100 / 12;
  const n = 20 * 12;
  return Math.round((loan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1));
}

function WaterDropIcon() {
  return (
    <svg className="h-4 w-4 text-sky-700 dark:text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.7c-3.4 4.2-6 7.6-6 10.8a6 6 0 0 0 12 0c0-3.2-2.6-6.6-6-10.8Z" />
    </svg>
  );
}

const STEPS = [
  {
    title: "Create your listing",
    body: "Add the price, the details and up to 30 photos, a floor plan and a tour link if you have them. It takes six short steps, and you can save a draft.",
  },
  {
    title: "We check it",
    body: "Our team looks over every listing before it goes live, and every photo is compared with the rest of Dynasty to catch copies of someone else's home.",
  },
  {
    title: "Buyers enquire",
    body: "Buyers ask questions and request viewings from your listing page. You manage your listings from your seller portal, with no agent in between.",
  },
];

export default function SellPage() {
  const pkgs = packagesFor("sale");
  const cheapest = Math.min(...pkgs.map((pkg) => pkg.priceZAR));
  const bond = exampleBond(EXAMPLE.price);
  const trueCost = bond + EXAMPLE.levy + EXAMPLE.rates;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.035em] text-balance text-slate-950 md:text-6xl dark:text-white">
              Sell your home yourself.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-slate-700 md:text-xl dark:text-slate-300">
              Advertise to buyers on Dynasty from {formatZAR(cheapest)}, paid once. You stay in charge
              of the sale, and we never take commission on it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/seller/listings/new"
                className="pill-lg bg-slate-900 font-semibold text-white shadow-lg hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                List your home
              </Link>
              <Link
                href="/pricing"
                className="pill-lg border border-slate-300 bg-white/70 font-semibold text-slate-900 hover:bg-white dark:border-white/15 dark:bg-surface-ink/60 dark:text-white dark:hover:bg-white/10"
              >
                See the prices
              </Link>
            </div>
            <p className="mt-5 text-base text-slate-700 dark:text-slate-300">
              Renting it out instead?{" "}
              <Link href="/pricing?for=rent" className="font-semibold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
                Rental packages start at {formatZAR(Math.min(...packagesFor("rent").map((pkg) => pkg.priceZAR)))}
              </Link>
              .
            </p>
          </div>

          {/* Shows what a buyer sees on every Dynasty listing: the monthly cost
              of owning the home and its backup power and water, the two things
              the product leads with. Labelled as an example, because it is. */}
          <figure className={`p-6 md:p-7 ${panel}`}>
            <figcaption className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Example: what buyers see on your listing
            </figcaption>
            <p className="mt-4 text-3xl font-semibold tracking-[-0.02em] tabular-nums text-slate-950 dark:text-white">
              {formatZAR(EXAMPLE.price)}
            </p>
            <p className="text-base text-slate-700 dark:text-slate-300">3 bedrooms · 2 bathrooms · Garden</p>

            <div className="mt-6 rounded-card border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-surface-ink/70">
              <p className="text-base font-semibold text-slate-900 dark:text-white">True cost per month</p>
              <dl className="mt-3 space-y-2 text-base">
                {[
                  ["Bond repayment", bond],
                  ["Levy", EXAMPLE.levy],
                  ["Rates and taxes", EXAMPLE.rates],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 text-slate-700 dark:text-slate-300">
                    <dt>{label}</dt>
                    <dd className="tabular-nums">{formatZAR(value as number)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 font-semibold text-slate-950 dark:border-white/10 dark:text-white">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatZAR(trueCost)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">10% deposit, 11.75% over 20 years</p>
            </div>

            <ul className="mt-4 flex flex-wrap gap-2 text-sm font-medium">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-slate-800 dark:border-white/10 dark:bg-surface-ink/70 dark:text-slate-200">
                <SunIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" /> 5 kW solar with battery
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-slate-800 dark:border-white/10 dark:bg-surface-ink/70 dark:text-slate-200">
                <WaterDropIcon /> Backup water tank
              </li>
            </ul>
          </figure>
        </section>

        <section aria-labelledby="how-heading" className="mt-20">
          <h2 id="how-heading" className="text-3xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
            How it works
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t-2 border-slate-900 pt-5 dark:border-emerald-500">
                <p className="text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-400">Step {index + 1}</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-base text-slate-700 dark:text-slate-300">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="price-heading" className={`mt-20 p-6 md:p-10 ${panel}`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="price-heading" className="text-3xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
                Pay once, for the time you need
              </h2>
              <p className="mt-2 max-w-xl text-base text-slate-700 dark:text-slate-300">
                Every package includes the same listing. They differ only in how long it stays live.
                {VAT_REGISTERED ? " Prices include VAT." : ""}
              </p>
            </div>
            <Link href="/pricing" className="font-semibold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
              What&rsquo;s included
            </Link>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {pkgs.map((pkg) => (
              <li
                key={pkg.id}
                className={`rounded-card border p-5 ${
                  pkg.popular
                    ? "border-slate-900 bg-white dark:border-emerald-500 dark:bg-surface-ink"
                    : "border-slate-200 bg-white/60 dark:border-white/10 dark:bg-surface-ink/60"
                }`}
              >
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {pkg.durationDays} days{pkg.popular ? " · recommended" : ""}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950 dark:text-white">
                  {formatZAR(pkg.priceZAR)}
                </p>
                <p className="mt-1 text-sm tabular-nums text-slate-600 dark:text-slate-400">
                  {formatZAR(perMonth(pkg))} per month
                </p>
              </li>
            ))}
          </ul>

          <ul className="mt-8 grid gap-3 text-base text-slate-700 sm:grid-cols-2 dark:text-slate-300">
            {["No commission when it sells", "Your own seller portal", "Checked before it goes live", "Extend while it's live"].map((item) => (
              <li key={item} className="flex gap-3">
                <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="pill-lg bg-slate-900 font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              Choose a package
            </Link>
          </div>
        </section>

        <section aria-labelledby="agents-heading" className="mt-20 mb-10 grid gap-4 border-t border-slate-200 pt-10 md:grid-cols-[1fr_auto] md:items-center dark:border-white/10">
          <div>
            <h2 id="agents-heading" className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
              Are you an agent?
            </h2>
            <p className="mt-2 max-w-xl text-base text-slate-700 dark:text-slate-300">
              Monthly plans by the number of live listings, starting with three free. Every price is published.
            </p>
          </div>
          <Link
            href="/pricing?for=agents"
            className="pill-lg justify-self-start border border-slate-300 bg-white/70 font-semibold text-slate-900 hover:bg-white dark:border-white/15 dark:bg-surface-ink/60 dark:text-white dark:hover:bg-white/10"
          >
            See agent plans
          </Link>
        </section>
      </div>
    </main>
  );
}
