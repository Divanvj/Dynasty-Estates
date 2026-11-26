"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { useAuth } from "@/components/auth-provider";
import { Meter } from "@/components/charts/meter";
import {
  AgeChip,
  ConfirmDialog,
  emptyBoxClass,
  errorBoxClass,
  FilterChips,
  formatAge,
  ListingThumb,
  listingStatusTone,
  linkClass,
  PageHeading,
  panelClass,
  primaryButtonClass,
  searchInputClass,
  secondaryButtonClass,
  SummaryStrip,
  tableFrameClass,
} from "@/components/dashboard-ui";
import { QUEUE_TARGET_MS } from "@/lib/dashboard-math";
import { ArrowLeftIcon, CheckIcon, InfoCircleIcon, SearchIcon } from "@/components/icons";
import { formatDate } from "@/lib/formatters";
import {
  executeModerationDecision,
  getPendingModerationQueue,
  type ModerationDecision,
  type ModerationItem,
} from "@/lib/moderation";

// Pattern 8 — Split Pane (docs/dashboards/PLAN.md, Phase A). Triage submitted
// listings without leaving the page: compact list on the left, the selected
// listing on the right. Fraud signals, which had their own tab, show on the
// item and as a filter. On phones the list is full width and choosing an item
// shows it full width with "Back to the queue".

type Show = "all" | "fraud";

const DONE_LABEL: Record<ModerationDecision, string> = {
  Approved: "Published",
  "Needs changes": "Sent back for changes",
  Rejected: "Rejected",
};

