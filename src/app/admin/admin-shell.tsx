"use client";

import type { ReactNode } from "react";

import { SectionNav } from "@/components/dashboard-ui";
import RoleGuard from "@/components/role-guard";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/audit", label: "Audit trail" },
  { href: "/admin/packages", label: "Packages" },
];

/**
 * Frame for every /admin page: the role check and the section tabs. The five
 * tabs used to be buttons inside one page; each is its own route now, so a
 * link or a refresh lands on the right one. Engineering health lives in the
 * developer console, not here.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["Admin"]} featureName="Platform Administration">
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
        <div className="mx-auto max-w-[1280px]">
          <SectionNav label="Administration" links={LINKS} />
          {children}
        </div>
      </main>
    </RoleGuard>
  );
}
