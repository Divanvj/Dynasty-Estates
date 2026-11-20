"use client";

import { useState } from "react";

import { ConfirmDialog, errorBoxClass, panelClass, secondaryButtonClass } from "@/components/dashboard-ui";
import { accountApi } from "@/lib/account-api";
import { MARKET_STATUS_MOVE, nextMarketStatus } from "@/lib/listing-status";
import type { SellerListing } from "@/lib/seller-listings";

/**
 * S1-8 — "Mark as under offer" and "Back on the market" on a listing's page in
 * the agent and seller portals. The move goes through
 * PUT /api/listings/[id]/status; lib/listing-status.ts says why.
 */

export function ListingMarketStatus({ listing, onChanged }: { listing: SellerListing; onChanged: () => void }) {
  const move = nextMarketStatus(listing.status);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draft, Submitted, Sold, Rented, Paused…: nothing to move between.
  if (!move) return null;

  const copy = MARKET_STATUS_MOVE[move];
  const underOffer = listing.status === "Under offer";

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      await accountApi(`/api/listings/${listing.id}/status`, { method: "PUT", body: { status: move } });
      setConfirming(false);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  const button = (
    <button type="button" onClick={() => setConfirming(true)} className={secondaryButtonClass}>
      {copy.button}
    </button>
  );

  return (
    <>
      {underOffer ? (
        <section aria-labelledby="market-status-heading" className={`${panelClass} mb-5`}>
          <h2 id="market-status-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
            Under offer
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Buyers see an “Under offer” label on the listing and in search. It is still listed, and enquiries still reach you.
          </p>
          {error ? <p role="alert" className={`${errorBoxClass} mt-3`}>{error}</p> : null}
          <div className="mt-4">{button}</div>
        </section>
      ) : (
        <div className="mb-3">
          {error ? <p role="alert" className={`${errorBoxClass} mb-3`}>{error}</p> : null}
          {button}
        </div>
      )}
      <ConfirmDialog
        open={confirming}
        title={copy.title}
        body={copy.body}
        confirmLabel={copy.confirm}
        busy={busy}
        onConfirm={() => void apply()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
