"use client";

import { useParams } from "next/navigation";

import RoleGuard from "@/components/role-guard";
import SellerReport from "@/components/seller-report";

// Seller report (docs/dashboards/PLAN.md, Phase C) for a private seller's own
// listing — useful to send to a co-owner or keep for their records.
export default function SellerOwnReportPage() {
  const params = useParams<{ id: string }>();
  return (
    <RoleGuard allowedRoles={["Seller", "Agent", "Admin"]} allowAnySignedIn featureName="Seller Portal">
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white print:p-0">
        <div className="mx-auto max-w-[1280px]">
          <SellerReport listingId={params.id} backHref={`/seller/listings/${params.id}`} />
        </div>
      </main>
    </RoleGuard>
  );
}
