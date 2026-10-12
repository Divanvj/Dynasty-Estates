"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import RoleGuard from "@/components/role-guard";
import { BriefcaseIcon, CheckIcon, InfoCircleIcon, ShieldIcon, TagIcon } from "@/components/icons";
import { auth } from "@/lib/firebase";
import { listingPackages } from "@/lib/billing";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import {
  executeModerationDecision,
  getAuditLogs,
  getPendingModerationQueue,
  type AuditLogEntry,
  type ModerationDecision,
  type ModerationItem,
} from "@/lib/moderation";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"moderation" | "fraud" | "billing" | "audit">("moderation");
  const [queue, setQueue] = useState<ModerationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [actionNotice, setActionNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [items, logs] = await Promise.all([getPendingModerationQueue(), getAuditLogs()]);
        setQueue(items);
        setAuditLogs(logs);
        setErrorNotice("");
      } catch (error) {
        setQueue([]);
        setAuditLogs([]);
        setErrorNotice(
          error instanceof Error ? error.message : "Unable to load the moderation console.",
        );
      }
    }

    if (!auth) {
      void loadData();
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      void loadData();
    });
  }, []);

  async function handleDecision(listingId: string, decision: ModerationDecision) {
    const feedback = feedbackMap[listingId] ?? "";
    const moderatorId = user?.uid ?? "admin-system";
    const moderatorEmail = user?.email ?? "compliance@dynastyestates.co.za";

    // Only report success once the write has actually landed. This previously ran
    // unconditionally, so a denied update still produced a success banner.
    try {
      await executeModerationDecision(listingId, decision, feedback, moderatorId, moderatorEmail);
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : `Could not apply the "${decision}" decision.`,
      );
      return;
    }

    setQueue((prev) =>
      prev.map((item) => (item.id === listingId ? { ...item, status: decision === "Approved" ? "Approved" : "Needs changes" } : item))
    );

    try {
      setAuditLogs(await getAuditLogs());
    } catch (error) {
      console.error("Decision applied but the audit trail could not be reloaded:", error);
    }

    setErrorNotice("");
    setActionNotice(`Listing marked as ${decision}.`);
    setTimeout(() => setActionNotice(""), 4000);
  }

  const fraudFlagged = queue.filter((i) => (i.fraudSignals ?? []).length > 0);

  return (
    <RoleGuard allowedRoles={["Admin"]} featureName="Platform Administration">
      <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
        <div className="mx-auto max-w-6xl">
        {/* Admin Command Header */}
        <header className="mb-6 flex items-center justify-between rounded-[26px] border border-white/75 bg-white/45 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <BrandLogo markOnly />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 hidden sm:inline dark:text-emerald-400 font-bold">Governance & Trust</span>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-white dark:bg-emerald-600">ADMIN</span>
              </div>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                <span className="hidden sm:inline">Platform </span>Command Console
              </h1>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 gap-y-2 sm:gap-2.5">
            <Link
              href="/agent/dashboard"
              className="rounded-full border border-slate-300/80 bg-white/60 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-all whitespace-nowrap shrink-0 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white"
            >
              Agent View
            </Link>
          </div>
        </header>

        {errorNotice && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-rose-300 bg-rose-100/80 px-4 py-2.5 text-xs font-medium text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
          >
            <span>{errorNotice}</span>
          </div>
        )}

        {actionNotice && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-100/80 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 px-4 py-2.5 text-xs font-medium text-emerald-900">
            <CheckIcon className="h-4 w-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: "moderation", label: `Moderation Queue (${queue.length})`, Icon: ShieldIcon },
            { key: "fraud", label: `Fraud Signals (${fraudFlagged.length})`, Icon: InfoCircleIcon },
            { key: "billing", label: "Commercial Packages", Icon: TagIcon },
            { key: "audit", label: `Audit Trail (${auditLogs.length})`, Icon: BriefcaseIcon },
          ].map((tab) => {
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-2 rounded-2xl px-3.5 sm:px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === tab.key
                    ? "border border-slate-950 bg-slate-950 text-white shadow-md dark:border-emerald-500/50 dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                    : "border border-white/70 bg-white/45 text-slate-700 hover:bg-white/75 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white"
                }`}
              >
                <TabIcon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: Moderation Queue */}
        {activeTab === "moderation" && (
          <section className="space-y-4">
            <div className="rounded-[28px] border border-white/80 bg-white/50 p-5 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Submitted Listings for Review</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Inspect seller submissions for accurate details, South African POPIA compliance, and quality scoring.
              </p>
            </div>

            <div className="grid gap-4">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[28px] border border-white/80 bg-white/50 p-5 shadow-[0_12px_28px_rgba(36,48,50,0.06)] backdrop-blur-xl dark:bg-[#060d0e]/70 dark:border-white/10"
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-900/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-slate-300">
                          {item.status}
                        </span>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
                          Quality {item.qualityScore}%
                        </span>
                        {item.fraudSignals && item.fraudSignals.length > 0 ? (
                          <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 dark:border dark:border-rose-500/30">
                            Fraud Signal
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-slate-950 dark:text-white">{item.title}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.location} · {item.sellerEmail}</p>
                      <p className="mt-1 text-sm font-extrabold text-emerald-700 dark:text-emerald-400 dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.25)]">{item.price}</p>
                    </div>

                    <div className="flex flex-col gap-2 md:w-80">
                      <input
                        type="text"
                        placeholder="Feedback or reason (optional)..."
                        value={feedbackMap[item.id] ?? ""}
                        onChange={(e) => setFeedbackMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        className="rounded-xl border border-slate-300/80 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-200 dark:placeholder:text-slate-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleDecision(item.id, "Approved")}
                          className="inline-flex items-center justify-center gap-1 flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] cursor-pointer"
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => void handleDecision(item.id, "Needs changes")}
                          className="flex-1 rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-200 dark:hover:bg-amber-900/40 cursor-pointer"
                        >
                          Request Changes
                        </button>
                        <button
                          onClick={() => void handleDecision(item.id, "Rejected")}
                          className="flex-1 rounded-xl border border-rose-300 bg-rose-50 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-200 dark:hover:bg-rose-900/40 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: Fraud Signals */}
        {activeTab === "fraud" && (
          <section className="space-y-4">
            <div className="rounded-[28px] border border-white/80 bg-white/50 p-5 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Automated Fraud & Duplicate Alerts</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Signals generated by perceptual hashing and PPRA practitioner licence verification.
              </p>
            </div>

            <div className="grid gap-3">
              {fraudFlagged.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-500/30 p-4">
                  <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">{item.title} ({item.price})</h3>
                  <p className="text-xs text-rose-800 dark:text-rose-300 mt-1">Reported by system on submission from {item.sellerEmail}</p>
                  <ul className="mt-2 space-y-1 text-xs text-rose-900 dark:text-rose-200 font-medium">
                    {item.fraudSignals?.map((sig, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <InfoCircleIcon className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>{sig}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: Commercial Packages */}
        {activeTab === "billing" && (
          <section className="space-y-4">
            <div className="rounded-[28px] border border-white/80 bg-white/50 p-5 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Commercial Listing Packages</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Transparent revenue model separated strictly from quality scoring.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {listingPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`rounded-[28px] border p-5 backdrop-blur-xl ${
                    pkg.isPopular
                      ? "border-emerald-400 bg-white/70 shadow-lg ring-2 ring-emerald-500/30 dark:border-emerald-500/50 dark:bg-[#0c1a1c] dark:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                      : "border-white/80 bg-white/50 shadow-sm dark:bg-[#060d0e]/70 dark:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
                    {pkg.isPopular && (
                      <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white dark:bg-emerald-600">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-emerald-400">R {formatNumber(pkg.priceZAR)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active for {pkg.durationDays} days</p>

                  <ul className="mt-4 space-y-2 border-t border-slate-200/60 dark:border-white/10 pt-3 text-xs text-slate-700 dark:text-slate-300">
                    {pkg.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 4: Audit Trail */}
        {activeTab === "audit" && (
          <section className="space-y-4">
            <div className="rounded-[28px] border border-white/80 bg-white/50 p-5 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Immutable Security Audit Trail</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Chronological record of sensitive actions, privilege escalations, and moderation decisions.
              </p>
            </div>

            <div className="overflow-hidden rounded-[26px] border border-white/80 bg-white/55 shadow-sm backdrop-blur-xl dark:bg-[#060d0e]/60 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-white/40 text-[10px] uppercase tracking-wider text-slate-500 dark:border-white/10 dark:bg-[#0c1a1c] dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/40 dark:hover:bg-[#0c1a1c]/60 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {log.actorEmail ?? log.actorId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-slate-900/10 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-emerald-300 px-2.5 py-0.5 font-mono text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">{log.resource}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
    </RoleGuard>
  );
}

