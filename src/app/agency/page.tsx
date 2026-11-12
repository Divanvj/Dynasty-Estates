"use client";

import Link from "next/link";

import { AgencyGate } from "@/components/agency-gate";
import { useAgencyTeam, WINDOW_DAYS, type TeamAgent } from "@/components/agency-team";
import { DailyBars } from "@/components/charts/daily-bars";
import { Meter } from "@/components/charts/meter";
import { Ring } from "@/components/charts/ring";
import { TrendLine } from "@/components/charts/trend-line";
import {
  AgeChip,
  DashCard,
  Delta,
  formatAge,
  heroPrimaryClass,
  heroSecondaryClass,
  KpiCard,
  linkClass,
  RingCard,
  StatementCard,
} from "@/components/dashboard-ui";
import { changeWords, countPerDay, DAY_MS, periods, replyFigures, REPLY_TARGET_MS, shortDay, splitAge, statsPerDay, sum } from "@/lib/dashboard-math";
import { asStage, medianReplyMs, REACHED_VIEWING } from "@/lib/seller-inquiries";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 4 — Dashboard (docs/dashboards/PLAN.md, Phase G; look:
// REDESIGN-PLAN.md "D · Petrol"). The principal's glance across the agency:
// the statement card and the agency's reply speed, four figures against the
// previous 30 days, the leaderboard with a top-three podium, reply time per
// agent against the 1 h target, and enquiries per day. Read-only; work
// happens in Team and Enquiries.

const replyText = (reply: TeamAgent["reply"]) => (reply ? formatAge(new Date(0), reply.ms) : "None yet");
const initials = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

export default function AgencyOverviewPage() {
  const uid = useAccountUid();
  const { load, reload, now } = useAgencyTeam(uid);

  return (
    <AgencyGate uid={uid} load={load} reload={reload}>
      {({ agency, agents, enquiries }) => {
        const range = periods(WINDOW_DAYS, now);
        const cutoff = now - WINDOW_DAYS * DAY_MS;
        const prevCutoff = cutoff - WINDOW_DAYS * DAY_MS;
        const inWindow = (e: { createdAt: Date | null }, from: number, to: number) => {
          const t = e.createdAt?.getTime() ?? 0;
          return t >= from && t < to;
        };
        const recent = enquiries.filter((e) => inWindow(e, cutoff, Infinity));
        const before = enquiries.filter((e) => inWindow(e, prevCutoff, cutoff));
        const reached = (list: typeof enquiries) => list.filter((e) => REACHED_VIEWING.includes(asStage(e.status))).length;
        const won = (list: typeof enquiries) => list.filter((e) => asStage(e.status) === "won").length;
        const perDay = countPerDay(enquiries, range.current);
        const reply = medianReplyMs(enquiries, now, WINDOW_DAYS);
        const replies = replyFigures(enquiries, now, WINDOW_DAYS);
        const unassignedNew = enquiries.filter((e) => asStage(e.status) === "new" && !e.assignedTo).length;
        const waiting = agents.reduce((n, a) => n + a.waiting, 0);
        const active = agents.reduce((n, a) => n + a.activeListings, 0);
        const withReply = agents.filter((a) => a.reply);
        const onTarget = withReply.filter((a) => a.reply!.ms <= REPLY_TARGET_MS).length;
        const allRows = agents.flatMap((a) => a.statsRows ?? []);
        const views = statsPerDay(allRows, range.current);
        const viewsBefore = statsPerDay(allRows, range.previous);

        // Most enquiries first; ties by the faster median reply, then by name.
        const board = [...agents].sort(
          (a, b) => b.enquiries30 - a.enquiries30 || (a.reply?.ms ?? Infinity) - (b.reply?.ms ?? Infinity) || a.name.localeCompare(b.name),
        );
        const podium = board.length >= 3 ? [board[1], board[0], board[2]] : null;
        const maxEnquiries = Math.max(1, ...board.map((a) => a.enquiries30));
        const replyScale = Math.max(90 * 60 * 1000, ...withReply.map((a) => a.reply!.ms));

        // The agency's busiest active listing, for the photo.
        const listings = agents.flatMap((a) => a.listings);
        const viewsOf = (id: string) => sum(allRows.filter((r) => r.listingId === id && r.date >= range.current[0]).map((r) => r.views));
        const photoListing = [...listings].filter((l) => l.image).sort((a, b) => viewsOf(b.id) - viewsOf(a.id))[0] ?? null;

        const [figure, unit] = reply ? splitAge(formatAge(new Date(0), reply.ms)) : ["–", ""];
        const change = changeWords(recent.length, before.length);

        return (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <StatementCard
              className="lg:col-span-8"
              eyebrow={`${agency.ppraFirmNumber ? `PPRA firm ${agency.ppraFirmNumber} · ` : ""}${agents.length} ${agents.length === 1 ? "agent" : "agents"} including you`}
              title={agency.name}
              lead={
                <>
                  <strong>
                    {recent.length} {recent.length === 1 ? "enquiry" : "enquiries"}
                  </strong>{" "}
                  in the last {WINDOW_DAYS} days{change ? `, ${change}` : ""}.{" "}
                  {unassignedNew > 0 ? (
                    <>
                      <strong>
                        {unassignedNew} new {unassignedNew === 1 ? "enquiry is" : "enquiries are"}
                      </strong>{" "}
                      still with the listing&rsquo;s own agent.
                    </>
                  ) : (
                    "Every new enquiry has been handed out or answered."
                  )}
                </>
              }
              actions={
                <>
                  <span className="sr-only">Agents: {agents.map((a) => a.name).join(", ")}.</span>
                  <span className="mr-1 flex" aria-hidden="true">
                    {agents.slice(0, 6).map((a, i) => (
                      <span
                        key={a.uid}
                        aria-hidden="true"
                        className={`grid size-9 place-items-center rounded-full border-2 border-[var(--dash-hero-solid)] bg-[var(--dash-hero-track)] text-xs font-bold ${i ? "-ml-2" : ""}`}
                      >
                        {initials(a.name)}
                      </span>
                    ))}
                  </span>
                  {unassignedNew > 0 ? (
                    <Link href="/agency/enquiries?show=unassigned" className={heroPrimaryClass}>Hand out enquiries</Link>
                  ) : (
                    <Link href="/agency/enquiries" className={heroPrimaryClass}>See enquiries</Link>
                  )}
                  <Link href="/agency/team" className={heroSecondaryClass}>Invite an agent</Link>
                </>
              }
              photo={photoListing ? { src: photoListing.image!, alt: photoListing.title } : null}
            />

            <div className="lg:col-span-4">
              <RingCard
                label="Agency speed to lead"
                sub={`Median first reply · all agents · ${WINDOW_DAYS} days`}
                ring={
                  <Ring
                    value={replies?.withinTarget ?? 0}
                    label={replies ? `${Math.round(replies.withinTarget * 100)}% of first replies within an hour` : "No replies counted yet"}
                    text={replies ? undefined : "–"}
                  />
                }
                figure={figure}
                unit={unit}
                status={reply ? (reply.ms <= REPLY_TARGET_MS ? "On target · under 1 h" : "Over the 1 h target") : "Counted once an agent moves a new enquiry on"}
                minis={[
                  { value: withReply.length ? `${onTarget}/${withReply.length}` : "–", label: "Agents on target" },
                  { value: replies ? `${Math.round(replies.withinTarget * 100)}%` : "–", label: "Within 1 h" },
                  { value: String(waiting), label: "Waiting" },
                ]}
              />
            </div>

            <section aria-label={`Totals, last ${WINDOW_DAYS} days`} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
              <KpiCard label="Active listings" value={String(active)} detail="Published or under offer" />
              <KpiCard
                label={`Enquiries · ${WINDOW_DAYS} d`}
                value={String(recent.length)}
                delta={<Delta now={recent.length} before={before.length} />}
                trend={<TrendLine values={perDay} />}
                detail={`vs the ${WINDOW_DAYS} days before`}
              />
              <KpiCard
                label="Reached a viewing"
                value={String(reached(recent))}
                delta={<Delta now={reached(recent)} before={reached(before)} unit="count" />}
                detail={`Of this period's enquiries`}
              />
              <KpiCard
                label="Listing views"
                value={sum(views.map((v) => v.views)).toLocaleString("en-ZA")}
                delta={<Delta now={sum(views.map((v) => v.views))} before={sum(viewsBefore.map((v) => v.views))} />}
                trend={<TrendLine values={views.map((v) => v.views)} />}
                detail={`Won this period: ${won(recent)}`}
              />
            </section>

            <DashCard title="Leaderboard" className="lg:col-span-7" aside={`Last ${WINDOW_DAYS} days · enquiries count for the agent handling them`}>
              {podium ? (
                <ol aria-label="Top three agents" className="mb-5 grid grid-cols-3 items-end gap-3">
                  {podium.map((a) => {
                    const first = a === board[0];
                    const place = board.indexOf(a) + 1;
                    return (
                      <li
                        key={a.uid}
                        className={`rounded-2xl border bg-[var(--dash-card-2)] px-2 py-4 text-center ${
                          first ? "border-[color-mix(in_srgb,var(--dash-accent)_55%,transparent)] pt-5 shadow-[inset_0_3px_0_var(--dash-accent)]" : "border-[var(--dash-line)]"
                        }`}
                      >
                        <p className={`text-xs font-bold tracking-[0.14em] ${first ? "text-[var(--dash-accent-ink)]" : "text-slate-500 dark:text-slate-400"}`}>
                          {place === 1 ? "1ST" : place === 2 ? "2ND" : "3RD"}
                        </p>
                        <span
                          aria-hidden="true"
                          className={`mx-auto mt-2 grid size-12 place-items-center rounded-full font-bold ${
                            first
                              ? "bg-[var(--dash-d1)] text-white ring-2 ring-[var(--dash-accent)] ring-offset-2 ring-offset-[var(--dash-card-2)] dark:text-[#0b0e0f]"
                              : "bg-[var(--dash-d3)] text-[var(--dash-d1)] dark:text-white"
                          }`}
                        >
                          {initials(a.name)}
                        </span>
                        <p className="mt-2 truncate text-sm font-semibold text-slate-900 dark:text-white">{a.name}</p>
                        <p className="text-2xl font-semibold tabular-nums tracking-[-0.03em] text-slate-900 dark:text-white">{a.enquiries30}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">enquiries</p>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <caption className="sr-only">Agents ranked by enquiries in the last {WINDOW_DAYS} days</caption>
                  <thead className="text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-2 pb-3">Agent</th>
                      <th scope="col" className="px-2 pb-3">Enquiries</th>
                      <th scope="col" className="px-2 pb-3 text-right">Views</th>
                      <th scope="col" className="px-2 pb-3 text-right">Waiting</th>
                      <th scope="col" className="px-2 pb-3 text-right">Won</th>
                      <th scope="col" className="px-2 pb-3 text-right">Reply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.map((a, i) => (
                      <tr key={a.uid} className="border-t border-[var(--dash-line)]">
                        <th scope="row" className="whitespace-nowrap px-2 py-2.5 text-left font-semibold text-slate-900 dark:text-white">
                          <span className={`mr-2 text-xs tabular-nums ${i === 0 ? "text-[var(--dash-accent-ink)]" : "text-slate-500 dark:text-slate-400"}`}>{i + 1}</span>
                          {a.name}
                          {a.isPrincipal ? <span className="ml-2 text-xs font-normal text-slate-600 dark:text-slate-400">Principal</span> : null}
                        </th>
                        <td className="px-2 py-2.5">
                          <span className="flex min-w-[100px] items-center gap-2">
                            <Meter value={a.enquiries30} max={maxEnquiries} />
                            <b className="w-7 text-right tabular-nums">{a.enquiries30}</b>
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{a.views30 ?? "–"}</td>
                        <td className={`px-2 py-2.5 text-right tabular-nums ${a.waiting > 0 ? "font-semibold text-[var(--dash-down)]" : ""}`}>{a.waiting}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{a.won30}</td>
                        <td className="px-2 py-2.5 text-right">
                          {a.reply ? <AgeChip label={replyText(a.reply)} tone={a.reply.ms <= REPLY_TARGET_MS ? "neutral" : "late"} /> : <span className="text-slate-500">None yet</span>}
                        </td>
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
            </DashCard>

            <DashCard title="Reply time by agent" className="lg:col-span-5" aside="Median first reply · target 1 h">
              {withReply.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">Reply times appear once agents move new enquiries on.</p>
              ) : (
                <ul className="space-y-4">
                  {[...withReply]
                    .sort((a, b) => a.reply!.ms - b.reply!.ms)
                    .map((a) => {
                      const late = a.reply!.ms > REPLY_TARGET_MS;
                      return (
                        <li key={a.uid}>
                          <p className="mb-1.5 flex justify-between gap-3 text-sm">
                            <span className="truncate text-slate-800 dark:text-slate-200">{a.name}</span>
                            <b className={`tabular-nums ${late ? "text-[var(--dash-down)]" : "text-slate-900 dark:text-white"}`}>{replyText(a.reply)}</b>
                          </p>
                          <Meter value={a.reply!.ms} max={replyScale} marker={REPLY_TARGET_MS} tone={late ? "late" : "data"} height={10} />
                        </li>
                      );
                    })}
                </ul>
              )}
            </DashCard>

            <DashCard title="Enquiries across the agency" className="lg:col-span-12" aside={`Per day · last ${WINDOW_DAYS} days · today in champagne`}>
              <DailyBars days={range.current} bars={perDay} barLabel="Enquiries" formatDay={shortDay} height={200} width={1240} />
            </DashCard>
          </div>
        );
      }}
    </AgencyGate>
  );
}
