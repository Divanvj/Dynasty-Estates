import Link from "next/link";

import AccountActions from "@/components/account-actions";
import AmbientCursorHue from "@/components/ambient-cursor-hue";
import BrandLogo from "@/components/brand-logo";
import HeroHeadline from "@/components/hero-headline";
import HomeHeroSearch from "@/components/home-hero-search";
import HomeTrendingListings from "@/components/home-trending-listings";
import { CheckVoteIcon, SparklesIcon, UsersIcon } from "@/components/icons";
import HomeSpotlight from "@/components/home-spotlight";
import SiteNavigation from "@/components/site-navigation";
import { fallbackProperties, getPropertyList } from "@/lib/property-data";
export default async function Home() {
  // The one place a catalogue failure still renders demo data. The homepage
  // already shows the demo catalogue whenever Firestore is empty, so a thrown
  // error here would 500 the landing page for a condition that looks identical
  // to the viewer. The error is logged loudly instead. Remove this fallback
  // together with the rest of the demo data at the launch gate (prompt D1).
  let properties: Awaited<ReturnType<typeof getPropertyList>>;
  try {
    properties = await getPropertyList();
  } catch (error) {
    console.error("[DEMO FALLBACK] Homepage catalogue query failed:", error);
    properties = fallbackProperties;
  }

  return (
    <main className="min-h-screen bg-transparent px-3 py-4 text-slate-900 dark:text-slate-100 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        {/*
          Navigation Header.

          z-50, not z-30. A positioned element with a z-index creates a stacking
          context, so the Sell / Tools / Profile dropdowns inside this header can
          never paint above a *sibling* that outranks the header itself, however
          high their own z-index is. At z-30 the hero below (z-40) won, and all
          three dropdowns opened behind the hero panel. Every other page that
          carries these dropdowns already uses z-50; this one was the exception.

          If you add a section here that must cover the header, portal it to the
          body as ExpandableSearchPanel does rather than raising its z-index —
          that is what keeps its overlay clear of this stacking context.
        */}
        {/* `hidden lg:flex`: below lg every child of this bar — brand, nav and
            account — is now in MobileAppBar, so on a phone it rendered as an
            empty bordered box under the real one. */}
        <header className="relative z-50 mx-auto hidden max-w-[1440px] items-center justify-between rounded-card border border-white/70 bg-white/40 dark:border-white/10 dark:bg-[#0b1719]/70 px-3.5 sm:px-6 py-3 backdrop-blur-xl shadow-[0_12px_30px_rgba(36,48,50,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] lg:flex">
          <BrandLogo />

          <SiteNavigation />

          <AccountActions />
        </header>

        {/* Full-Width Hero Section */}
        <section id="discover" className="relative z-40 mx-auto mt-4 sm:mt-6 max-w-[1440px]">
          <div className="relative rounded-card sm:rounded-panel border border-white/70 bg-white/45 dark:border-white/10 dark:bg-surface-panel/65 p-3.5 sm:p-6 shadow-[0_20px_45px_rgba(36,48,50,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-8 lg:p-10">
            <AmbientCursorHue heroScoped />

            {/*
              max-w-5xl, not 3xl. This wrapper holds only the headline, and the
              approved hero copy includes four deliberate two-line couplets. At
              768px each half of a couplet wrapped on its own, so a two-line
              couplet rendered as four rows and the hero's height swung as the
              copy rotated. At 1024px the halves fit their own lines, which is
              what the couplets were written to do.
            */}
            <div className="relative z-10 mx-auto max-w-5xl text-center">
              <HeroHeadline />
            </div>

            {/* Interactive Search Component */}
            <HomeHeroSearch />

            {/*
              Two hero tiles stood here: "20 Active" and "100% Solar". Both were
              hardcoded — the first a fabricated count that would have read as
              thin at launch and odd at scale, the second a claim the catalogue
              does not substantiate. Counts belong on the results page, where
              they describe a real query. Removed per the Improvement Notes.
            */}
          </div>
        </section>

        {/* Spotlight — led by the viewer's own recent views, falling back to the
            catalogue's best for a first-time visitor. Was a single hardcoded
            Camps Bay listing with a stock photograph, shown to everyone. */}
        <HomeSpotlight properties={properties} />

        <HomeTrendingListings properties={properties} />

        {/* Market Pulse Section */}
        {/* `grid-cols-1` is load-bearing below lg. Without a base column
            definition the grid falls back to one implicit `auto` track, which
            sizes to its content's max-content width: at 320px the track
            measured 326px inside a 296px container and pushed the document
            18px sideways. Tailwind's `grid-cols-1` is `minmax(0, 1fr)`, and
            that zero minimum is what lets the panels shrink. */}
        <section id="insights" className="mx-auto mt-8 grid grid-cols-1 max-w-[1440px] gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-panel border border-white/70 bg-white/45 dark:border-white/10 dark:bg-surface-panel/65 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400 font-bold">Market intelligence</p>
              <Link href="/insights" className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline">
                Full Report →
              </Link>
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">South African Metros at a Glance</h3>

            <div className="mt-5 space-y-3">
              {[
                { area: "Pretoria East & Waterkloof", query: "Pretoria", value: "+7.8% High demand for solar estates" },
                { area: "Sandton & Bryanston", query: "Sandton", value: "+6.4% Secure cluster living priority" },
                { area: "Cape Town Atlantic Seaboard", query: "Camps Bay", value: "+9.2% Coastal luxury international interest" },
                { area: "Umhlanga & Ballito", query: "Umhlanga", value: "+8.1% Gated coastal developments" },
              ].map((item) => (
                <Link
                  key={item.area}
                  href={`/search?q=${encodeURIComponent(item.query)}`}
                  className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/60 dark:border-white/10 dark:bg-surface-ink/60 px-4 py-3 text-xs transition-all hover:bg-white dark:hover:bg-surface-panel hover:border-emerald-400 text-slate-800 dark:text-slate-200"
                >
                  <span className="font-semibold">{item.area}</span>
                  <span className="font-medium text-emerald-800 dark:text-emerald-400">{item.value} →</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-panel border border-emerald-500/25 bg-gradient-to-br from-[#082224] to-[#041416] p-6 text-white shadow-[0_20px_45px_rgba(4,20,22,0.35)] backdrop-blur-xl">
            {/* `flex-wrap` + `min-w-0`: `.pill` is `flex-shrink: 0` and
                `white-space: nowrap`, so this 186px link could not give way and
                overflowed its 301px row by 51px at 375px — enough to push the
                whole document into a 14px horizontal scroll, which on a phone
                reads as the page being subtly broken. It now drops to its own
                line when the heading beside it needs the width. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold">Collaboration & Shortlisting</p>
                <h3 className="mt-1 text-2xl font-light text-white">Find homes with your partner</h3>
              </div>
              <Link
                href="/collections"
                className="pill border border-emerald-400/40 bg-emerald-500/20 font-semibold text-emerald-200 hover:bg-emerald-500/30 transition-all"
              >
                Open Collections →
              </Link>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-emerald-100/80">
              Dynasty Estates lets you invite partners, family members, or investment colleagues to vote (Love/Like/Reject) and comment on properties in real-time.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { title: "Our Pretoria East Shortlist", members: "2 collaborators", votes: "4 votes cast" },
                { title: "Cape Town Oceanfront Search", members: "3 collaborators", votes: "6 votes cast" },
              ].map((col, idx) => (
                <Link
                  key={idx}
                  href="/collections"
                  className="rounded-control border border-emerald-500/20 bg-emerald-950/40 p-4 backdrop-blur-md hover:bg-emerald-950/60 transition-all block"
                >
                  <p className="text-sm font-semibold text-white">{col.title}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-emerald-300/70">
                    <span className="flex items-center gap-1.5">
                      <UsersIcon className="h-3.5 w-3.5" />
                      <span>{col.members}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckVoteIcon className="h-3.5 w-3.5" />
                      <span>{col.votes}</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Global Obsidian Glass Footer */}
        {/* p-8 is 64px of horizontal padding on a phone, inside main's own
            gutter. Halved below `md`; the footer's own height is Phase 4. */}
        <footer className="mx-auto mt-12 max-w-[1440px] rounded-panel border border-white/70 bg-white/40 dark:border-white/10 dark:bg-[#091517]/75 p-8 max-md:p-5 shadow-sm backdrop-blur-xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#0c4e50] to-[#073839] border border-emerald-400/30 text-xs font-bold text-white shadow-sm">
                  D
                </div>
                <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">Dynasty Estates</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                South Africa&rsquo;s premium property discovery, intelligence and transaction platform. Developed for Tricore Enterprises.
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">Discovery & Tools</p>
              {/* space-y-1, not -2: the links below gained `py-1` so each tap
                  target clears the 24px WCAG 2.2 AA floor (they were 18px).
                  Tightening the gap by the same amount the padding adds keeps
                  the footer close to the height it was. */}
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                <li><Link href="/search" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Property Catalogue</Link></li>
                <li><Link href="/map-search" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Interactive Map Search</Link></li>
                <li>
                  <Link href="/ai-search" className="inline-flex items-center gap-1.5 py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">
                    <SparklesIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>AI Search</span>
                  </Link>
                </li>
                <li><Link href="/calculators" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Bond & True Cost™ Calculator</Link></li>
                <li><Link href="/compare" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Compare</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">Portals & Practitioners</p>
              {/* space-y-1, not -2: the links below gained `py-1` so each tap
                  target clears the 24px WCAG 2.2 AA floor (they were 18px).
                  Tightening the gap by the same amount the padding adds keeps
                  the footer close to the height it was. */}
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                <li><Link href="/collections" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Collaborative Shortlists</Link></li>
                <li><Link href="/agents" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">PPRA Verified Agents</Link></li>
                <li><Link href="/seller/portal" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Private Seller Portal</Link></li>
                <li><Link href="/seller/listings/new" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Publish New Listing</Link></li>
                {/* "Agent Command Console" (/agent/dashboard) removed. The
                    route is role-guarded, so this was never a breach — but no
                    portal advertises its practitioner back-office to logged-out
                    visitors, and an agent who has signed in reaches it from the
                    account menu. */}
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">Governance & Legal</p>
              {/* space-y-1, not -2: the links below gained `py-1` so each tap
                  target clears the 24px WCAG 2.2 AA floor (they were 18px).
                  Tightening the gap by the same amount the padding adds keeps
                  the footer close to the height it was. */}
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                <li><Link href="/insights" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Market Insights</Link></li>
                {/* "Platform Command & Moderation" (/admin) removed, for the
                    same reason as the agent console above: a public footer is
                    not where a moderation console belongs. */}
                <li><Link href="/legal/privacy" className="inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">POPIA Privacy & Data Rights</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200/80 dark:border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <p>© 2026 Dynasty Estates / Tricore Enterprises. All rights reserved.</p>
            {/* The framework line that stood here ("Built with Next.js,
                TypeScript & Obsidian Glass") is the kind of thing a template
                leaves behind.

                A regulatory statement would be the natural replacement — it is
                what a seller checks — but the listings and agent records are
                still demo data, so claiming PPRA registration of the
                practitioners on this site would swap one unfounded claim for
                another. Beta status is the thing that is true today. */}
            <p>Beta — listings shown are sample data.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
