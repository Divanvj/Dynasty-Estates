import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Search Luxury Properties & Real Estate",
  description:
    "Filter and explore premier South African properties for sale and to rent with custom search facets, Deeds Office records, and verified solar specs.",
  alternates: {
    canonical: absoluteUrl("/search"),
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
