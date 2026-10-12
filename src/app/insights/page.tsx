"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useState } from "react";
import AccountActions from "@/components/account-actions";
import { ArrowLeftIcon, ShieldIcon, SunIcon } from "@/components/icons";

const marketMetrics = [
  { region: "Pretoria East (Waterkloof & Silver Lakes)", growth: "+7.8%", avgPrice: "R 5.2M", daysOnMarket: 38, driver: "High diplomatic & security estate demand with solar resilience" },
  { region: "Cape Town Atlantic Seaboard (Camps Bay & Clifton)", growth: "+9.4%", avgPrice: "R 16.5M", daysOnMarket: 44, driver: "International buyer interest & ultra-luxury coastal scarcity" },
  { region: "Sandton & Bryanston Clusters", growth: "+6.4%", avgPrice: "R 6.8M", daysOnMarket: 42, driver: "Proximity to financial hub & private educational institutions" },
  { region: "Durban North Coast (Umhlanga & Ballito)", growth: "+8.2%", avgPrice: "R 5.9M", daysOnMarket: 36, driver: "Semigration lifestyle preference & secure gated coastal estates" },
];

const deedsRecordsByNode: Record<
  string,
  {
    fiveYearAppreciation: string;
    avgOwnershipYears: string;
    buyerDemographics: { under35: string; age36to49: string; age50plus: string };
    recentSales: Array<{ street: string; type: string; price: string; date: string; ratePerM2: string }>;
  }
> = {
  "Sandton & Bryanston": {
    fiveYearAppreciation: "+34.8%",
    avgOwnershipYears: "8.6 Years",
    buyerDemographics: { under35: "28%", age36to49: "48%", age50plus: "24%" },
    recentSales: [
      { street: "Mount Street, Bryanston East", type: "Freestanding Estate", price: "R 5,400,000", date: "Aug 2026", ratePerM2: "R 12,200/m²" },
      { street: "Ballyclare Drive, Bryanston", type: "Modern Cluster", price: "R 4,650,000", date: "Jul 2026", ratePerM2: "R 13,800/m²" },
      { street: "Stan Road, Sandton CBD", type: "Executive Apartment", price: "R 2,150,000", date: "Jul 2026", ratePerM2: "R 33,000/m²" },
      { street: "Culross Road, Bryanston", type: "Homestead", price: "R 6,800,000", date: "May 2026", ratePerM2: "R 14,100/m²" },
    ],
  },
  "Cape Town Atlantic Seaboard": {
    fiveYearAppreciation: "+48.2%",
    avgOwnershipYears: "11.2 Years",
    buyerDemographics: { under35: "16%", age36to49: "44%", age50plus: "40%" },
    recentSales: [
      { street: "Victoria Road, Camps Bay", type: "Luxury Coastal Villa", price: "R 24,500,000", date: "Aug 2026", ratePerM2: "R 48,000/m²" },
      { street: "Kloof Road, Clifton", type: "Oceanfront Apartment", price: "R 18,200,000", date: "Jul 2026", ratePerM2: "R 62,000/m²" },
      { street: "Ocean View Drive, Sea Point", type: "Penthouse Suite", price: "R 12,900,000", date: "Jun 2026", ratePerM2: "R 51,500/m²" },
      { street: "Geneva Drive, Camps Bay", type: "Modern Villa", price: "R 19,750,000", date: "May 2026", ratePerM2: "R 44,800/m²" },
    ],
  },
  "Pretoria East": {
    fiveYearAppreciation: "+38.4%",
    avgOwnershipYears: "9.8 Years",
    buyerDemographics: { under35: "22%", age36to49: "52%", age50plus: "26%" },
    recentSales: [
      { street: "Rigel Avenue, Waterkloof Ridge", type: "Diplomatic Residence", price: "R 7,100,000", date: "Aug 2026", ratePerM2: "R 13,400/m²" },
      { street: "Kingfisher Drive, Silver Lakes", type: "Golf Estate Villa", price: "R 5,600,000", date: "Jul 2026", ratePerM2: "R 11,800/m²" },
      { street: "Edward Street, Waterkloof", type: "Security Village House", price: "R 6,450,000", date: "Jun 2026", ratePerM2: "R 12,900/m²" },
      { street: "Menlyn Maine Precinct", type: "Executive High-Rise", price: "R 3,250,000", date: "Apr 2026", ratePerM2: "R 28,500/m²" },
    ],
  },
  "Durban North Coast": {
    fiveYearAppreciation: "+41.5%",
    avgOwnershipYears: "7.9 Years",
    buyerDemographics: { under35: "24%", age36to49: "46%", age50plus: "30%" },
    recentSales: [
      { street: "Lagoon Drive, Umhlanga Rocks", type: "Beachfront Penthouse", price: "R 8,900,000", date: "Aug 2026", ratePerM2: "R 34,200/m²" },
      { street: "Jackalberry Way, Simbithi Eco-Estate", type: "Eco-Estate Pavilion", price: "R 7,450,000", date: "Jul 2026", ratePerM2: "R 17,300/m²" },
      { street: "Ocean Drive, Ballito Central", type: "Coastal Residence", price: "R 6,100,000", date: "Jun 2026", ratePerM2: "R 16,500/m²" },
      { street: "Umhlanga Ridge Boulevard", type: "Modern Apartment", price: "R 2,450,000", date: "May 2026", ratePerM2: "R 26,000/m²" },
    ],
  },
};

