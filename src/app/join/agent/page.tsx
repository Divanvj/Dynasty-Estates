"use client";

import Link from "next/link";

import { linkClass, PageHeading } from "@/components/dashboard-ui";
import { PractitionerProfile } from "@/components/practitioner-profile";
import RoleGuard from "@/components/role-guard";
import { useAccountUid } from "@/lib/use-owner-listings";
import { useUserRole } from "@/lib/use-user-role";

// Pattern 5 — Settings (docs/dashboards/PLAN.md, Phase F). Any signed-in
// account applies for agent access by filing its Fidelity Fund Certificate.
// An admin checks it on the PPRA register in /admin/agents; approving grants
// the agent role, and this page then links to the agent console.

export default function JoinAgentPage() {
  const uid = useAccountUid();
  const { role } = useUserRole();
  const isAgent = role === "Agent" || role === "Admin";
  return (
    <RoleGuard allowedRoles={["Agent", "Admin"]} allowAnySignedIn featureName="Agent application">
      <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-slate-900 md:px-6 lg:px-8 dark:text-white">
        <div className="mx-auto max-w-[960px]">
          <PageHeading
            title="Apply for agent access"
            description="Registered property practitioners list homes and work enquiries from the agent console. File your Fidelity Fund Certificate and Dynasty checks it against the PPRA register, usually within one working day."
          />
          {isAgent ? (
            <p className="mb-4 rounded-control border border-emerald-400/40 bg-emerald-50 p-3.5 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">
              This account has agent access.{" "}
              <Link href="/agent/dashboard" className={linkClass}>Open the agent console</Link>
            </p>
          ) : null}
          <PractitionerProfile uid={uid} />
        </div>
      </main>
    </RoleGuard>
  );
}
