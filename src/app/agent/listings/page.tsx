"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useId, useState } from "react";

import CustomSelect from "@/components/custom-select";
import { linkClass, PageHeading, primaryButtonClass } from "@/components/dashboard-ui";
import { useOwnerInquiries } from "@/components/enquiry-inbox";
import { SearchIcon } from "@/components/icons";
import { formatDate } from "@/lib/formatters";
import { lastDays } from "@/lib/listing-stats";
import { useOwnerStats, viewsByListing } from "@/lib/listing-stats-client";
import { PUBLIC_LISTING_STATUSES } from "@/lib/types/domain";
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
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-white/15 dark:bg-surface-ink/80 dark:text-white dark:placeholder:text-slate-400"
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
      <div className="overflow-hidden rounded-card border border-slate-200 bg-white/70 shadow-sm dark:border-white/10 dark:bg-surface-panel/80">
        <div className="overflow-x-auto">
          {/* Messages sit below the scrolling table, so they never scroll off a phone. */}
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Listing</th>
                <th scope="col" className="px-4 py-3 font-bold">Status</th>
                <th scope="col" className="px-4 py-3 font-bold">Price</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">Views, 30 d</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">Enquiries</th>
                <th scope="col" className="px-4 py-3 font-bold">Filed</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:divide-white/10 dark:text-slate-300">
              {listings.state === "ready" &&
                rows.map((item) => {
                  const isPublic = (PUBLIC_LISTING_STATUSES as readonly string[]).includes(item.status);
                  return (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3">
                        {/* The title opens the listing's own page (Overview, Performance, Enquiries). */}
                        <Link href={`/agent/listings/${item.id}`} className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 dark:text-white dark:decoration-white/30 dark:hover:decoration-white">
                          {item.title}
                        </Link>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{item.location}</p>
                        {item.status === "Needs changes" && item.moderationFeedback ? (
                          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">Moderator: &ldquo;{item.moderationFeedback}&rdquo;</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-700 dark:border-white/10 dark:bg-surface-ink/80 dark:text-slate-300">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900 dark:text-white">{item.price}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{views ? views.get(item.id) ?? 0 : "–"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{inbox.state === "ready" ? enquiryCount(item.id) : "–"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{item.createdAt ? formatDate(item.createdAt) : "–"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {/* Only public listings have a public page; there is no edit screen yet. */}
                        {isPublic ? (
                          <Link href={`/property/${item.id}`} className={linkClass}>
                            Public page<span className="sr-only"> of {item.title}</span>
                          </Link>
                        ) : null}
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
