"use client";

import Link from "next/link";
import { useState } from "react";

import {
  emptyBoxClass,
  errorBoxClass,
  formatAge,
  linkClass,
  PageHeading,
  panelClass,
  primaryButtonClass,
  rowClass,
  StatTile,
} from "@/components/dashboard-ui";
import { useAgencyInvites } from "@/components/agency-membership";
import { useAuth } from "@/components/auth-provider";
import { useOwnerInquiries } from "@/components/enquiry-inbox";
import { complianceMessage, usePractitioner } from "@/components/practitioner-profile";
import { complianceState } from "@/lib/practitioner-compliance";
import { lastDays, sumStats } from "@/lib/listing-stats";
import { useOwnerStats } from "@/lib/listing-stats-client";
import { medianReplyMs } from "@/lib/seller-inquiries";
import { useAccountUid, useOwnerListings } from "@/lib/use-owner-listings";
import { ACTIVE_CATALOGUE_STATUSES } from "@/lib/types/domain";

// Pattern 4 — Dashboard / Overview (docs/dashboards/PLAN.md, Phase A).
// A glance, read-only: five figures and what needs the agent today, each line
// linking to the page where it is dealt with. The enquiry inbox that used to
// sit here (with its status buttons) is /agent/enquiries now; the listing rows
// are /agent/listings. Views come from listing_stats (Phase B).

const TODAY_LIMIT = 6;

/** Listing states in which the agent must hold a mandate and a signed disclosure (PLAN.md F3). */
const NEEDS_MANDATE = ["Submitted", "Needs changes", "Approved", "Published", "Under offer", "Paused"];

