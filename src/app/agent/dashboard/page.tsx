"use client";

import Link from "next/link";
import { useState } from "react";

import { useAgencyInvites } from "@/components/agency-membership";
import { useAuth } from "@/components/auth-provider";
import { DailyBars } from "@/components/charts/daily-bars";
import { Funnel } from "@/components/charts/funnel";
import { Meter } from "@/components/charts/meter";
import { Ring } from "@/components/charts/ring";
import { TrendLine } from "@/components/charts/trend-line";
import {
  AgeChip,
  DashCard,
  Delta,
  emptyBoxClass,
  errorBoxClass,
  formatAge,
  heroPrimaryClass,
  heroSecondaryClass,
  KpiCard,
  linkClass,
  RingCard,
  rowClass,
  StatementCard,
} from "@/components/dashboard-ui";
import { useOwnerInquiries } from "@/components/enquiry-inbox";
import { complianceMessage, usePractitioner } from "@/components/practitioner-profile";
import {
  changeWords,
  countPerDay,
  DAY_MS,
  funnelCounts,
  greeting,
  longToday,
  periods,
  replyFigures,
  REPLY_TARGET_MS,
  shortDay,
  splitAge,
  statsPerDay,
  stuckEnquiries,
  sum,
} from "@/lib/dashboard-math";
import { formatDate, formatZAR } from "@/lib/formatters";
import { useOwnerStats, viewsByListing } from "@/lib/listing-stats-client";
import { complianceState } from "@/lib/practitioner-compliance";
import { medianReplyMs, STAGE_LABEL } from "@/lib/seller-inquiries";
import { ACTIVE_CATALOGUE_STATUSES } from "@/lib/types/domain";
import { useAccountUid, useOwnerListings } from "@/lib/use-owner-listings";

// Pattern 4 — Dashboard / Overview (docs/dashboards/PLAN.md; look:
// docs/dashboards/REDESIGN-PLAN.md, "D · Petrol"). A glance, read-only: the
// statement card and reply speed first, then the four figures with their
// trend against the previous 30 days, what needs the agent today, the buyer
// pipeline, daily performance, compliance and the listings. Every figure is
// stored data; while loading it shows a dash, never 0.

const TODAY_LIMIT = 5;
const WINDOW = 30;
const LISTING_ROWS = 6;

/** Listing states in which the agent must hold a mandate and a signed disclosure (PLAN.md F3). */
const NEEDS_MANDATE = ["Submitted", "Needs changes", "Approved", "Published", "Under offer", "Paused"];

const ICON: Record<string, string> = { enquiry: "✉", invite: "★", ffc: "§", listing: "✎", mandate: "§" };

