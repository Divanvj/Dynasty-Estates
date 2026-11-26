"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import BrandLogo from "@/components/brand-logo";
import { SparklesIcon } from "@/components/icons";

/**
 * The one footer, rendered once in the root layout under every page. It used
 * to live inside the home page only, so every other page ended with no links,
 * no privacy notice and no way back to the main sections without scrolling up.
 *
 * Every link the home footer had is still here, under the names the header and
 * the UX audit use (docs/ux-audit/07 plain-wording table): "Homes for sale",
 * "Map search", "Find an agent". "Verified" is not used for the agent directory
 * until its agents are checked against the PPRA. No admin or agent back-office
 * links (removed from the footer on purpose, docs/ux-audit/05).
 *
 * Not shown where a page fills the screen with its own frame: the developer
 * console (always dark, own shell), the sign-in pages (full-bleed), and the
 * map search (a map sized to the viewport).
 */
const HIDDEN_ON = ["/console", "/auth", "/map-search"];

const linkClass = "inline-block py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors";

type FooterLink = { href: string; label: string; ai?: boolean };

const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Find a home",
    links: [
      { href: "/for-sale", label: "Homes for sale" },
      { href: "/to-rent", label: "Homes to rent" },
      { href: "/search", label: "Search all homes" },
      { href: "/map-search", label: "Map search" },
      { href: "/ai-search", label: "AI Search", ai: true },
    ],
  },
  {
    title: "Sell or let",
    links: [
      { href: "/sell", label: "Sell your home privately" },
      { href: "/pricing", label: "Prices" },
      { href: "/seller/listings/new", label: "List a home" },
      { href: "/seller/portal", label: "My listings" },
      { href: "/agents", label: "Find an agent" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/calculators", label: "Bond and cost calculators" },
      { href: "/compare", label: "Compare homes" },
      { href: "/collections", label: "Collections" },
      { href: "/insights", label: "Market trends" },
    ],
  },
];

export default function SiteFooter() {
  const pathname = usePathname() ?? "";
  if (HIDDEN_ON.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;

  return (
    <div className="no-print px-4 pb-6 md:px-6 lg:px-8">
      {/* p-8 is 64px of horizontal padding on a phone, inside the gutter
          above. Halved below `md`. */}
      <footer className="mx-auto mt-12 max-w-[1440px] rounded-panel border border-white/70 bg-white/40 dark:border-white/10 dark:bg-[#091517]/75 p-8 max-md:p-5 shadow-sm backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 text-xs">
          {/* Two link columns side by side even on a phone, so the footer is
              half as tall there; the brand line spans both. */}
          <div className="col-span-2 lg:col-span-1">
            <BrandLogo showOnMobile className="mb-3" />
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Homes for sale and to rent across South Africa, with the true monthly cost and the solar and water backup on
              every listing.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">{column.title}</p>
              {/* space-y-1 with py-1 links: each tap target clears the 24px
                  WCAG 2.2 AA floor. */}
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.ai ? (
                      <Link href={link.href} className="inline-flex items-center gap-1.5 py-1 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">
                        <SparklesIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{link.label}</span>
                      </Link>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 border-t border-slate-200/80 dark:border-white/10 pt-4 flex flex-col gap-2 sm:flex-row items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <p>&copy; 2026 Dynasty Estates, a Tricore Enterprises platform.</p>
          <Link href="/legal/privacy" className={linkClass}>
            Privacy and your data (POPIA)
          </Link>
          {/* Honest about the state of the data until the test listings are
              cleared (tracker item 2.16); a regulatory statement replaces it
              once the listings and agents are real. */}
          <p>Beta &mdash; listings shown are sample data.</p>
        </div>
      </footer>
    </div>
  );
}
