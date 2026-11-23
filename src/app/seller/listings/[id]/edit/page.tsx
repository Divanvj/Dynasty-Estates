"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import ListingWizard from "@/components/listing-wizard";
import RoleGuard from "@/components/role-guard";
import { isHealthKey } from "@/lib/listing-insights";
import { CLOSED_LISTING_STATUSES, loadListingForEdit, type ListingForEdit } from "@/lib/seller-listings";

// Pattern: Form (the listing wizard, opened on an existing listing). Any
// signed-in account may list privately, so any may edit its own listings;
// loadListingForEdit refuses a listing the account doesn't own, and
// firestore.rules refuses the write.

/** ?from= says which page opened the editor, so Back and Save return there. */
function returnPath(from: string | null, id: string): string {
  if (from === "agent") return `/agent/listings/${id}`;
  if (from === "portal") return "/seller/portal";
  if (from === "agent-list") return "/agent/listings";
  return `/seller/listings/${id}`;
}

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; uid: string; loaded: ListingForEdit; canPublish: boolean };

function EditListing() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const from = search?.get("from") ?? null;
  // ?fix=<checklist key> opens the wizard at the field that fixes it.
  const fixParam = search?.get("fix") ?? null;
  const fix = isHealthKey(fixParam) ? fixParam : undefined;
  const returnTo = returnPath(from, params.id);
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    Promise.all([loadListingForEdit(params.id, user.uid), user.getIdTokenResult()])
      .then(([loaded, token]) => {
        if (cancelled) return;
        // The claim is the authority firestore.rules checks, not the UI's role mirror.
        const canPublish = token.claims.role === "agent" || token.claims.role === "admin";
        setState({ kind: "ready", uid: user.uid, loaded, canPublish });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ kind: "error", message: error instanceof Error ? error.message : "This listing couldn't be loaded." });
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, params.id]);

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-4xl space-y-4">
        {children}
        <Link href={returnTo} className="tap-44 relative inline-block text-sm font-semibold text-emerald-800 underline underline-offset-2 dark:text-emerald-300">
          Back to the listing
        </Link>
      </div>
    </main>
  );

  // Ready for a different account (a role switch signs in again): reload.
  if (state.kind === "loading" || (state.kind === "ready" && state.uid !== user?.uid)) {
    return shell(<p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading the listing…</p>);
  }
  if (state.kind === "error") {
    return shell(
      <p role="alert" className="rounded-2xl border border-rose-300/40 bg-rose-100/70 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200">
        {state.message} If it should be yours, check your connection and refresh the page.
      </p>,
    );
  }
  if (CLOSED_LISTING_STATUSES.includes(state.loaded.status)) {
    return shell(
      <p className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300">
        This listing is {state.loaded.status.toLowerCase()}, so it can no longer be edited.
      </p>,
    );
  }
  return (
    <ListingWizard
      key={params.id}
      edit={{ listingId: params.id, loaded: state.loaded, canPublish: state.canPublish, returnTo, fix }}
    />
  );
}

export default function EditListingPage() {
  return (
    <RoleGuard allowedRoles={["Seller", "Agent", "Admin"]} allowAnySignedIn featureName="Edit Listing">
      <EditListing />
    </RoleGuard>
  );
}
