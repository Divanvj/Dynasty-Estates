"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps site-wide chrome that a full-screen workspace replaces. SiteHeader is a
 * Server Component, so it cannot read the path itself; it is passed in here.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/console")) return null;
  return <>{children}</>;
}