export default function AgentDashboard() {
  const uid = useAccountUid();
  const inbox = useOwnerInquiries(uid);
  const listings = useOwnerListings(uid);
  const [now] = useState(() => Date.now());
  const [range] = useState(() => periods(WINDOW, now));
  const stats = useOwnerStats(uid, range.since);
  const practitioner = usePractitioner(uid);
  const { user } = useAuth();
  const { invites } = useAgencyInvites(user?.email);
  const record = practitioner.load.state === "ready" ? practitioner.load.record : null;
  const compliance = practitioner.load.state === "ready" ? complianceState(record, now) : null;

  const inboxReady = inbox.state === "ready";
  const listingsReady = listings.state === "ready";
  const statsReady = stats.rows !== null;

  // ---- enquiries
  const unanswered = inbox.items
    .filter((item) => item.status === "new")
    .sort((a, b) => (a.createdAt?.getTime() ?? now) - (b.createdAt?.getTime() ?? now));
  const oldest = unanswered.find((item) => item.createdAt)?.createdAt ?? null;
  const enquiriesNow = countPerDay(inbox.items, range.current);
  const enquiriesBefore = countPerDay(inbox.items, range.previous);
  const reply = medianReplyMs(inbox.items, now, WINDOW);
  const replies = replyFigures(inbox.items, now, WINDOW);
  const stuck = stuckEnquiries(inbox.items, now);

  // ---- listing stats
  const dayNow = statsPerDay(stats.rows ?? [], range.current);
  const dayBefore = statsPerDay(stats.rows ?? [], range.previous);
  const views = sum(dayNow.map((d) => d.views));
  const viewsBefore = sum(dayBefore.map((d) => d.views));
  const currentRows = (stats.rows ?? []).filter((r) => r.date >= range.current[0]);
  const viewsPerListing = viewsByListing(currentRows);

  // ---- listings
  const cutoff = now - WINDOW * DAY_MS;
  const enquiriesFor = (id: string) => inbox.items.filter((e) => e.propertyId === id);
  const recentEnquiriesFor = (id: string) => enquiriesFor(id).filter((e) => (e.createdAt?.getTime() ?? 0) >= cutoff).length;
  const activeListings = listings.items.filter((l) => (ACTIVE_CATALOGUE_STATUSES as readonly string[]).includes(l.status));
  const sentBack = listings.items.filter((l) => l.status === "Needs changes");
  const noMandate = listings.items.filter((l) => NEEDS_MANDATE.includes(l.status) && !(l.mandateType && l.disclosureSignedOn));
  const ranked = [...activeListings].sort(
    (a, b) => recentEnquiriesFor(b.id) - recentEnquiriesFor(a.id) || (viewsPerListing.get(b.id) ?? 0) - (viewsPerListing.get(a.id) ?? 0),
  );
  const top = ranked[0] ?? null;
  const topHasActivity = top ? recentEnquiriesFor(top.id) > 0 || (viewsPerListing.get(top.id) ?? 0) > 0 : false;
  const topSaves = top ? sum(currentRows.filter((r) => r.listingId === top.id).map((r) => r.saves)) : 0;

  // ---- statement card copy
  const firstName = (record?.fullName || user?.displayName || "").trim().split(/\s+/)[0] ?? "";
  const waitingLine =
    unanswered.length > 0 ? (
      <>
        <strong>
          {unanswered.length} {unanswered.length === 1 ? "buyer is" : "buyers are"} waiting
        </strong>
        {oldest ? `, the oldest for ${formatAge(oldest, now)}` : ""}.{" "}
      </>
    ) : inbox.items.length > 0 ? (
      <>Every buyer has had a reply. </>
    ) : null;
  const viewsChange = changeWords(views, viewsBefore);
  const viewsLine = statsReady && views > 0 ? `Your listings drew ${views.toLocaleString("en-ZA")} views in the last ${WINDOW} days${viewsChange ? `, ${viewsChange}` : ""}.` : "";

  // ---- needs you today
  type TodayItem = { key: string; kind: keyof typeof ICON; title: string; detail: string; href: string; age?: { label: string; tone: "late" | "soon" | "neutral" } };
  const today: TodayItem[] = [
    ...(invites ?? []).map((invite) => ({
      key: `invite-${invite.id}`,
      kind: "invite" as const,
      title: `${invite.agencyName} invited you to join`,
      detail: "Accept or decline on your profile.",
      href: "/agent/profile",
    })),
    ...(compliance && (compliance.kind === "none" || compliance.kind === "rejected")
      ? [
          {
            key: "ffc",
            kind: "ffc" as const,
            title: compliance.kind === "none" ? "File your Fidelity Fund Certificate" : "Correct your certificate details",
            detail: complianceMessage(compliance, record),
            href: "/agent/profile",
          },
        ]
      : []),
    ...unanswered.map((item) => {
      const waited = item.createdAt ? now - item.createdAt.getTime() : 0;
      return {
        key: `enq-${item.id}`,
        kind: "enquiry" as const,
        title: `Reply to ${item.contactName || "a buyer"}`,
        detail: `${item.kind === "message" ? "Message" : "Viewing request"} · ${item.propertyTitle}`,
        href: `/agent/enquiries?show=new#enquiry-${item.id}`,
        age: item.createdAt
          ? { label: formatAge(item.createdAt, now), tone: waited > 24 * 60 * 60 * 1000 ? ("late" as const) : waited > REPLY_TARGET_MS ? ("soon" as const) : ("neutral" as const) }
          : undefined,
      };
    }),
    ...sentBack.map((listing) => ({
      key: `lst-${listing.id}`,
      kind: "listing" as const,
      title: `Changes requested on ${listing.title}`,
      detail: listing.moderationFeedback ? `Moderator: “${listing.moderationFeedback}”` : "The moderator sent this listing back.",
      href: `/agent/listings?status=${encodeURIComponent("Needs changes")}`,
    })),
    ...noMandate.map((listing) => ({
      key: `mandate-${listing.id}`,
      kind: "mandate" as const,
      title: `Record the mandate for ${listing.title}`,
      detail: !listing.mandateType ? "Sole or open mandate, and the day the seller signed the disclosure form." : "Add the day the seller signed the disclosure form.",
      href: `/agent/listings/${listing.id}?tab=overview`,
    })),
  ];

  const funnel = funnelCounts(inbox.items);
  const [medianFigure, medianUnit] = reply ? splitAge(formatAge(new Date(0), reply.ms)) : ["–", ""];
  const ffcDays = compliance && (compliance.kind === "verified" || compliance.kind === "expiring") ? compliance.daysLeft : null;

  return (
    <>
      {uid === null ? (
        <p className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          Sign in as an agent to see your listings and enquiries.
        </p>
      ) : null}

      {compliance && (compliance.kind === "expiring" || compliance.kind === "expired") ? (
        <p
          role="status"
          className={`mb-4 rounded-control border p-3.5 text-sm ${
            compliance.kind === "expired"
              ? "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200"
              : "border-amber-300/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200"
          }`}
        >
          {complianceMessage(compliance, record)}{" "}
          <Link href="/agent/profile" className={linkClass}>Update your certificate</Link>
        </p>
      ) : null}

      {inbox.state === "error" || listings.state === "error" ? (
        <p role="alert" className={`mb-4 ${errorBoxClass}`}>
          Part of your dashboard couldn&rsquo;t be loaded. Check your connection and refresh the page.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <StatementCard
          className="lg:col-span-8"
          eyebrow={longToday(now)}
          title={
            <>
              {greeting(now)}
              {firstName ? (
                <>
                  , <span className="text-[var(--dash-accent)]">{firstName}</span>
                </>
              ) : null}
            </>
          }
          lead={
            inboxReady ? (
              <>
                {waitingLine}
                {viewsLine}
              </>
            ) : (
              "Loading your day…"
            )
          }
          actions={
            <>
              {unanswered.length > 0 ? (
                <Link href="/agent/enquiries?show=new" className={heroPrimaryClass}>Reply to buyers</Link>
              ) : (
                <Link href="/agent/enquiries" className={heroPrimaryClass}>Open enquiries</Link>
              )}
              <Link href="/seller/listings/new" className={heroSecondaryClass}>New listing</Link>
            </>
          }
          photo={top?.image ? { src: top.image, alt: top.title } : null}
          spot={
            top && topHasActivity ? (
              <Link href={`/agent/listings/${top.id}`} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--dash-accent-hero)]">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                  Top listing · {WINDOW} days
                </p>
                <p className="mt-1.5 font-semibold">{top.title}</p>
                <p className="text-sm text-[var(--dash-hero-muted)]">{top.numericPrice ? formatZAR(top.numericPrice) : top.price}</p>
                <dl className="mt-2.5 flex gap-5 text-xs text-[var(--dash-hero-muted)]">
                  {[
                    [viewsPerListing.get(top.id) ?? 0, "views"],
                    [recentEnquiriesFor(top.id), "enquiries"],
                    [topSaves, "saves"],
                  ].map(([value, label]) => (
                    <div key={label} className="flex flex-col-reverse">
                      <dt>{label}</dt>
                      <dd className="text-lg font-semibold tabular-nums text-[var(--dash-hero-ink)]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Link>
            ) : null
          }
        />

        <div className="lg:col-span-4">
          <RingCard
            label="Speed to lead"
            sub={`Median first reply · last ${WINDOW} days`}
            ring={
              <Ring
                value={replies?.withinTarget ?? 0}
                label={replies ? `${Math.round(replies.withinTarget * 100)}% of first replies within an hour` : "No replies counted yet"}
                text={replies ? undefined : "–"}
              />
            }
            figure={inboxReady ? medianFigure : "–"}
            unit={medianUnit}
            status={
              !inboxReady
                ? undefined
                : reply
                  ? reply.ms <= REPLY_TARGET_MS
                    ? "On target · under 1 h"
                    : "Over the 1 h target"
                  : "Counted once you move a new enquiry on"
            }
            minis={[
              { value: replies ? String(replies.count) : "0", label: "Counted" },
              { value: replies ? `${Math.round(replies.withinTarget * 100)}%` : "–", label: "Within 1 h" },
              { value: replies ? formatAge(new Date(0), replies.slowestMs) : "–", label: "Slowest" },
            ]}
          />
        </div>

        <section aria-label={`Totals, last ${WINDOW} days`} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
          <KpiCard
            label="New enquiries"
            value={inboxReady ? String(sum(enquiriesNow)) : null}
            delta={inboxReady ? <Delta now={sum(enquiriesNow)} before={sum(enquiriesBefore)} /> : null}
            trend={inboxReady ? <TrendLine values={enquiriesNow} /> : null}
            detail={`Last ${WINDOW} days vs the ${WINDOW} before`}
          />
          {(
            [
              ["Views", "views"],
              ["Saves", "saves"],
              ["Contact clicks", "contactClicks"],
            ] as const
          ).map(([label, key]) => {
            const valueNow = sum(dayNow.map((d) => d[key]));
            const valueBefore = sum(dayBefore.map((d) => d[key]));
            return (
              <KpiCard
                key={key}
                label={label}
                value={statsReady ? valueNow.toLocaleString("en-ZA") : stats.failed ? "Error" : null}
                delta={statsReady ? <Delta now={valueNow} before={valueBefore} /> : null}
                trend={statsReady ? <TrendLine values={dayNow.map((d) => d[key])} /> : null}
                detail={`All listings · last ${WINDOW} days`}
              />
            );
          })}
        </section>

        <DashCard
          title="Needs you today"
          className="lg:col-span-5"
          aside={
            today.length > TODAY_LIMIT ? (
              <Link href="/agent/enquiries?show=new" className={linkClass}>See all {today.length}</Link>
            ) : undefined
          }
        >
          {!inboxReady || !listingsReady ? (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
          ) : today.length === 0 ? (
            <p className={emptyBoxClass}>Nothing needs you right now. New enquiries, listings sent back by a moderator and missing mandates show here.</p>
          ) : (
            <ul className="space-y-2">
              {today.slice(0, TODAY_LIMIT).map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className={`${rowClass} flex items-center gap-3 hover:border-[var(--dash-line-2)]`}>
                    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--dash-track)] text-[var(--dash-d1)]">
                      {ICON[item.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{item.title}</span>
                      <span className="block truncate text-xs text-slate-600 dark:text-slate-400">{item.detail}</span>
                    </span>
                    {item.age ? <AgeChip label={item.age.label} tone={item.age.tone} /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashCard>

        <DashCard title="Buyer pipeline" className="lg:col-span-7" aside="Every enquiry · how far buyers got">
          {!inboxReady ? (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
          ) : inbox.items.length === 0 ? (
            <p className={emptyBoxClass}>No enquiries yet. Once buyers get in touch, this shows how many you moved to a viewing, an offer and a sale.</p>
          ) : (
            <>
              <Funnel label="Enquiries by the furthest stage reached" steps={funnel.map((f) => ({ label: STAGE_LABEL[f.stage], count: f.count }))} />
              {stuck.length > 0 ? (
                <p className="mt-4 rounded-xl border border-[var(--dash-line)] border-l-[3px] border-l-[var(--dash-accent)] bg-[var(--dash-card-2)] px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                  {stuck.length} {stuck.length === 1 ? "enquiry hasn't" : "enquiries haven't"} moved in more than 7 days.{" "}
                  <Link href="/agent/enquiries" className={linkClass}>Follow up</Link>
                </p>
              ) : null}
            </>
          )}
        </DashCard>

        <DashCard
          title="Performance"
          className="lg:col-span-8"
          aside={
            <span className="flex flex-wrap gap-3">
              <Swatch color="var(--dash-d3)" label="Views" />
              <Swatch color="var(--dash-d1)" label="Contact clicks" />
              <Swatch color="var(--dash-accent)" label="Today" />
            </span>
          }
        >
          {statsReady ? (
            <DailyBars
              days={range.current}
              bars={dayNow.map((d) => d.views)}
              line={dayNow.map((d) => d.contactClicks)}
              barLabel="Views"
              lineLabel="Contact clicks"
              formatDay={shortDay}
            />
          ) : (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{stats.failed ? "Views couldn't be loaded. Refresh the page." : "Loading…"}</p>
          )}
        </DashCard>

        <DashCard
          title="Compliance"
          className="lg:col-span-4"
          aside={
            compliance ? (
              <AgeChip
                label={{ none: "Not filed", pending: "Waiting for review", rejected: "Not accepted", expired: "Expired", expiring: "Renew soon", verified: "Verified" }[compliance.kind]}
                tone={compliance.kind === "verified" ? "good" : compliance.kind === "expiring" || compliance.kind === "pending" ? "soon" : "late"}
              />
            ) : undefined
          }
        >
          {!compliance ? (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
          ) : ffcDays !== null && record ? (
            <div className="flex items-center gap-5 text-slate-900 dark:text-white">
              <Ring tone="card" size={104} value={Math.min(1, ffcDays / 365)} label={`${ffcDays} days left on your certificate`} text={`${ffcDays} d`} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">Fidelity Fund Certificate</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-[-0.03em]">{ffcDays} days</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">left · renew by {formatDate(record.ffcExpiry)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {complianceMessage(compliance, record)} <Link href="/agent/profile" className={linkClass}>Open your profile</Link>
            </p>
          )}
          {listingsReady && noMandate.length > 0 ? (
            <p className="mt-4 rounded-xl border border-[var(--dash-line)] border-l-[3px] border-l-[var(--dash-accent)] bg-[var(--dash-card-2)] px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
              {noMandate.length} {noMandate.length === 1 ? "listing still needs its" : "listings still need their"} mandate recorded.
            </p>
          ) : null}
        </DashCard>

        <DashCard title="Your listings" className="lg:col-span-12" aside={<Link href="/agent/listings" className={linkClass}>Manage listings</Link>}>
          {!listingsReady ? (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
          ) : listings.items.length === 0 ? (
            <p className={emptyBoxClass}>
              No listings yet. <Link href="/seller/listings/new" className={linkClass}>Add your first listing</Link>
            </p>
          ) : (
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <caption className="sr-only">Your listings with their status, health and last {WINDOW} days of views</caption>
                <thead className="text-left text-xs font-semibold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-3 pb-3">Listing</th>
                    <th scope="col" className="px-3 pb-3">Status</th>
                    <th scope="col" className="px-3 pb-3">Health</th>
                    <th scope="col" className="px-3 pb-3">Views · {WINDOW} d</th>
                    <th scope="col" className="px-3 pb-3 text-right">Enquiries</th>
                  </tr>
                </thead>
                <tbody>
                  {[...listings.items]
                    .sort((a, b) => (viewsPerListing.get(b.id) ?? 0) - (viewsPerListing.get(a.id) ?? 0))
                    .slice(0, LISTING_ROWS)
                    .map((listing) => {
                      const daily = range.current.map((d) => currentRows.filter((r) => r.listingId === listing.id && r.date === d).reduce((a, r) => a + r.views, 0));
                      return (
                        <tr key={listing.id} className="border-t border-[var(--dash-line)]">
                          <td className="px-3 py-2.5">
                            <Link href={`/agent/listings/${listing.id}`} className="flex min-w-[220px] items-center gap-3 rounded-lg hover:opacity-90">
                              {listing.image ? (
                                // eslint-disable-next-line @next/next/no-img-element -- Storage URLs of any size
                                <img src={listing.image} alt="" className="h-11 w-16 shrink-0 rounded-lg border border-[var(--dash-line)] object-cover" />
                              ) : (
                                <span aria-hidden="true" className="h-11 w-16 shrink-0 rounded-lg border border-[var(--dash-line)] [background:var(--dash-hero)]" />
                              )}
                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-slate-900 dark:text-white">{listing.title}</span>
                                <span className="block text-xs text-slate-600 dark:text-slate-400">{listing.numericPrice ? formatZAR(listing.numericPrice) : listing.price}</span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-3 py-2.5">
                            <AgeChip
                              label={listing.status}
                              tone={listing.status === "Needs changes" ? "late" : listing.status === "Under offer" ? "soon" : "neutral"}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            {typeof listing.qualityScore === "number" ? (
                              <span className="flex min-w-[120px] items-center gap-2">
                                <Meter value={listing.qualityScore} max={100} height={6} />
                                <b className="w-7 text-right text-xs tabular-nums">{listing.qualityScore}</b>
                              </span>
                            ) : (
                              <span className="text-slate-500">–</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="flex min-w-[170px] items-center gap-3">
                              <span className="w-28">{statsReady ? <TrendLine values={daily} height={28} /> : null}</span>
                              <b className="tabular-nums">{statsReady ? (viewsPerListing.get(listing.id) ?? 0) : "–"}</b>
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{inboxReady ? enquiriesFor(listing.id).length : "–"}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </DashCard>
      </div>
    </>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ background: color }} />
      {label}
    </span>
  );
}
