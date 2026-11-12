"use client";

import type { ReactNode } from "react";

import { SectionNav } from "@/components/dashboard-ui";
import RoleGuard from "@/components/role-guard";

const LINKS = [
  { href: "/agency", label: "Overview", exact: true },
  { href: "/agency/team", label: "Team" },
  { href: "/agency/enquiries", label: "Enquiries" },
  { href: "/agent/dashboard", label: "My console" },
];

/**
 * Frame for every /agency page (PLAN.md Phase G): the principal's view across
 * their agents. Agents and admins pass the guard; each page then shows the
 * agency, the form to register one, or (for a member) where to find theirs.
 */
export default function AgencyShell({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["Agent", "Admin"]} featureName="Agency">
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
        <div className="mx-auto max-w-[1280px]">
          <SectionNav label="Agency" links={LINKS} />
          {children}
        </div>
      </main>
    </RoleGuard>
  );
}
