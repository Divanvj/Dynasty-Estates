"use client";

import Link from "next/link";

import { AgencyGate } from "@/components/agency-gate";
import { useAgencyTeam, WINDOW_DAYS, type TeamAgent } from "@/components/agency-team";
import { formatAge, linkClass, PageHeading, panelClass, primaryButtonClass, StatTile } from "@/components/dashboard-ui";
import { medianReplyMs } from "@/lib/seller-inquiries";
import { asStage } from "@/lib/seller-inquiries";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 4 — Dashboard (docs/dashboards/PLAN.md, Phase G). The principal's
// glance across the agency: totals, then a leaderboard of agents, then what is
// waiting to be handed out. Read-only; work happens in Team and Enquiries.

const replyText = (reply: TeamAgent["reply"]) => (reply ? formatAge(new Date(0), reply.ms) : "None yet");

export default function AgencyOverviewPage() {
  const uid = useAccountUid();
  const { load, reload, now } = useAgencyTeam(uid);

  return (
    <AgencyGate uid={uid} load={load} reload={reload}>
      {({ agency, agents, enquiries }) => {
        const cutoff = now - WINDOW_DAYS * 24 * 60 * 60 * 1000;
        const recent = enquiries.filter((e) => (e.createdAt?.getTime() ?? 0) >= cutoff);
        const reply = medianReplyMs(enquiries, now, WINDOW_DAYS);
        const unassignedNew = enquiries.filter((e) => asStage(e.status) === "new" && !e.assignedTo).length;
        const active = agents.reduce((sum, a) => sum + a.activeListings, 0);
        // Most enquiries first; ties by the faster median reply, then by name.
        const board = [...agents].sort(
          (a, b) => b.enquiries30 - a.enquiries30 || (a.reply?.ms ?? Infinity) - (b.reply?.ms ?? Infinity) || a.name.localeCompare(b.name),
        );
        return (
          <>
            <PageHeading
              title={agency.name}
              description={`Your agency at a glance: ${agents.length} ${agents.length === 1 ? "agent" : "agents"} including you, last ${WINDOW_DAYS} days.${agency.ppraFirmNumber ? ` PPRA firm ${agency.ppraFirmNumber}.` : ""}`}
              action={<Link href="/agency/team" className={primaryButtonClass}>Invite an agent</Link>}
            />

            <section aria-label="Totals" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile label="Active listings" value={String(active)} detail="Published or under offer" />
              <StatTile label="Enquiries" value={String(recent.length)} detail={`Last ${WINDOW_DAYS} days`} />
              <StatTile
                label="Reply time"
                value={reply ? formatAge(new Date(0), reply.ms) : "None yet"}
                detail={reply ? `Median first reply, ${reply.count} ${reply.count === 1 ? "enquiry" : "enquiries"}` : "Counted once an agent moves a new enquiry on"}
              />
              <StatTile label="New, not handed out" value={String(unassignedNew)} detail="With the listing's own agent" />
            </section>

            <section aria-labelledby="board-heading" className={`mb-6 ${panelClass}`}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id="board-heading" className="text-2xl font-semibold text-slate-900 dark:text-white">Agents</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">Last {WINDOW_DAYS} days · enquiries count for the agent handling them</p>
              </div>
              <div className="overflow-x-auto rounded-control border border-slate-200 dark:border-white/10">
                <table className="w-full min-w-[640px] text-sm">
                  <caption className="sr-only">Agents ranked by enquiries in the last {WINDOW_DAYS} days</caption>
                  <thead className="bg-white/60 text-left text-xs font-bold uppercase tracking-[0.1em] text-slate-600 dark:bg-surface-ink/80 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-4 py-3">Agent</th>
                      <th scope="col" className="px-4 py-3 text-right">Active listings</th>
                      <th scope="col" className="px-4 py-3 text-right">Views</th>
                      <th scope="col" className="px-4 py-3 text-right">Enquiries</th>
                      <th scope="col" className="px-4 py-3 text-right">Waiting</th>
                      <th scope="col" className="px-4 py-3 text-right">Won</th>
                      <th scope="col" className="whitespace-nowrap px-4 py-3 text-right">Median reply</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-[#f4f7f7] dark:divide-white/10 dark:bg-surface-ink/70">
                    {board.map((a) => (
                      <tr key={a.uid}>
                        <th scope="row" className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">
                          {a.name}
                          {a.isPrincipal ? <span className="ml-2 text-xs font-normal text-slate-600 dark:text-slate-400">Principal</span> : null}
                        </th>
                        <td className="px-4 py-3 text-right tabular-nums">{a.activeListings}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{a.views30 ?? "–"}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{a.enquiries30}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${a.waiting > 0 ? "font-semibold text-amber-800 dark:text-amber-300" : ""}`}>{a.waiting}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{a.won30}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{replyText(a.reply)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {agents.length === 1 ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Only you so far. <Link href="/agency/team" className={linkClass}>Invite your agents</Link> to see their figures here.
                </p>
              ) : null}
            </section>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              {unassignedNew > 0 ? (
                <>
                  {unassignedNew} new {unassignedNew === 1 ? "enquiry is" : "enquiries are"} with the listing&rsquo;s own agent.{" "}
                  <Link href="/agency/enquiries?show=unassigned" className={linkClass}>Hand one to someone else</Link>
                </>
              ) : (
                <>Every new enquiry has been handed out or answered. <Link href="/agency/enquiries" className={linkClass}>See all enquiries</Link></>
              )}
            </p>
          </>
        );
      }}
    </AgencyGate>
  );
}
