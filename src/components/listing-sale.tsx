"use client";

import { useEffect, useId, useState } from "react";

import { ConfirmDialog, errorBoxClass, panelClass, primaryButtonClass, secondaryButtonClass } from "@/components/dashboard-ui";
import { accountApi } from "@/lib/account-api";
import { formatDate, formatNumber, formatPriceInput } from "@/lib/formatters";
import { sastToday } from "@/lib/practitioner-compliance";
import { saleWords, type SaleKind, type SaleRecord } from "@/lib/sales";
import type { SellerListing } from "@/lib/seller-listings";

/**
 * "Mark as sold" / "Mark as rented" on a listing's page in the agent and
 * seller portals (lib/sales.ts). A short form opened in place: price, date,
 * whether the seller agreed to show the price. Once recorded, the sale can be
 * corrected or undone ("Not sold after all").
 */

const inputClass =
  "h-11 w-full rounded-xl border border-[var(--dash-line-2)] bg-[var(--dash-card)] px-3 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dash-d1)] aria-[invalid=true]:border-rose-500 dark:text-white";
const labelClass = "mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200";

const rand = (n: number) => `R ${formatNumber(n)}`;

export function ListingSale({ listing, onChanged }: { listing: SellerListing; onChanged: () => void }) {
  const kind: SaleKind = listing.listingType === "rent" ? "rental" : "sale";
  const words = saleWords(kind);
  const closed = listing.status === "Sold" || listing.status === "Rented";
  const live = listing.status === "Published" || listing.status === "Under offer";

  const [sale, setSale] = useState<{ kind: "loading" } | { kind: "ready"; value: SaleRecord | null } | { kind: "error"; message: string }>({ kind: "loading" });
  const [open, setOpen] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!closed) return;
    let cancelled = false;
    accountApi<{ sale: SaleRecord | null }>(`/api/listings/${listing.id}/sale`)
      .then((r) => !cancelled && setSale({ kind: "ready", value: r.sale }))
      .catch((e: Error) => !cancelled && setSale({ kind: "error", message: e.message }));
    return () => {
      cancelled = true;
    };
  }, [closed, listing.id, listing.status]);

  if (!live && !closed) return null;

  async function undo() {
    setBusy(true);
    setError(null);
    try {
      await accountApi(`/api/listings/${listing.id}/sale`, { method: "DELETE" });
      setConfirmUndo(false);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
      setConfirmUndo(false);
    } finally {
      setBusy(false);
    }
  }

  if (live && !open) {
    return (
      <div className="mb-5">
        <button type="button" onClick={() => setOpen(true)} className={secondaryButtonClass}>
          {words.mark}
        </button>
      </div>
    );
  }

  const recorded = sale.kind === "ready" ? sale.value : null;

  return (
    <section aria-labelledby="sale-heading" className={`${panelClass} mb-5`}>
      {open ? (
        <SaleForm
          kind={kind}
          listing={listing}
          initial={recorded}
          onCancel={() => setOpen(false)}
          onSaved={(value) => {
            setSale({ kind: "ready", value });
            setOpen(false);
            onChanged();
          }}
        />
      ) : (
        <>
          <h2 id="sale-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
            {words.status}
          </h2>
          {sale.kind === "loading" ? <p role="status" className="mt-1 text-sm text-slate-600 dark:text-slate-300">Loading the sale…</p> : null}
          {sale.kind === "error" ? <p role="alert" className={`${errorBoxClass} mt-2`}>{sale.message}</p> : null}
          {sale.kind === "ready" && !recorded ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">No price was recorded for this {kind}.</p>
          ) : null}
          {recorded ? (
            <>
              <p className="mt-1 text-base text-slate-900 dark:text-white">
                <span className="font-semibold">{rand(recorded.price)}</span>
                {kind === "rental" ? " a month" : ""} on {formatDate(`${recorded.soldOn}T12:00:00Z`)}
                {recorded.askingPrice ? (
                  <span className="text-slate-600 dark:text-slate-300">
                    {" "}
                    · {Math.round((recorded.price / recorded.askingPrice) * 100)}% of the asking price
                  </span>
                ) : null}
                {recorded.daysOnMarket !== null ? <span className="text-slate-600 dark:text-slate-300"> · {recorded.daysOnMarket} days on the market</span> : null}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {recorded.pricePublic
                  ? "The price shows on the public listing."
                  : "The price is private: the listing just says " + words.status + ", and the price only counts toward area figures of three or more sales."}
              </p>
            </>
          ) : null}
          {error ? <p role="alert" className={`${errorBoxClass} mt-3`}>{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {sale.kind === "ready" ? (
              <button type="button" onClick={() => setOpen(true)} className={secondaryButtonClass}>
                {recorded ? "Correct the details" : "Add the price"}
              </button>
            ) : null}
            {recorded ? (
              <button type="button" onClick={() => setConfirmUndo(true)} className={secondaryButtonClass}>
                Not {words.verb} after all
              </button>
            ) : null}
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirmUndo}
        title={`Put “${listing.title}” back on the market?`}
        body={`The listing goes back to ${recorded ? "live" : "its previous status"} and the recorded ${kind} is deleted.`}
        confirmLabel="Reopen the listing"
        busy={busy}
        onConfirm={() => void undo()}
        onCancel={() => setConfirmUndo(false)}
      />
    </section>
  );
}

function SaleForm({
  kind,
  listing,
  initial,
  onCancel,
  onSaved,
}: {
  kind: SaleKind;
  listing: SellerListing;
  initial: SaleRecord | null;
  onCancel: () => void;
  onSaved: (sale: SaleRecord) => void;
}) {
  const words = saleWords(kind);
  const id = useId();
  const today = sastToday();
  const [price, setPrice] = useState(initial ? formatPriceInput(String(initial.price)) : "");
  const [soldOn, setSoldOn] = useState(initial?.soldOn ?? today);
  const [pricePublic, setPricePublic] = useState(initial?.pricePublic ?? false);
  const [errors, setErrors] = useState<{ price?: string; soldOn?: string }>({});
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const digits = Number(price.replace(/[^0-9]/g, ""));
  const priceError = () => (!digits ? `Enter the ${words.price.toLowerCase()}.` : digits < 100 ? "Check the amount: it looks too small." : undefined);
  const dateError = () => (!soldOn ? "Choose the date." : soldOn > today ? "The date can't be in the future." : undefined);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const next = { price: priceError(), soldOn: dateError() };
    setErrors(next);
    if (next.price || next.soldOn) return;
    setBusy(true);
    setFailed(null);
    try {
      const { sale } = await accountApi<{ sale: SaleRecord }>(`/api/listings/${listing.id}/sale`, { method: "PUT", body: { price: digits, soldOn, pricePublic } });
      onSaved(sale);
    } catch (e) {
      setFailed((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <h2 id="sale-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
        {initial ? `Correct the ${kind}` : words.mark}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {listing.numericPrice ? `Asking price ${rand(listing.numericPrice)}. ` : ""}
        Recorded {kind === "rental" ? "rents" : "prices"} build the area figures on the market page and in seller reports.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-price`} className={labelClass}>
            {words.price}
          </label>
          <input
            id={`${id}-price`}
            inputMode="numeric"
            autoComplete="off"
            value={price}
            onChange={(e) => {
              setPrice(formatPriceInput(e.target.value));
              if (errors.price) setErrors((x) => ({ ...x, price: undefined }));
            }}
            onBlur={() => setErrors((x) => ({ ...x, price: priceError() }))}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={errors.price ? `${id}-price-error` : undefined}
            placeholder={kind === "rental" ? "e.g. R 18 500" : "e.g. R 2 450 000"}
            className={inputClass}
          />
          {errors.price ? (
            <p id={`${id}-price-error`} className="mt-1 text-sm text-rose-700 dark:text-rose-300">
              {errors.price}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor={`${id}-date`} className={labelClass}>
            {kind === "rental" ? "Date the lease was signed" : "Date the offer was accepted"}
          </label>
          <input
            id={`${id}-date`}
            type="date"
            max={today}
            value={soldOn}
            onChange={(e) => {
              setSoldOn(e.target.value);
              if (errors.soldOn) setErrors((x) => ({ ...x, soldOn: undefined }));
            }}
            onBlur={() => setErrors((x) => ({ ...x, soldOn: dateError() }))}
            aria-invalid={Boolean(errors.soldOn)}
            aria-describedby={errors.soldOn ? `${id}-date-error` : undefined}
            className={inputClass}
          />
          {errors.soldOn ? (
            <p id={`${id}-date-error`} className="mt-1 text-sm text-rose-700 dark:text-rose-300">
              {errors.soldOn}
            </p>
          ) : null}
        </div>
      </div>
      <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm text-slate-800 dark:text-slate-200">
        <input type="checkbox" checked={pricePublic} onChange={(e) => setPricePublic(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--dash-hero-solid)]" />
        <span>
          {words.agreed}
          <span className="block text-slate-600 dark:text-slate-400">
            Leave this off unless they said yes. Without it the listing just says {words.status}, and the price only counts inside area figures of three or more {kind === "rental" ? "rentals" : "sales"}.
          </span>
        </span>
      </label>
      {failed ? <p role="alert" className={`${errorBoxClass} mt-3`}>{failed}</p> : null}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Saving…" : initial ? "Save the correction" : kind === "rental" ? "Record the rental" : "Record the sale"}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className={secondaryButtonClass}>
          Cancel
        </button>
        {!initial ? (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            The listing becomes <span className="font-semibold">{words.status}</span> and leaves search. You can undo it.
          </span>
        ) : null}
      </div>
    </form>
  );
}
