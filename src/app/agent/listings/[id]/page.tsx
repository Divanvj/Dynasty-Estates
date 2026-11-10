"use client";

import { useParams } from "next/navigation";

import ListingDetail from "@/components/listing-detail";

// Pattern 2 — Detail (docs/dashboards/PLAN.md, Phase B). The frame and role
// check come from app/agent/layout.tsx.
export default function AgentListingPage() {
  const params = useParams<{ id: string }>();
  return <ListingDetail listingId={params.id} backHref="/agent/listings" backLabel="All listings" />;
}
