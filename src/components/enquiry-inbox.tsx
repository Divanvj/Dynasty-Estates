"use client";

import { useEffect, useState } from "react";

import { formatDateTime } from "@/lib/formatters";
import {
  getSellerInquiries,
  setSellerInquiryStatus,
  type SellerInquiry,
  type SellerInquiryStatus,
} from "@/lib/seller-inquiries";

/**
 * Enquiries on the signed-in account's own listings, shared by the seller
 * portal and the agent dashboard.
 *
 * The agent dashboard used to load any 20 enquiries on the platform, with no
 * owner filter and in no order, so every agent saw other agents' and private
 * sellers' buyers. Both pages now read only enquiries whose `ownerId` is the
 * signed-in account, newest first, and firestore.rules enforces the same.
 */

export type InboxState = "loading" | "ready" | "error";

/** `uid` is undefined while auth is still resolving, null when signed out. */
export function useOwnerInquiries(uid: string | null | undefined) {
  // The last load, tagged with the account it was for, so a stale result is
  // never shown after a sign-out or role switch.
  const [loaded, setLoaded] = useState<{ uid: string; items: SellerInquiry[]; failed: boolean } | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    getSellerInquiries(uid)
      .then((rows) => {
        if (!cancelled) setLoaded({ uid, items: rows, failed: false });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Could not load enquiries on this account's listings:", error);
        setLoaded({ uid, items: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const current = uid && loaded?.uid === uid ? loaded : null;
  const items = current?.items ?? [];
  const state: InboxState =
    uid === null ? "ready" : !current ? "loading" : current.failed ? "error" : "ready";

  function setItems(update: (rows: SellerInquiry[]) => SellerInquiry[]) {
    setLoaded((prev) => (prev ? { ...prev, items: update(prev.items) } : prev));
  }

  async function toggle(item: SellerInquiry) {
    const next: SellerInquiryStatus = item.status === "new" ? "contacted" : "new";
    setSavingId(item.id);
    setStatusError(null);
    try {
      await setSellerInquiryStatus(item.id, next);
      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, status: next } : row)));
    } catch (error) {
      console.error("Could not update the enquiry:", error);
      setStatusError("That change wasn't saved. Check your connection and try again.");
    } finally {
      setSavingId(null);
    }
  }

  return { items, state, savingId, statusError, toggle };
}

/** "3 h", "2 d": how long a new enquiry has waited for a reply. */
function waitingFor(createdAt: Date, now: number): string {
  const minutes = Math.max(0, Math.floor((now - createdAt.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

/** wa.me wants the international number without "+": 082 123 4567 → 27821234567. */
function whatsappHref(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) digits = `27${digits.slice(1)}`;
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

const linkClass = "font-semibold text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300";

export function EnquiryList({
  items,
  state,
  savingId,
  statusError,
  toggle,
  emptyMessage,
}: ReturnType<typeof useOwnerInquiries> & { emptyMessage: string }) {
  // Read once when the list mounts; "waiting" is a rough age, not a live clock.
  const [now] = useState(() => Date.now());

  return (
    <>
      {statusError ? (
        <p role="alert" className="mb-3 rounded-control border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
          {statusError}
        </p>
      ) : null}

      {state === "loading" && (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading enquiries…</p>
      )}

      {state === "error" && (
        <p role="alert" className="rounded-control border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
          Your enquiries couldn&rsquo;t be loaded. Check your connection and refresh the page.
        </p>
      )}

      {state === "ready" && items.length === 0 && (
        <p className="rounded-control border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-white/15 dark:text-slate-300">
          {emptyMessage}
        </p>
      )}

      {state === "ready" && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => {
            const isNew = item.status === "new";
            const whatsapp = item.contactPhone ? whatsappHref(item.contactPhone) : null;
            return (
              <li key={item.id} className="rounded-control border border-slate-200 bg-[#f4f7f7] p-3.5 dark:border-white/10 dark:bg-surface-ink/70">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.kind === "message" ? "Message" : "Viewing request"}
                      <span className="font-medium text-slate-600 dark:text-slate-300"> · {item.propertyTitle}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                      {item.contactName || "A buyer"}
                      {item.createdAt ? ` · ${formatDateTime(item.createdAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isNew && item.createdAt ? (
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                        Waiting {waitingFor(item.createdAt, now)}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                        isNew
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "border-slate-300 bg-white/60 text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
                      }`}
                    >
                      {isNew ? "New" : "Contacted"}
                    </span>
                  </div>
                </div>

                {item.notes ? (
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-800 dark:text-slate-200">{item.notes}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {item.contactEmail ? (
                    <a href={`mailto:${item.contactEmail}`} className={linkClass}>
                      {item.contactEmail}
                    </a>
                  ) : null}
                  {item.contactPhone ? (
                    <a href={`tel:${item.contactPhone.replace(/\s+/g, "")}`} className={linkClass}>
                      {item.contactPhone}
                    </a>
                  ) : null}
                  {whatsapp ? (
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      WhatsApp<span className="sr-only"> {item.contactName || "the buyer"}</span>
                    </a>
                  ) : null}
                  <button
                    type="button"
                    disabled={savingId === item.id}
                    onClick={() => void toggle(item)}
                    className="pill ml-auto border border-slate-300 bg-white/80 font-semibold text-slate-800 transition-colors hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    {savingId === item.id ? "Saving…" : isNew ? "Mark as contacted" : "Mark as new"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
