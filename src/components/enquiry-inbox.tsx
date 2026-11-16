"use client";

import { useEffect, useState } from "react";

import CustomSelect from "@/components/custom-select";
import { AgeChip, emptyBoxClass, errorBoxClass, formatAge, Initials, linkClass, secondaryButtonClass } from "@/components/dashboard-ui";
import { REPLY_TARGET_MS } from "@/lib/dashboard-math";
import { formatDateTime } from "@/lib/formatters";
import {
  asStage,
  getInboxInquiries,
  INQUIRY_STAGES,
  setInquiryStage,
  STAGE_LABEL,
  type InquiryStage,
  type SellerInquiry,
} from "@/lib/seller-inquiries";

/**
 * Enquiries on the signed-in account's own listings, shared by the seller
 * portal and the agent dashboard.
 *
 * The agent dashboard used to load any 20 enquiries on the platform, with no
 * owner filter and in no order, so every agent saw other agents' and private
 * sellers' buyers. Both pages now read only enquiries whose `ownerId` is the
 * signed-in account, newest first, and firestore.rules enforces the same.
 * An agent in an agency also gets enquiries the principal assigned to them,
 * and loses ones the principal handed to someone else (Phase G).
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
    getInboxInquiries(uid)
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

  async function setStage(item: SellerInquiry, stage: InquiryStage) {
    if (asStage(item.status) === stage) return;
    setSavingId(item.id);
    setStatusError(null);
    try {
      const saved = await setInquiryStage(item, stage);
      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, ...saved } : row)));
    } catch (error) {
      console.error("Could not update the enquiry:", error);
      setStatusError("That change wasn't saved. Check your connection and try again.");
    } finally {
      setSavingId(null);
    }
  }

  /** The private seller's single button: New ↔ Contacted. */
  function toggle(item: SellerInquiry) {
    return setStage(item, item.status === "new" ? "contacted" : "new");
  }

  return { uid, items, state, savingId, statusError, toggle, setStage };
}

/** wa.me wants the international number without "+": 082 123 4567 → 27821234567. */
function whatsappHref(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) digits = `27${digits.slice(1)}`;
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

export function EnquiryList({
  uid,
  items,
  state,
  savingId,
  statusError,
  toggle,
  setStage,
  emptyMessage,
  stages = "simple",
}: ReturnType<typeof useOwnerInquiries> & {
  emptyMessage: string;
  /** "pipeline": agents pick any stage. "simple": New / Contacted, for private sellers. */
  stages?: "simple" | "pipeline";
}) {
  // Read once when the list mounts; "waiting" is a rough age, not a live clock.
  const [now] = useState(() => Date.now());

  return (
    <>
      {statusError ? (
        <p role="alert" className={`mb-3 ${errorBoxClass}`}>
          {statusError}
        </p>
      ) : null}

      {state === "loading" && (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading enquiries…</p>
      )}

      {state === "error" && (
        <p role="alert" className={errorBoxClass}>
          Your enquiries couldn&rsquo;t be loaded. Check your connection and refresh the page.
        </p>
      )}

      {state === "ready" && items.length === 0 && (
        <p className={emptyBoxClass}>
          {emptyMessage}
        </p>
      )}

      {state === "ready" && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((item) => {
            const stage = asStage(item.status);
            const isNew = stage === "new";
            const closed = stage === "won" || stage === "lost";
            const whatsapp = item.contactPhone ? whatsappHref(item.contactPhone) : null;
            return (
              // New ones carry weight, a tinted row AND a leading rail, so unread is not colour alone.
              <li
                key={item.id}
                id={`enquiry-${item.id}`}
                className={`relative flex scroll-mt-24 gap-3.5 rounded-2xl border p-4 ${
                  isNew
                    ? "border-[var(--dash-line-2)] bg-[var(--dash-card-2)] before:absolute before:inset-y-4 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[var(--dash-d1)]"
                    : "border-[var(--dash-line)] bg-[var(--dash-card)]"
                }`}
              >
                <span className="hidden sm:block">
                  <Initials name={item.contactName || "Buyer"} size={42} />
                </span>
                <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <p className={`text-slate-900 dark:text-white ${isNew ? "font-bold" : "font-semibold"}`}>
                      {item.contactName || "A buyer"}
                      <span className="ml-2 inline-flex rounded-full bg-[var(--dash-track)] px-2 py-0.5 align-[2px] text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {item.kind === "message" ? "Message" : "Viewing request"}
                      </span>
                    </p>
                    {uid && item.assignedTo === uid && item.ownerId !== uid ? (
                      <p className="mt-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--dash-d1)]">Assigned to you by your agency</p>
                    ) : null}
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{item.propertyTitle}</span>
                      {item.createdAt ? ` · ${formatDateTime(item.createdAt)}` : ""}
                      {item.createdAt && item.firstRespondedAt
                        ? ` · First reply after ${formatAge(item.createdAt, item.firstRespondedAt.getTime())}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isNew && item.createdAt ? (
                      <AgeChip
                        label={`Waiting ${formatAge(item.createdAt, now)}`}
                        tone={now - item.createdAt.getTime() > REPLY_TARGET_MS ? "late" : "soon"}
                      />
                    ) : null}
                    {/* In pipeline mode the Stage control below names the stage; only New keeps its badge. */}
                    {stages === "simple" || isNew ? (
                      <AgeChip label={STAGE_LABEL[stage]} tone={closed ? "neutral" : isNew ? "neutral" : "good"} />
                    ) : null}
                  </div>
                </div>

                {item.notes ? (
                  <p className="mt-2.5 whitespace-pre-line rounded-xl border border-[var(--dash-line)] bg-[var(--dash-card)] px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200">{item.notes}</p>
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
                  {stages === "pipeline" ? (
                    <div className="ml-auto flex items-center gap-2">
                      {savingId === item.id ? (
                        <span role="status" className="text-xs text-slate-600 dark:text-slate-400">Saving…</span>
                      ) : null}
                      <CustomSelect
                        ariaLabel={`Stage of the enquiry from ${item.contactName || "a buyer"}`}
                        value={stage}
                        disabled={savingId === item.id}
                        onChange={(value) => void setStage(item, asStage(value))}
                        options={INQUIRY_STAGES.map((value) => ({ value, label: STAGE_LABEL[value] }))}
                        label="Stage"
                        align="right"
                        className="w-44"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={savingId === item.id}
                      onClick={() => void toggle(item)}
                      className={`ml-auto ${secondaryButtonClass}`}
                    >
                      {savingId === item.id ? "Saving…" : isNew ? "Mark as contacted" : "Mark as new"}
                    </button>
                  )}
                </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
