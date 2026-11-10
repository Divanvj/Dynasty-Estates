"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { useAuth } from "@/components/auth-provider";
import {
  ConfirmDialog,
  emptyBoxClass,
  errorBoxClass,
  FilterChips,
  formatAge,
  PageHeading,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/dashboard-ui";
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
  const term = search.trim().toLowerCase();
  const visible = items
    .filter((item) => show === "all" || (item.fraudSignals ?? []).length > 0)
    .filter((item) => !term || `${item.title} ${item.sellerEmail} ${item.location}`.toLowerCase().includes(term));
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

      {notice ? (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-100/80 px-4 py-2.5 text-sm font-medium text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200">
          <CheckIcon className="h-4 w-4 shrink-0" />
          {notice}
        </p>
      ) : null}
      {actionError ? <p role="alert" className={`mb-4 ${errorBoxClass}`}>{actionError}</p> : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <label htmlFor={searchId} className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Search</label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><SearchIcon className="h-4 w-4" /></span>
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Title, seller or suburb"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-white/15 dark:bg-surface-ink/80 dark:text-white dark:placeholder:text-slate-400"
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
        <div className={`${listHidden} overflow-hidden rounded-card border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-surface-panel/80`}>
          {loadError ? (
            <p role="alert" className="p-4 text-sm text-rose-800 dark:text-rose-200">The queue couldn&rsquo;t be loaded. Check your connection and refresh the page.</p>
          ) : !queue ? (
            <p role="status" className="p-4 text-sm text-slate-600 dark:text-slate-400">Loading the queue…</p>
          ) : visible.length === 0 ? (
            <p className="p-4 text-sm text-slate-600 dark:text-slate-400">
              {items.length === 0 ? "Nothing is waiting for review." : "No listings match."}
            </p>
          ) : (
            <ul ref={listRef} aria-label="Listings waiting for review" onKeyDown={onListKey} className="max-h-[70vh] divide-y divide-slate-200 overflow-y-auto dark:divide-white/10">
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
                      className={`flex w-full cursor-pointer flex-col gap-0.5 px-4 py-3 text-left ${
                        active ? "bg-emerald-50 dark:bg-emerald-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0 truncate font-semibold text-slate-900 dark:text-white">{item.title}</span>
                        <span className="shrink-0 text-xs text-slate-600 dark:text-slate-400">{formatAge(new Date(item.submittedAt), now)}</span>
                      </span>
                      <span className="truncate text-xs text-slate-600 dark:text-slate-400">{item.location || item.sellerEmail}</span>
                      {flagged ? (
                        <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                          <InfoCircleIcon className="h-3.5 w-3.5" /> Fraud signal
                        </span>
                      ) : null}
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
          className={`${detailHidden} rounded-card border border-slate-200 bg-white/70 p-5 focus:outline-none dark:border-white/10 dark:bg-surface-panel/80 md:p-6`}
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
                <img src={selected.image} alt={`Cover photo of ${selected.title}`} className="mb-4 aspect-[16/9] w-full rounded-control object-cover" />
              ) : (
                <p className="mb-4 rounded-control border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-white/15 dark:text-slate-400">No photo on this listing.</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900/10 px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:bg-white/10 dark:text-slate-200">{selected.status}</span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">Quality {selected.qualityScore}%</span>
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{selected.title}</h2>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-emerald-400">{selected.price}</p>
              <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div><dt className="inline text-slate-600 dark:text-slate-400">Where: </dt><dd className="inline">{selected.location || "Not given"}</dd></div>
                <div><dt className="inline text-slate-600 dark:text-slate-400">Seller: </dt><dd className="inline break-all">{selected.sellerEmail}</dd></div>
                <div><dt className="inline text-slate-600 dark:text-slate-400">Submitted: </dt><dd className="inline">{formatDate(selected.submittedAt)} ({formatAge(new Date(selected.submittedAt), now)} ago)</dd></div>
              </dl>

              {(selected.fraudSignals ?? []).length > 0 ? (
                <div className="mt-4 rounded-control border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-500/30 dark:bg-rose-950/30">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-rose-900 dark:text-rose-200">
                    <InfoCircleIcon className="h-4 w-4" /> Fraud signals
                  </h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-900 dark:text-rose-200">
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-white/15 dark:bg-surface-ink/80 dark:text-white"
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