export default function AgentDashboard() {
  const uid = useAccountUid();
  const inbox = useOwnerInquiries(uid);
  const listings = useOwnerListings(uid);
  const [since] = useState(() => lastDays(7)[0]);
  const stats = useOwnerStats(uid, since);
  const [now] = useState(() => Date.now());
  const practitioner = usePractitioner(uid);
  const { user } = useAuth();
  const { invites } = useAgencyInvites(user?.email);
  const record = practitioner.load.state === "ready" ? practitioner.load.record : null;
  const compliance = practitioner.load.state === "ready" ? complianceState(record, now) : null;

  const unanswered = inbox.items
    .filter((item) => item.status === "new")
    .sort((a, b) => (a.createdAt?.getTime() ?? now) - (b.createdAt?.getTime() ?? now));
  const oldest = unanswered.find((item) => item.createdAt)?.createdAt ?? null;
  const reply = medianReplyMs(inbox.items, now, 30);
  const activeListings = listings.items.filter((listing) =>
    (ACTIVE_CATALOGUE_STATUSES as readonly string[]).includes(listing.status),
  ).length;
  const sentBack = listings.items.filter((listing) => listing.status === "Needs changes");
  const noMandate = listings.items.filter(
    (listing) => NEEDS_MANDATE.includes(listing.status) && !(listing.mandateType && listing.disclosureSignedOn),
  );

  const inboxReady = inbox.state === "ready";
  const listingsReady = listings.state === "ready";

  type TodayItem = { key: string; title: string; detail: string; href: string; age?: string };
  const today: TodayItem[] = [
    ...(invites ?? []).map((invite) => ({
      key: `invite-${invite.id}`,
      title: `${invite.agencyName} invited you to join`,
      detail: "Accept or decline on your profile.",
      href: "/agent/profile",
    })),
    ...(compliance && (compliance.kind === "none" || compliance.kind === "rejected")
      ? [{
          key: "ffc",
          title: compliance.kind === "none" ? "File your Fidelity Fund Certificate" : "Correct your certificate details",
          detail: complianceMessage(compliance, record),
          href: "/agent/profile",
        }]
      : []),
    ...unanswered.map((item) => ({
      key: `enq-${item.id}`,
      title: `Reply to ${item.contactName || "a buyer"}`,
      detail: `${item.kind === "message" ? "Message" : "Viewing request"} · ${item.propertyTitle}`,
      href: `/agent/enquiries?show=new#enquiry-${item.id}`,
      age: item.createdAt ? `Waiting ${formatAge(item.createdAt, now)}` : undefined,
    })),
    ...sentBack.map((listing) => ({
      key: `lst-${listing.id}`,
      title: `Changes requested on ${listing.title}`,
      detail: listing.moderationFeedback ? `Moderator: “${listing.moderationFeedback}”` : "The moderator sent this listing back.",
      href: `/agent/listings?status=${encodeURIComponent("Needs changes")}`,
    })),
    ...noMandate.map((listing) => ({
      key: `mandate-${listing.id}`,
      title: `Record the mandate for ${listing.title}`,
      detail: !listing.mandateType ? "Sole or open mandate, and the day the seller signed the disclosure form." : "Add the day the seller signed the disclosure form.",
      href: `/agent/listings/${listing.id}?tab=overview`,
    })),
  ];

  return (
    <>
      <PageHeading
        title="Agent dashboard"
        description="What needs you today, at a glance. Reply to buyers in Enquiries and manage homes in Listings."
        action={
          <Link href="/seller/listings/new" className={primaryButtonClass}>
            New listing
          </Link>
        }
      />

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

      <section aria-label="Totals" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="New enquiries" value={inboxReady ? `${unanswered.length}` : null} />
        <StatTile
          label="Oldest unanswered"
          value={inboxReady ? (oldest ? formatAge(oldest, now) : "None") : null}
          detail={inboxReady && !oldest && inbox.items.length > 0 ? "Every enquiry has a reply." : undefined}
        />
        <StatTile
          label="Reply time"
          value={inboxReady ? (reply ? formatAge(new Date(0), reply.ms) : "None yet") : null}
          detail={
            inboxReady
              ? reply
                ? `Median first reply, ${reply.count} ${reply.count === 1 ? "enquiry" : "enquiries"}, last 30 days`
                : "Counted once you move a new enquiry on"
              : undefined
          }
        />
        <StatTile
          label="Views"
          value={stats.rows ? String(sumStats(stats.rows).views) : stats.failed ? "Error" : null}
          detail="Last 7 days, all listings"
        />
        <StatTile label="Active listings" value={listingsReady ? `${activeListings}` : null} detail="Published or under offer" />
      </section>

      <section aria-labelledby="today-heading" className={panelClass}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="today-heading" className="text-2xl font-semibold text-slate-900 dark:text-white">Needs you today</h2>
          {today.length > TODAY_LIMIT ? (
            <Link href="/agent/enquiries?show=new" className={`text-sm ${linkClass}`}>
              See all {unanswered.length} new enquiries
            </Link>
          ) : null}
        </div>

        {inbox.state === "error" || listings.state === "error" ? (
          <p role="alert" className={`mb-3 ${errorBoxClass}`}>
            Part of your dashboard couldn&rsquo;t be loaded. Check your connection and refresh the page.
          </p>
        ) : null}

        {!inboxReady || !listingsReady ? (
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
        ) : today.length === 0 ? (
          <p className={emptyBoxClass}>Nothing needs you right now. New enquiries, listings sent back by a moderator and missing mandates show here.</p>
        ) : (
          <ul className="space-y-3">
            {today.slice(0, TODAY_LIMIT).map((item) => (
              <li key={item.key}>
                <Link href={item.href} className={`${rowClass} flex flex-wrap items-center justify-between gap-x-4 gap-y-1 hover:border-slate-300 hover:bg-white dark:hover:bg-surface-ink`}>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900 dark:text-white">{item.title}</span>
                    <span className="mt-0.5 block truncate text-sm text-slate-600 dark:text-slate-300">{item.detail}</span>
                  </span>
                  <span className="flex items-center gap-3 text-sm">
                    {item.age ? <span className="font-semibold text-amber-800 dark:text-amber-300">{item.age}</span> : null}
                    <span aria-hidden="true" className="text-slate-400">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
