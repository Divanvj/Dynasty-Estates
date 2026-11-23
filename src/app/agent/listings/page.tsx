"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useId, useState } from "react";

import CustomSelect from "@/components/custom-select";
import { Meter } from "@/components/charts/meter";
import {
  AgeChip,
  linkClass,
  ListingThumb,
  listingStatusTone,
  PageHeading,
  primaryButtonClass,
  searchInputClass,
  SummaryStrip,
  tableFrameClass,
  tableHeadClass,
  tableRowClass,
} from "@/components/dashboard-ui";
import { useOwnerInquiries } from "@/components/enquiry-inbox";
import { SearchIcon } from "@/components/icons";
import { formatDate } from "@/lib/formatters";
import { lastDays } from "@/lib/listing-stats";
import { useOwnerStats, viewsByListing } from "@/lib/listing-stats-client";
import { CLOSED_LISTING_STATUSES } from "@/lib/seller-listings";
import { ACTIVE_CATALOGUE_STATUSES, PUBLIC_LISTING_STATUSES } from "@/lib/types/domain";
import { useAccountUid, useOwnerListings } from "@/lib/use-owner-listings";

// Pattern 1 — List / Index (docs/dashboards/PLAN.md, Phase A). Every listing
// this account filed, searchable and filterable by status. Views per listing
// come from listing_stats (Phase B).

const ALL = "all";