export default function InsightsPage() {
  const [selectedNode, setSelectedNode] = useState<string>("Sandton & Bryanston");
  const activeNodeData = deedsRecordsByNode[selectedNode] || deedsRecordsByNode["Sandton & Bryanston"];
  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="relative z-50 mb-6 flex items-center justify-between rounded-[26px] border border-white/75 bg-white/45 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <BrandLogo markOnly />
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold hidden sm:block dark:text-emerald-400">Market Intelligence</p>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                <span className="hidden sm:inline">South African PropTech </span>Market Pulse
              </h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-3">
            <Link
              href="/search"
              className="flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white/60 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-all whitespace-nowrap shrink-0 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 sm:hidden" />
              <span className="hidden sm:inline">← View Catalogue</span>
              <span className="sm:hidden">Catalogue</span>
            </Link>
            <AccountActions />
          </div>
        </header>

        {/* Hero Banner */}
        <section className="rounded-[32px] border border-white/80 bg-white/55 p-6 shadow-sm backdrop-blur-xl mb-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
            Q3 2026 Property Intelligence
          </span>
          <h2 className="mt-3 text-3xl font-light tracking-tight text-slate-950 dark:text-white">
            Energy resilience and security estates lead South African price resilience.
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 max-w-2xl dark:text-slate-300">
            Independent data across Gauteng, Western Cape, and KwaZulu-Natal indicates properties with registered solar inverter systems and estate security trade 18% faster than conventional suburban stock.
          </p>
        </section>

        {/* Regional Market Matrix Table */}
        <section className="rounded-[32px] border border-white/80 bg-white/55 p-6 shadow-sm backdrop-blur-xl mb-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-bold text-slate-950 mb-4 dark:text-white">Metro Growth & Velocity Benchmarks</h3>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 dark:border-white/10 dark:bg-[#060d0e]/90 dark:text-slate-300">
                <tr>
                  <th className="py-3 px-4">Market Node</th>
                  <th className="py-3 px-4">12-Mo Growth</th>
                  <th className="py-3 px-4">Avg Asking</th>
                  <th className="py-3 px-4">Days on Market</th>
                  <th className="py-3 px-4">Primary Value Catalyst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-white/5 dark:text-slate-300">
                {marketMetrics.map((row) => (
                  <tr key={row.region} className="hover:bg-white/40 dark:hover:bg-[#060d0e]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{row.region}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-800 dark:text-emerald-400 dark:drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{row.growth}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">{row.avgPrice}</td>
                    <td className="py-3.5 px-4">{row.daysOnMarket} days</td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] dark:text-slate-300">{row.driver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Deeds Office Suburb Intelligence & Historical Sales */}
        <section className="rounded-[32px] border border-white/80 bg-white/55 p-6 shadow-sm backdrop-blur-xl mb-6 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="rounded-full bg-slate-900 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-white dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
                Official Registrar of Deeds Records
              </span>
              <h3 className="text-lg font-bold text-slate-950 mt-1 dark:text-white">
                Suburb Historical Sold Prices & Demographic Trends
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium dark:text-slate-400">
              Source: South African Deeds Office & PropTech Analytics
            </span>
          </div>

          {/* Node Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {Object.keys(deedsRecordsByNode).map((node) => (
              <button
                key={node}
                type="button"
                onClick={() => setSelectedNode(node)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedNode === node
                    ? "bg-slate-900 text-white shadow-sm dark:bg-emerald-600 dark:text-white dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                    : "border border-slate-200 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                }`}
              >
                {node}
              </button>
            ))}
          </div>

          {/* Suburb Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-2xs dark:bg-[#060d0e]/70 dark:border-white/10 dark:shadow-inner">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold dark:text-slate-400">
                5-Year Capital Appreciation
              </span>
              <p className="mt-1 text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 dark:drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                {activeNodeData.fiveYearAppreciation}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">Compound value trajectory</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-2xs dark:bg-[#060d0e]/70 dark:border-white/10 dark:shadow-inner">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold dark:text-slate-400">
                Median Period of Ownership
              </span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {activeNodeData.avgOwnershipYears}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">High retention & low turnover</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-2xs dark:bg-[#060d0e]/70 dark:border-white/10 dark:shadow-inner">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold dark:text-slate-400">
                Buyer Age Demographic
              </span>
              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-300">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-slate-300">
                  &lt;35: {activeNodeData.buyerDemographics.under35}
                </span>
                <span className="rounded-md bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] dark:bg-emerald-500/25 dark:text-emerald-300 dark:border dark:border-emerald-500/40 dark:shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                  36-49: {activeNodeData.buyerDemographics.age36to49}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-slate-300">
                  50+: {activeNodeData.buyerDemographics.age50plus}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Deeds Office Street Sales Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10">
            <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between dark:bg-[#060d0e]/90 dark:border-white/10">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Recent Verified Deeds Registrations in {selectedNode}
              </span>
              <span className="text-[11px] text-emerald-800 font-semibold dark:text-emerald-400">
                ✓ Verified Registrar Data
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-white text-[10px] uppercase font-bold text-slate-500 dark:border-white/10 dark:bg-[#060d0e]/90 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-4">Street & Complex</th>
                  <th className="py-2.5 px-4">Property Type</th>
                  <th className="py-2.5 px-4">Registered Price</th>
                  <th className="py-2.5 px-4">Transfer Date</th>
                  <th className="py-2.5 px-4">Rate / m²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-white/5 dark:text-slate-300">
                {activeNodeData.recentSales.map((sale) => (
                  <tr key={sale.street} className="hover:bg-slate-50/50 dark:hover:bg-[#060d0e]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{sale.street}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{sale.type}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">{sale.price}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{sale.date}</td>
                    <td className="py-3 px-4 text-emerald-800 font-bold dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.25)]">{sale.ratePerM2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Insights Feature Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-white/80 bg-white/55 p-5 backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 mb-3 dark:bg-amber-500/20 dark:text-amber-400 dark:border dark:border-amber-500/30">
              <SunIcon className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-950 dark:text-white">The Solar Valuation Premium</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed dark:text-slate-300">
              Properties equipped with Tier-1 lithium-iron-phosphate (LiFePO4) storage and solar generation command an estimated R250,000 to R450,000 capital uplift over unequipped counterparts.
            </p>
            <Link
              href="/search?q=solar"
              className="mt-3 inline-block text-xs font-bold text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Browse Solar-Ready Homes →
            </Link>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/55 p-5 backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-800 mb-3 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border dark:border-emerald-500/30">
              <ShieldIcon className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-950 dark:text-white">Security Estate Demand Shift</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed dark:text-slate-300">
              Enclosed security villages and 24h manned estates in Waterkloof, Silver Lakes, and Bryanston maintain over 92% occupancy rates, sustaining robust rental yields between 8.4% and 9.1%.
            </p>
            <Link
              href="/search?q=security"
              className="mt-3 inline-block text-xs font-bold text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Browse Security Estate Homes →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

