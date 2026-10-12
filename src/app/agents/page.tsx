"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useState } from "react";
import AccountActions from "@/components/account-actions";
import {
  ArrowLeftIcon,
  CheckIcon,
  HomeIcon,
  LocationPinIcon,
  TagIcon,
  XMarkIcon,
} from "@/components/icons";

type AgentRecord = {
  id: string;
  name: string;
  agency: string;
  ffcNumber: string; // PPRA Fidelity Fund Certificate
  specialty: string;
  location: string;
  activeMandates: number;
  phone: string;
  email: string;
  image: string;
  bio: string;
};

const agentsList: AgentRecord[] = [
  {
    id: "sherry-gallagher",
    name: "Sherry Gallagher",
    agency: "Dynasty Prestige Mandates",
    ffcNumber: "PPRA-2026-781920",
    specialty: "Luxury Estates & Diplomatic Residences",
    location: "Waterkloof & Pretoria East",
    activeMandates: 6,
    phone: "+27 82 890 1234",
    email: "sherry.g@dynastyestates.co.za",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
    bio: "With over 14 years specializing in prime Pretoria East estates and ambassadorial residences, Sherry provides discrete, high-touch property advisory with verified PPRA certification.",
  },
  {
    id: "marcus-vander-merwe",
    name: "Marcus van der Merwe",
    agency: "Dynasty Atlantic Seaboard",
    ffcNumber: "PPRA-2026-554219",
    specialty: "Atlantic Seaboard Villas & Penthouses",
    location: "Camps Bay & Clifton, Cape Town",
    activeMandates: 8,
    phone: "+27 83 456 7890",
    email: "marcus.v@dynastyestates.co.za",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80",
    bio: "Marcus heads Atlantic Seaboard prime transactions, delivering exceptional marketing and buyer matching across Camps Bay, Clifton, and the V&A Waterfront.",
  },
  {
    id: "thandi-khumalo",
    name: "Thandi Khumalo",
    agency: "Dynasty Sandton Commercial & Residential",
    ffcNumber: "PPRA-2026-904321",
    specialty: "High-Yield Clusters & Family Estates",
    location: "Sandton & Bryanston, Johannesburg",
    activeMandates: 5,
    phone: "+27 81 234 5678",
    email: "thandi.k@dynastyestates.co.za",
    image: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80",
    bio: "An energetic practitioner known for deep market valuation accuracy and rapid negotiation turnaround across Sandton, Morningside, and Bryanston cluster developments.",
  },
];

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [sentNotice, setSentNotice] = useState(false);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    setSentNotice(true);
    setTimeout(() => {
      setSentNotice(false);
      setSelectedAgent(null);
      setContactMessage("");
    }, 2500);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="relative z-50 mb-6 flex items-center justify-between rounded-[26px] border border-white/75 bg-white/45 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <BrandLogo markOnly />
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold hidden sm:block dark:text-slate-400">Practitioners Directory</p>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                <span className="hidden sm:inline">PPRA Verified </span>Property Practitioners
              </h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-3">
            <Link
              href="/search"
              className="flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white/60 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-all whitespace-nowrap shrink-0 dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5 sm:hidden" />
              <span className="hidden sm:inline">← Explore Properties</span>
              <span className="sm:hidden">Catalogue</span>
            </Link>
            <AccountActions />
          </div>
        </header>

        {/* Directory Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {agentsList.map((agent) => (
            <article
              key={agent.id}
              className="overflow-hidden rounded-[30px] border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl flex flex-col justify-between dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className="h-16 w-16 rounded-2xl bg-cover bg-center shadow-md shrink-0 ring-1 ring-black/5 dark:ring-white/15"
                    style={{ backgroundImage: `url(${agent.image})` }}
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">{agent.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium dark:text-slate-400">{agent.agency}</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <CheckIcon className="h-3 w-3" />
                      <span>{agent.ffcNumber}</span>
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-300">{agent.bio}</p>

                <div className="mt-4 space-y-2 border-t border-slate-200/80 pt-3 text-xs text-slate-700 dark:border-white/10 dark:text-slate-300">
                  <p className="flex items-center gap-1.5">
                    <LocationPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 dark:text-emerald-400" />
                    <span><strong className="text-slate-900 dark:text-white">Territory:</strong> {agent.location}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <TagIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 dark:text-emerald-400" />
                    <span><strong className="text-slate-900 dark:text-white">Focus:</strong> {agent.specialty}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <HomeIcon className="h-3.5 w-3.5 text-slate-400 shrink-0 dark:text-emerald-400" />
                    <span><strong className="text-slate-900 dark:text-white">Active Mandates:</strong> {agent.activeMandates} Exclusive Homes</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 pt-3 border-t border-slate-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedAgent(agent)}
                  className="w-full rounded-xl bg-slate-950 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                >
                  Contact Practitioner →
                </button>
                <Link
                  href={`/search?q=${encodeURIComponent(agent.location.split("&")[0].trim())}`}
                  className="w-full rounded-xl border border-slate-300/80 bg-white/60 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-white dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  View Active Mandates
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Contact Modal */}
        {selectedAgent && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setSelectedAgent(null)}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-900 dark:bg-[#0c1a1c] dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-slate-200 pb-3 dark:border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider dark:text-emerald-400">Direct Message</span>
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">{selectedAgent.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedAgent.agency}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAgent(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-200 cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {sentNotice ? (
                <div className="py-6 text-center">
                  <CheckIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mt-2">Message Dispatched!</h4>
                  <p className="text-xs text-slate-600 mt-1 dark:text-slate-300">
                    {selectedAgent.name} has been notified via email and SMS and will respond shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">
                      Your Message or Mandate Enquiry
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={`Hello ${selectedAgent.name}, I am interested in property in ${selectedAgent.location}...`}
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-full bg-slate-950 py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                  >
                    Send to Practitioner
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

