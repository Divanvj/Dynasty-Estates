import type { Metadata } from "next";
import Link from "next/link";

import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import PackageRequestButton from "@/components/package-request-button";
import { formatZAR } from "@/lib/formatters";
import {
  VAT_REGISTERED,
  agentPlans,
  extensionFor,
  inclVat,
  packageInclusions,
  packagesFor,
  perMonth,
  planInclusions,
  plannedFeatures,
  type PackageAudience,
} from "@/lib/pricing";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Prices for sellers, landlords and agents",
  description:
    "Published prices for selling or renting out your home privately, and monthly plans for agents. No commission and no price on request.",
  alternates: { canonical: absoluteUrl("/pricing") },
};

type Tab = PackageAudience | "agents";

const TABS: { id: Tab; label: string }[] = [
  { id: "sale", label: "Selling a home" },
  { id: "rent", label: "Renting one out" },
  { id: "agents", label: "Agents and agencies" },
];

const VAT_INCL = VAT_REGISTERED ? " incl. VAT" : "";

function tabFrom(value: string | string[] | undefined): Tab {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "rent" || raw === "agents" ? raw : "sale";
}

const panel =
  "rounded-panel border border-white/70 bg-white/55 shadow-[0_20px_45px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-surface-panel/80 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const tab = tabFrom((await searchParams).for);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-slate-900 md:px-6 lg:px-8 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-balance text-slate-950 md:text-5xl dark:text-white">
            Prices
          </h1>
          <p className="mt-3 text-lg text-pretty text-slate-700 dark:text-slate-300">
            Every price is on this page. You pay once for the time you choose, or monthly as an agent.
            We never take commission on a sale or a let.
          </p>
        </header>

        {/* Links, not buttons: each tab is its own address (/pricing?for=agents),
            so /sell and the header can link straight to the right one and the
            page needs no script to switch. */}
        <nav aria-label="Who is advertising" className="mt-8 flex max-w-full gap-1 overflow-x-auto rounded-full border border-slate-200 bg-white/60 p-1 sm:inline-flex dark:border-white/10 dark:bg-surface-ink/60">
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <Link
                key={item.id}
                href={item.id === "sale" ? "/pricing" : `/pricing?for=${item.id}`}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={`pill-sm whitespace-nowrap px-4 font-semibold transition-colors ${
                  active
                    ? "bg-slate-900 text-white dark:bg-emerald-700"
                    : "text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {tab === "agents" ? <AgentPlans /> : <PrivatePackages audience={tab} />}

        <PaymentToday tab={tab} />
        <ComingLater />
        <Questions tab={tab} />
      </div>
    </main>
  );
}

function PrivatePackages({ audience }: { audience: PackageAudience }) {
  const pkgs = packagesFor(audience);
  const ext = extensionFor(audience);

  return (
    <section aria-labelledby="packages-heading" className="mt-8">
      <h2 id="packages-heading" className="sr-only">
        {audience === "sale" ? "Packages for selling privately" : "Packages for renting out privately"}
      </h2>

      <ul className="grid gap-4 md:grid-cols-3">
        {pkgs.map((pkg) => (
          <li
            key={pkg.id}
            className={`relative flex flex-col p-6 ${panel} ${
              pkg.popular ? "ring-2 ring-slate-900 dark:ring-emerald-500" : ""
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{pkg.name}</h3>
              {pkg.popular && (
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-sm font-semibold text-white dark:bg-emerald-700">
                  Recommended
                </span>
              )}
            </div>
            <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
              <span className="whitespace-nowrap text-4xl font-semibold tracking-[-0.03em] tabular-nums text-slate-950 dark:text-white">
                {formatZAR(pkg.priceZAR)}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">once-off{VAT_INCL}</span>
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
              Live for {pkg.durationDays} days
              <span className="text-slate-500 dark:text-slate-400" aria-hidden="true"> · </span>
              <span className="tabular-nums">{formatZAR(perMonth(pkg))}</span> per month
            </p>
            <p className="mt-4 flex-1 text-base text-slate-700 dark:text-slate-300">{pkg.note}</p>
            <div className="mt-6">
              <PackageRequestButton
                primary={pkg.popular}
                summary={`${pkg.name} · ${pkg.durationDays} days · ${formatZAR(pkg.priceZAR)}${VAT_INCL}`}
                priceLabel={`${formatZAR(pkg.priceZAR)}${VAT_INCL}`}
              />
            </div>
          </li>
        ))}
      </ul>

      {ext && (
        <p className="mt-4 text-base text-slate-700 dark:text-slate-300">
          Need longer? Extend a live listing by {ext.durationDays} days for{" "}
          <span className="font-semibold tabular-nums text-slate-950 dark:text-white">{formatZAR(ext.priceZAR)}</span>
          {VAT_INCL}.
        </p>
      )}

      <div className={`mt-8 p-6 md:p-8 ${panel}`}>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Every package includes</h2>
        <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
          {packageInclusions.map((item) => (
            <li key={item} className="flex gap-3 text-base text-slate-700 dark:text-slate-300">
              <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          The packages differ only in how long your listing stays live. Pick the time you need.
        </p>
      </div>
    </section>
  );
}

function AgentPlans() {
  return (
    <section aria-labelledby="plans-heading" className="mt-8">
      <h2 id="plans-heading" className="sr-only">
        Monthly plans for agents and agencies
      </h2>
      <p className="max-w-2xl text-base text-slate-700 dark:text-slate-300">
        A plan sets how many listings you can have live at once. Drafts, paused, sold and let listings
        don&rsquo;t count. Prices are per month and exclude VAT.
      </p>

      <ul className="mt-6 grid gap-3">
        {agentPlans.map((plan) => {
          const isCustom = plan.monthlyZAR === null;
          const isFree = plan.monthlyZAR === 0;
          const priceLabel = isCustom
            ? "a quote"
            : isFree
              ? "R 0"
              : `${formatZAR(plan.monthlyZAR!)} a month excl. VAT`;
          return (
            <li
              key={plan.id}
              className={`grid items-center gap-4 p-5 md:grid-cols-[1.3fr_0.8fr_1.1fr_0.9fr] md:gap-6 ${panel} ${
                plan.popular ? "ring-2 ring-slate-900 dark:ring-emerald-500" : ""
              }`}
            >
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                  {plan.name}
                  {plan.popular && (
                    <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-sm font-semibold text-white dark:bg-emerald-700">
                      Recommended
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{plan.note}</p>
              </div>

              <p className="text-base text-slate-800 dark:text-slate-200">
                {plan.liveListings === null ? (
                  "150+ listings"
                ) : (
                  <>
                    <span className="font-semibold tabular-nums">{plan.liveListings}</span> live listings
                  </>
                )}
              </p>

              <div>
                {isCustom ? (
                  <p className="text-2xl font-semibold text-slate-950 dark:text-white">Quoted</p>
                ) : (
                  <>
                    <p className="flex items-baseline gap-1.5">
                      <span className="whitespace-nowrap text-2xl font-semibold tabular-nums text-slate-950 dark:text-white">
                        {isFree ? "Free" : formatZAR(plan.monthlyZAR!)}
                      </span>
                      {!isFree && <span className="text-sm text-slate-600 dark:text-slate-400">/ month</span>}
                    </p>
                    {!isFree && (
                      <p className="text-sm tabular-nums text-slate-600 dark:text-slate-400">
                        {VAT_REGISTERED ? `${formatZAR(inclVat(plan.monthlyZAR!))} incl. VAT · ` : ""}
                        {formatZAR(plan.monthlyZAR! / plan.liveListings!)} per listing
                      </p>
                    )}
                  </>
                )}
              </div>

              <PackageRequestButton
                primary={plan.popular}
                label={isCustom ? "Ask for a quote" : isFree ? "Request Starter" : "Request this plan"}
                summary={`Agent plan ${plan.name} · ${plan.liveListings ?? "150+"} live listings · ${priceLabel}`}
                priceLabel={priceLabel}
              />
            </li>
          );
        })}
      </ul>

      <div className={`mt-8 p-6 md:p-8 ${panel}`}>
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Every plan includes</h2>
        <ul className="mt-4 grid gap-3">
          {planInclusions.map((item) => (
            <li key={item} className="flex gap-3 text-base text-slate-700 dark:text-slate-300">
              <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          Plans are for registered property practitioners. We check your PPRA registration before your
          first listing goes live.
        </p>
      </div>
    </section>
  );
}

function PaymentToday({ tab }: { tab: Tab }) {
  const steps =
    tab === "agents"
      ? [
          "Request a plan. It reaches our team straight away.",
          "We check your PPRA registration and email an invoice for the first month.",
          "Once it's paid, you can publish up to your plan's number of live listings.",
        ]
      : [
          "Request a package. It reaches our team straight away.",
          "Create your listing. We email you an invoice.",
          "Once it's paid and the listing passes our check, it goes live for the days you chose.",
        ];

  return (
    <section aria-labelledby="pay-heading" className="mt-14 grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
      <div>
        <h2 id="pay-heading" className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
          How paying works for now
        </h2>
        <p className="mt-2 text-base text-slate-700 dark:text-slate-300">
          You can&rsquo;t pay online yet. Until you can, we invoice by email and you pay by EFT.
        </p>
      </div>
      <ol className="grid gap-4">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-4 text-base text-slate-800 dark:text-slate-200">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 font-semibold tabular-nums text-slate-900 dark:border-white/20 dark:text-white">
              {index + 1}
            </span>
            <span className="pt-1">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ComingLater() {
  return (
    <section aria-labelledby="later-heading" className="mt-14">
      <h2 id="later-heading" className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
        Not available yet
      </h2>
      <p className="mt-2 max-w-2xl text-base text-slate-700 dark:text-slate-300">
        We&rsquo;re building these. They aren&rsquo;t included in any package or plan today, and
        we&rsquo;ll publish their prices here when they&rsquo;re ready.
      </p>
      <ul className="mt-6 grid gap-x-8 gap-y-5 border-t border-slate-200 pt-6 sm:grid-cols-2 lg:grid-cols-3 dark:border-white/10">
        {plannedFeatures.map((feature) => (
          <li key={feature.name}>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{feature.name}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{feature.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Questions({ tab }: { tab: Tab }) {
  const faqs: { q: string; a: string }[] =
    tab === "agents"
      ? [
          {
            q: "What counts as a live listing?",
            a: "A listing buyers can see in search: published or under offer. Drafts, paused, sold and let listings don't count towards your plan.",
          },
          {
            q: "Can I change plans?",
            a: "Yes. Ask us and we'll move you up or down from your next invoice.",
          },
          {
            q: "Do you take a share of my commission?",
            a: "No. You pay the plan's monthly price and nothing else.",
          },
          {
            q: "We have several branches, or a listing feed.",
            a: "Ask for an Enterprise quote. Bringing in listings from a feed is something we're building; tell us which one you use.",
          },
        ]
      : [
          {
            q: "Do you take commission when my home sells or lets?",
            a: "No. Dynasty is an advertising platform, not an agency. You pay the package price once, and nothing when the home sells or lets.",
          },
          {
            q: "What does your check involve?",
            a: "Before a listing goes live, our team looks for signs of a scam or a mistake. Every photo is also compared with photos already on Dynasty, to catch copies of someone else's home.",
          },
          {
            q: "What happens when my package ends?",
            a: "Your listing comes out of search. You can extend it before then, and if it sells or lets early, tell us and we’ll mark it sold or let.",
          },
          {
            q: VAT_REGISTERED ? "Is VAT included?" : "Are there any extra charges?",
            a: VAT_REGISTERED
              ? "Yes. The price you see is the price you pay."
              : "No. The price you see is the price you pay.",
          },
        ];

  return (
    <section aria-labelledby="faq-heading" className="mt-14 mb-8">
      <h2 id="faq-heading" className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
        Questions
      </h2>
      <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
        {faqs.map((item) => (
          <details key={item.q} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-base font-semibold text-slate-900 dark:text-white">
              {item.q}
              <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180 dark:text-slate-400" />
            </summary>
            <p className="max-w-3xl pb-4 text-base text-slate-700 dark:text-slate-300">{item.a}</p>
          </details>
        ))}
      </div>
      {tab !== "agents" && (
        <p className="mt-6 text-base text-slate-700 dark:text-slate-300">
          Ready to start?{" "}
          <Link href="/seller/listings/new" className="font-semibold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
            List your home
          </Link>
          , or read{" "}
          <Link href="/sell" className="font-semibold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
            how selling on Dynasty works
          </Link>
          .
        </p>
      )}
    </section>
  );
}
