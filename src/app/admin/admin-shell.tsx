"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SectionNav } from "@/components/dashboard-ui";
import RoleGuard from "@/components/role-guard";
import { useUserRole } from "@/lib/use-user-role";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/agents", label: "Agents" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/audit", label: "Audit trail" },
  { href: "/admin/packages", label: "Packages" },
];

/**
 * The pages a moderator may use (item 1.3): the review queue and the audit
 * trail, which is what firestore.rules' canModerate() and
 * /api/admin/moderation let them read and do. Everything else stays admin-only.
 */
const MODERATOR_PAGES = ["/admin/moderation", "/admin/audit"];

/**
 * Frame for every /admin page: the role check and the section tabs. The five
 * tabs used to be buttons inside one page; each is its own route now, so a
 * link or a refresh lands on the right one. Engineering health lives in the
 * developer console, not here.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const { role } = useUserRole();
  const moderatorPage = MODERATOR_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
  const links = role === "Moderator" ? LINKS.filter((link) => MODERATOR_PAGES.includes(link.href)) : LINKS;
  return (
    <RoleGuard
      allowedRoles={moderatorPage ? ["Admin", "Moderator"] : ["Admin"]}
      featureName={moderatorPage ? "Listing Review" : "Platform Administration"}
    >
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-slate-900 md:px-6 lg:px-8 dark:text-white">
        <div className="mx-auto max-w-[1280px]">
          <SectionNav label="Administration" links={links} />
          {children}
        </div>
      </main>
    </RoleGuard>
  );
}
