"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { type SearchIntent, useCatalogueHref } from "@/lib/search-intent";

/**
 * A link back to the catalogue that keeps the visitor's For Sale / To Rent
 * choice: their last search (filters and all) when it is on that choice,
 * otherwise the catalogue on that choice, otherwise on `fallback`.
 *
 * The server HTML links to `fallback`; the remembered search takes over once
 * the page is running, before anyone can click.
 */
export default function CatalogueLink({
  fallback,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & { fallback: SearchIntent }) {
  const href = useCatalogueHref(fallback);
  return <Link href={href} {...props} />;
}
