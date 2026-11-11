"use client";

import { useParams } from "next/navigation";

import SellerReport from "@/components/seller-report";

// Seller report (docs/dashboards/PLAN.md, Phase C): a print document, not a
// page pattern. Frame and role check come from app/agent/layout.tsx; the tab
// row is marked no-print.
export default function AgentSellerReportPage() {
  const params = useParams<{ id: string }>();
  return <SellerReport listingId={params.id} backHref={`/agent/listings/${params.id}`} />;
}
