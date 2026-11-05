import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Search Luxury Properties & Real Estate",
  description:
    // "Deeds Office records" removed: the index holds listings, not registry data.
    "Filter South African homes for sale and to rent by suburb, price, bedrooms and energy resilience.",
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