function ModerationQueue() {
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const [queue, setQueue] = useState<ModerationItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(params.get("id"));
  const [mobileDetail, setMobileDetail] = useState(Boolean(params.get("id")));
  const [show, setShow] = useState<Show>("all");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteError, setNoteError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const searchId = useId();
  const noteId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    getPendingModerationQueue()
      .then((items) => {
        if (cancelled) return;
        // Oldest first: whoever has waited longest is reviewed first.
        setQueue([...items].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)));
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  const items = queue ?? [];
  const fraudCount = items.filter((item) => (item.fraudSignals ?? []).length > 0).length;
  const oldest = items.reduce<number | null>((min, item) => {
    const at = new Date(item.submittedAt).getTime();
    return min === null || at < min ? at : min;
  }, null);
  const overDay = items.filter((item) => now - new Date(item.submittedAt).getTime() > QUEUE_TARGET_MS).length;
  const term = search.trim().toLowerCase();
  const visible = items
    .filter((item) => show === "all" || (item.fraudSignals ?? []).length > 0)
    .filter((item) => !term || `${item.title} ${item.location}`.toLowerCase().includes(term));
  const selected = visible.find((item) => item.id === selectedId) ?? visible[0] ?? null;
  const note = selected ? notes[selected.id] ?? "" : "";

  function select(id: string, openOnPhone: boolean) {
    setSelectedId(id);
    setNoteError(null);
    setActionError(null);
    if (openOnPhone) setMobileDetail(true);
  }

  // Up/Down move the selection; Enter moves focus into the detail.
  function onListKey(event: KeyboardEvent<HTMLUListElement>) {
    if (!selected || !["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) return;
    event.preventDefault();
    const index = visible.findIndex((item) => item.id === selected.id);
    if (event.key === "Enter") {
      setMobileDetail(true);
      document.getElementById("moderation-detail")?.focus();
      return;
    }
    const next = visible[Math.min(visible.length - 1, Math.max(0, index + (event.key === "ArrowDown" ? 1 : -1)))];
    if (next) {
      select(next.id, false);
      listRef.current?.querySelector<HTMLButtonElement>(`[data-id="${CSS.escape(next.id)}"]`)?.focus();
    }
  }

  async function decide(item: ModerationItem, decision: ModerationDecision) {
    const feedback = (notes[item.id] ?? "").trim();
    if (decision !== "Approved" && !feedback) {
      setNoteError("Tell the seller what to change. They see this note.");
      document.getElementById(noteId)?.focus();
      return;
    }
    if (!user) return;
    setBusy(true);
    setActionError(null);
    try {
      await executeModerationDecision(item.id, decision, feedback, user.uid, user.email ?? user.uid);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : `Could not apply the "${decision}" decision.`);
      setBusy(false);
      setConfirmReject(false);
      return;
    }
    // It leaves the queue (no longer Submitted); select the next one.
    const index = visible.findIndex((row) => row.id === item.id);
    const next = visible[index + 1] ?? visible[index - 1] ?? null;
    setQueue((prev) => (prev ?? []).filter((row) => row.id !== item.id));
    setSelectedId(next?.id ?? null);
    setBusy(false);
    setConfirmReject(false);
    setNotice(`${DONE_LABEL[decision]}: “${item.title}”.`);
  }

  const listHidden = mobileDetail ? "hidden lg:block" : "";
  const detailHidden = mobileDetail ? "" : "hidden lg:block";

  return (
    <>
      <PageHeading
        title="Moderation"
        description="Listings waiting for review, oldest first. Approving publishes the listing; the seller sees your note on changes and rejections."
      />

      <SummaryStrip
        label="Queue at a glance"
        items={[
          { label: "Waiting for review", value: queue ? String(items.length) : null, note: "Submitted listings" },
          {
            label: "Oldest",
            value: queue ? (oldest !== null ? formatAge(new Date(oldest), now) : "–") : null,
            note: overDay ? `${overDay} past the 24 h target` : "All within 24 h",
            tone: overDay ? "late" : undefined,
          },
          {
            label: "Fraud signals",
            value: queue ? String(fraudCount) : null,
            note: fraudCount ? "Check these first" : "None flagged",
            tone: fraudCount ? "late" : undefined,
          },
        ]}
      />

      {notice ? (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-[var(--dash-line-2)] border-l-[3px] border-l-[var(--dash-d1)] bg-[var(--dash-card)] px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200">
          <CheckIcon className="h-4 w-4 shrink-0" />
          {notice}
        </p>
      ) : null}
      {actionError ? <p role="alert" className={`mb-4 ${errorBoxClass}`}>{actionError}</p> : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-sm">
          <label htmlFor={searchId} className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Search</label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon className="h-4 w-4" /></span>
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, seller or suburb"
              className={searchInputClass}
            />
          </div>
        </div>
        <FilterChips<Show>
          label="Show listings"
          value={show}
          onChange={setShow}
          options={[
            { value: "all", label: "All", count: queue ? items.length : undefined },
            { value: "fraud", label: "Fraud signals", count: queue ? fraudCount : undefined },
          ]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
        {/* Left: compact list. */}
        <div className={`${listHidden} ${tableFrameClass} self-start`}>
          {loadError ? (
            <p role="alert" className="p-4 text-sm text-rose-800 dark:text-rose-200">The queue couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>
          ) : !queue ? (
            <p role="status" className="p-4 text-sm text-slate-600 dark:text-slate-400">Loading the queue…</p>
          ) : visible.length === 0 ? (
            <p className="p-4 text-sm text-slate-600 dark:text-slate-400">
              {items.length === 0 ? "Nothing is waiting for review." : "No listings match."}
            </p>
          ) : (
            <ul ref={listRef} aria-label="Listings waiting for review" onKeyDown={onListKey} className="max-h-[70vh] divide-y divide-[var(--dash-line)] overflow-y-auto">
              {visible.map((item) => {
                const active = selected?.id === item.id;
                const flagged = (item.fraudSignals ?? []).length > 0;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-id={item.id}
                      aria-current={active ? "true" : undefined}
                      onClick={() => select(item.id, true)}
                      className={`relative flex w-full cursor-pointer gap-3 px-4 py-3.5 text-left ${
                        active
                          ? "bg-[var(--dash-card-2)] before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[var(--dash-d1)]"
                          : "hover:bg-[var(--dash-card-2)]"
                      }`}
                    >
                      <ListingThumb src={item.image} className="h-12 w-16" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0 truncate font-semibold text-slate-900 dark:text-white">{item.title}</span>
                        <AgeChip
                          label={formatAge(new Date(item.submittedAt), now)}
                          tone={now - new Date(item.submittedAt).getTime() > QUEUE_TARGET_MS ? "late" : "neutral"}
                        />
                      </span>
                      <span className="truncate text-xs text-slate-600 dark:text-slate-400">{item.location || "Location not given"}</span>
                      {flagged ? (
                        <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-[var(--dash-down-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--dash-down)]">
                          <InfoCircleIcon className="h-3.5 w-3.5" /> Fraud signal
                        </span>
                      ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: the selected listing. */}
        <section
          id="moderation-detail"
          tabIndex={-1}
          aria-label="Selected listing"
          className={`${detailHidden} ${panelClass} focus:outline-none`}
        >
          <button type="button" onClick={() => setMobileDetail(false)} className={`mb-4 lg:hidden ${secondaryButtonClass}`}>
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" /> Back to the queue
          </button>

          {!selected ? (
            <p className={emptyBoxClass}>
              {!queue ? "Loading…" : items.length === 0 ? "The queue is clear. New submissions show here." : "Choose a listing to review it."}
            </p>
          ) : (
            <>
              {selected.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote listing photo, any host
                <img src={selected.image} alt={`Cover photo of ${selected.title}`} className="mb-5 aspect-[16/9] w-full rounded-2xl border border-[var(--dash-line)] object-cover" />
              ) : (
                <p className="mb-5 flex h-28 w-full items-center justify-center rounded-2xl border border-[var(--dash-hero-line)] text-sm text-[var(--dash-hero-muted)] [background:var(--dash-hero)]">No photo on this listing.</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <AgeChip label={selected.status} tone={listingStatusTone(selected.status)} />
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span className="w-20"><Meter value={selected.qualityScore} max={100} height={6} /></span>
                  Quality {selected.qualityScore}%
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{selected.title}</h2>
              <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{selected.price}</p>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div><dt className="inline text-slate-600 dark:text-slate-400">Where: </dt><dd className="inline">{selected.location || "Not given"}</dd></div>
                <div><dt className="inline text-slate-600 dark:text-slate-400">Seller: </dt><dd className="inline break-all">{selected.ownerId ? <SellerContact key={selected.id} listingId={selected.id} /> : "No owner on record"}</dd></div>
                <div><dt className="inline text-slate-600 dark:text-slate-400">Submitted: </dt><dd className="inline">{formatDate(selected.submittedAt)} ({formatAge(new Date(selected.submittedAt), now)} ago)</dd></div>
              </dl>

              {(selected.fraudSignals ?? []).length > 0 ? (
                <div className="mt-4 rounded-2xl border border-[var(--dash-down)]/25 bg-[var(--dash-down-soft)] p-4">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--dash-down)]">
                    <InfoCircleIcon className="h-4 w-4" /> Fraud signals
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--dash-down)]">
                    {selected.fraudSignals?.map((signal) => <li key={signal}>{signal}</li>)}
                  </ul>
                </div>
              ) : null}

              <div className="mt-5">
                <label htmlFor={noteId} className="mb-1 block text-sm font-semibold text-slate-900 dark:text-white">
                  Note to the seller <span className="font-normal text-slate-600 dark:text-slate-400">(needed to send back or reject)</span>
                </label>
                <textarea
                  id={noteId}
                  rows={3}
                  value={note}
                  aria-invalid={noteError ? true : undefined}
                  aria-describedby={noteError ? `${noteId}-error` : undefined}
                  onChange={(event) => {
                    setNotes((prev) => ({ ...prev, [selected.id]: event.target.value }));
                    if (noteError) setNoteError(null);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dash-d1)] dark:border-white/15 dark:bg-surface-ink/80 dark:text-white"
                />
                {noteError ? <p id={`${noteId}-error`} className="mt-1 text-sm text-rose-800 dark:text-rose-300">{noteError}</p> : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => void decide(selected, "Approved")} className={primaryButtonClass}>
                  Approve and publish
                </button>
                <button type="button" disabled={busy} onClick={() => void decide(selected, "Needs changes")} className={secondaryButtonClass}>
                  Send back for changes
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!note.trim()) {
                      setNoteError("Tell the seller why it was rejected. They see this note.");
                      document.getElementById(noteId)?.focus();
                      return;
                    }
                    setConfirmReject(true);
                  }}
                  className="pill max-lg:min-h-11 border border-rose-300 bg-rose-50 font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-900/40"
                >
                  Reject…
                </button>
              </div>

              <ConfirmDialog
                open={confirmReject}
                title={`Reject “${selected.title}”?`}
                body={<p>The listing is archived and not published. The seller sees your note.</p>}
                confirmLabel="Reject listing"
                busy={busy}
                onConfirm={() => void decide(selected, "Rejected")}
                onCancel={() => setConfirmReject(false)}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default function AdminModerationPage() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-slate-600 dark:text-slate-400">Loading…</p>}>
      <ModerationQueue />
    </Suspense>
  );
}

/**
 * "Contact seller": the listing owner's name and e-mail address, fetched for
 * an admin from /api/admin/listing-seller when asked. The address used to sit
 * on the listing itself (ownerEmail), where anyone could read it once the
 * listing was published (audit item 1.5).
 */
function SellerContact({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seller, setSeller] = useState<{ name: string | null; email: string | null } | null>(null);

  async function load() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/listing-seller", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; name?: string | null; email?: string | null } | null;
      if (!response.ok) throw new Error(body?.error ?? "The seller’s details couldn’t be loaded.");
      setSeller({ name: body?.name ?? null, email: body?.email ?? null });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The seller’s details couldn’t be loaded.");
    } finally {
      setBusy(false);
    }
  }

  if (seller) {
    return (
      <>
        {seller.name ? `${seller.name} · ` : ""}
        {seller.email ? (
          <a href={`mailto:${seller.email}`} className={linkClass}>
            {seller.email}
          </a>
        ) : (
          "No e-mail address on the account"
        )}
      </>
    );
  }
  return (
    <>
      <button type="button" onClick={() => void load()} disabled={busy || !user} className={`${linkClass} disabled:opacity-60`}>
        {busy ? "Loading…" : "Contact seller"}
      </button>
      {error ? (
        <span role="alert" className="ml-2 text-xs text-[var(--dash-down)]">
          {error}
        </span>
      ) : null}
    </>
  );
}
