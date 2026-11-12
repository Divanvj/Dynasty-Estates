"use client";

import { PageHeading } from "@/components/dashboard-ui";
import { PractitionerProfile } from "@/components/practitioner-profile";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 5 — Settings (docs/dashboards/PLAN.md, Phase F). The agent's
// compliance record: FFC number and expiry, checked by an admin against the
// PPRA register. A warning shows here and on the dashboard 60 days before expiry.

export default function AgentProfilePage() {
  const uid = useAccountUid();
  return (
    <>
      <PageHeading
        title="Profile"
        description="Your practitioner details. Dynasty checks your Fidelity Fund Certificate against the PPRA register and reminds you before it expires."
      />
      <PractitionerProfile uid={uid} />
    </>
  );
}