function ListingsIndex() {
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? ALL);
  const [search, setSearch] = useState("");
  const searchId = useId();
  const uid = useAccountUid();
  const listings = useOwnerListings(uid);
  const inbox = useOwnerInquiries(uid);
  const [since] = useState(() => lastDays(30)[0]);
  const stats = useOwnerStats(uid, since);
  const views = stats.rows ? viewsByListing(stats.rows) : null;

  const statuses = Array.from(new Set(listings.items.map((item) => item.status))).sort();
  const term = search.trim().toLowerCase();
  const rows = listings.items
    .filter((item) => status === ALL || item.status === status)
    .filter((item) => !term || `${item.title} ${item.location ?? ""}`.toLowerCase().includes(term))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const enquiryCount = (id: string) => inbox.items.filter((lead) => lead.propertyId === id).length;
  const filtered = status !== ALL || term !== "";
  const listingsReady = listings.state === "ready";
  const live = listings.items.filter((item) => (ACTIVE_CATALOGUE_STATUSES as readonly string[]).includes(item.status));
  const needsChanges = listings.items.filter((item) => item.status === "Needs changes");
  const totalViews = views ? [...views.values()].reduce((a, b) => a + b, 0) : 0;
  const maxViews = views ? Math.max(1, ...views.values()) : 1;

  return (
    <>
      <PageHeading
        title="Listings"
        description="Every home you have filed, with its status, views and enquiries. Open one to see how it is performing."
        action={
          <Link href="/seller/listings/new" className={primaryButtonClass}>
            New listing
          </Link>
        }
      />

      <SummaryStrip
        label="Listings at a glance"
        items={[
          { label: "Live", value: listingsReady ? String(live.length) : null, note: "Published or under offer" },
          {
            label: "Needs you",
            value: listingsReady ? String(needsChanges.length) : null,
            note: needsChanges.length ? "Sent back by a moderator" : "Nothing sent back",
            tone: needsChanges.length ? "late" : undefined,
          },
          { label: "Views, 30 days", value: views ? String(totalViews) : null, note: "All your listings" },
          { label: "Enquiries", value: inbox.state === "ready" ? String(inbox.items.length) : null, note: "All time" },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-sm">
          <label htmlFor={searchId} className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Search
          </label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <SearchIcon className="h-4 w-4" />
            </span>
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title or suburb"
              className={searchInputClass}
            />
          </div>
        </div>
        <CustomSelect
          label="Status"
          value={status}
          onChange={setStatus}
          className="w-48"
          options={[{ value: ALL, label: "All statuses" }, ...statuses.map((value) => ({ value, label: value }))]}
        />
      </div>

      {/* The table frame stays on screen while loading, empty or failed. */}
      <div className={tableFrameClass}>
        <div className="overflow-x-auto">
          {/* Messages sit below the scrolling table, so they never scroll off a phone. */}
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th scope="col" className="px-4 py-3">Listing</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Price</th>
                <th scope="col" className="px-4 py-3">Views, 30 d</th>
                <th scope="col" className="px-4 py-3 text-right">Enquiries</th>
                <th scope="col" className="px-4 py-3">Filed</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              {listings.state === "ready" &&
                rows.map((item) => {
                  const isPublic = (PUBLIC_LISTING_STATUSES as readonly string[]).includes(item.status);
                  const viewCount = views ? views.get(item.id) ?? 0 : null;
                  return (
                    <tr key={item.id} className={`${tableRowClass} align-middle transition-colors hover:bg-[var(--dash-card-2)]`}>
                      <td className="px-4 py-3">
                        {/* The title opens the listing's own page (Overview, Performance, Enquiries). */}
                        <div className="flex min-w-[240px] items-center gap-3">
                          <ListingThumb src={item.image} className="h-12 w-[4.5rem]" />
                          <div className="min-w-0">
                            <Link href={`/agent/listings/${item.id}`} className="tap-44 relative font-semibold text-slate-900 underline decoration-[var(--dash-line-2)] underline-offset-4 hover:decoration-[var(--dash-d1)] dark:text-white">
                              {item.title}
                            </Link>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{item.location}</p>
                            {item.status === "Needs changes" && item.moderationFeedback ? (
                              <p className="mt-1 text-xs text-[var(--dash-down)]">Moderator: &ldquo;{item.moderationFeedback}&rdquo;</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <AgeChip label={item.status} tone={listingStatusTone(item.status)} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold tabular-nums text-slate-900 dark:text-white">{item.price}</td>
                      <td className="px-4 py-3">
                        {viewCount === null ? (
                          "–"
                        ) : (
                          <span className="flex min-w-[130px] items-center gap-2.5">
                            <span className="w-20">
                              <Meter value={viewCount} max={maxViews} height={6} />
                            </span>
                            <b className="tabular-nums text-slate-900 dark:text-white">{viewCount}</b>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{inbox.state === "ready" ? enquiryCount(item.id) : "–"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.createdAt ? formatDate(item.createdAt) : "–"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {/* Only public listings have a public page; closed ones can't be edited. */}
                        <span className="inline-flex items-center gap-4">
                          {!CLOSED_LISTING_STATUSES.includes(item.status) ? (
                            <Link href={`/seller/listings/${item.id}/edit?from=agent-list`} className={linkClass}>
                              Edit<span className="sr-only"> {item.title}</span>
                            </Link>
                          ) : null}
                          {isPublic ? (
                            <Link href={`/property/${item.id}`} className={linkClass}>
                              Public page<span className="sr-only"> of {item.title}</span>
                            </Link>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
        {listings.state === "loading" ? (
          <p role="status" className="px-4 py-6 text-sm text-slate-600 dark:text-slate-400">Loading your listings…</p>
        ) : listings.state === "error" ? (
          <p role="alert" className="px-4 py-6 text-sm text-rose-800 dark:text-rose-200">Your listings couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-600 dark:text-slate-400">
            {filtered ? (
              <>
                No listings match.{" "}
                <button type="button" onClick={() => { setStatus(ALL); setSearch(""); }} className={`cursor-pointer ${linkClass}`}>
                  Clear the filters
                </button>
              </>
            ) : (
              <>
                You haven&rsquo;t filed a listing yet.{" "}
                <Link href="/seller/listings/new" className={linkClass}>Create your first listing</Link>
              </>
            )}
          </p>
        ) : null}
      </div>
    </>
  );
}

export default function AgentListingsPage() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-slate-600 dark:text-slate-400">Loading…</p>}>
      <ListingsIndex />
    </Suspense>
  );
}
