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
        {/* Navigation Header */}
        <header className="relative z-30 mx-auto flex max-w-[1440px] items-center justify-between rounded-[28px] border border-white/70 bg-white/40 dark:border-white/10 dark:bg-[#0b1719]/70 px-3.5 sm:px-6 py-3 backdrop-blur-xl shadow-[0_12px_30px_rgba(36,48,50,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
          <BrandLogo />

          <SiteNavigation />

          <AccountActions />
        </header>

        {/* Full-Width Hero Section */}
        <section id="discover" className="relative z-40 mx-auto mt-4 sm:mt-6 max-w-[1440px]">
          <div className="relative rounded-[28px] sm:rounded-[32px] border border-white/70 bg-white/45 dark:border-white/10 dark:bg-[#0c1a1c]/65 p-3.5 sm:p-6 shadow-[0_20px_45px_rgba(36,48,50,0.08)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-8 lg:p-10">
            <AmbientCursorHue heroScoped />

            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <HeroHeadline />
            </div>

            {/* Interactive Search Component */}
            <HomeHeroSearch />

            <div className="relative z-10 mx-auto mt-6 sm:mt-8 grid grid-cols-2 max-w-4xl gap-2.5 sm:gap-3">
              <Link href="/search?intent=rent" className="block rounded-[18px] sm:rounded-[22px] border border-white/70 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 p-3 sm:p-4 backdrop-blur-md hover:bg-white dark:hover:bg-[#0c1a1c] transition-all text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">20 Active</p>
                <p className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.14em] text-slate-500 dark:text-slate-400">Verified rentals & homes →</p>
              </Link>
              <Link href="/search?q=solar&intent=rent" className="block rounded-[18px] sm:rounded-[22px] border border-white/70 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 p-3 sm:p-4 backdrop-blur-md hover:bg-white dark:hover:bg-[#0c1a1c] transition-all text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">100% Solar</p>
                <p className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.14em] text-slate-500 dark:text-slate-400">Energy resilience →</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Spotlight — led by the viewer's own recent views, falling back to the
            catalogue's best for a first-time visitor. Was a single hardcoded
            Camps Bay listing with a stock photograph, shown to everyone. */}
        <HomeSpotlight properties={properties} />

        <HomeTrendingListings properties={properties} />

        {/* Market Pulse Section */}
        <section id="insights" className="mx-auto mt-8 grid max-w-[1440px] gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[30px] border border-white/70 bg-white/45 dark:border-white/10 dark:bg-[#0c1a1c]/65 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.06)] dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-bold">Market intelligence</p>
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
                  className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-4 py-3 text-xs transition-all hover:bg-white dark:hover:bg-[#0c1a1c] hover:border-emerald-400 text-slate-800 dark:text-slate-200"
                >
                  <span className="font-semibold">{item.area}</span>
                  <span className="font-medium text-emerald-800 dark:text-emerald-400">{item.value} →</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-emerald-500/25 bg-gradient-to-br from-[#082224] to-[#041416] p-6 text-white shadow-[0_20px_45px_rgba(4,20,22,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-semibold">Collaboration & Shortlisting</p>
                <h3 className="mt-1 text-2xl font-light text-white">Find homes with your partner</h3>
              </div>
              <Link
                href="/collections"
                className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition-all"
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
                  className="rounded-[22px] border border-emerald-500/20 bg-emerald-950/40 p-4 backdrop-blur-md hover:bg-emerald-950/60 transition-all block"
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
        <footer className="mx-auto mt-12 max-w-[1440px] rounded-[32px] border border-white/70 bg-white/40 dark:border-white/10 dark:bg-[#091517]/75 p-8 shadow-sm backdrop-blur-xl">
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
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><Link href="/search" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Property Catalogue</Link></li>
                <li><Link href="/map-search" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Interactive Map Search</Link></li>
                <li>
                  <Link href="/ai-search" className="inline-flex items-center gap-1.5 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">
                    <SparklesIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>AI Property Concierge</span>
                  </Link>
                </li>
                <li><Link href="/calculators" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Bond & True Cost™ Calculator</Link></li>
                <li><Link href="/compare" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Side-by-Side Comparison</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">Portals & Practitioners</p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><Link href="/collections" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Collaborative Shortlists</Link></li>
                <li><Link href="/agents" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">PPRA Verified Agents</Link></li>
                <li><Link href="/seller/portal" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Private Seller Portal</Link></li>
                <li><Link href="/seller/listings/new" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Publish New Listing</Link></li>
                <li><Link href="/agent/dashboard" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Agent Command Console</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">Governance & Legal</p>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><Link href="/insights" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Market Intelligence Pulse</Link></li>
                <li><Link href="/admin" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">Platform Command & Moderation</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">POPIA Privacy & Data Rights</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200/80 dark:border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <p>© 2026 Dynasty Estates / Tricore Enterprises. All rights reserved.</p>
            <p>Built with Next.js, TypeScript & Obsidian Glass.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
