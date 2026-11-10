"use client";

import { useParams } from "next/navigation";

import ListingDetail from "@/components/listing-detail";
import RoleGuard from "@/components/role-guard";

// Pattern 2 — Detail (docs/dashboards/PLAN.md, Phase B). A private seller's
// view of one of their listings: the same Overview / Performance / Enquiries
// an agent gets. Any signed-in account may list privately, so any may open it;
// the page itself only shows listings the account owns.
export default function SellerListingPage() {
  const params = useParams<{ id: string }>();
  return (
    <RoleGuard allowedRoles={["Seller", "Agent", "Admin"]} allowAnySignedIn featureName="Seller Portal">
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
        <div className="mx-auto max-w-[1280px]">
          <ListingDetail listingId={params.id} backHref="/seller/portal" backLabel="Seller portal" />
        </div>
      </main>
    </RoleGuard>
  );
}
