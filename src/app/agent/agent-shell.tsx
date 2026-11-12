"use client";

import type { ReactNode } from "react";

import { SectionNav } from "@/components/dashboard-ui";
import RoleGuard from "@/components/role-guard";

const LINKS = [
  { href: "/agent/dashboard", label: "Dashboard" },
  { href: "/agent/enquiries", label: "Enquiries" },
  { href: "/agent/listings", label: "Listings" },
  { href: "/agent/market", label: "Price snapshot" },
  { href: "/agent/profile", label: "Profile" },
];

/** Frame for every /agent page: the role check and the section tabs. */
export default function AgentShell({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["Agent", "Admin"]} featureName="Agent Console">
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
        <div className="mx-auto max-w-[1280px]">
          <SectionNav label="Agent console" links={LINKS} />
          {children}
        </div>
      </main>
    </RoleGuard>
  );
}
