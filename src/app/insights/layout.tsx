import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "South Africa Property Market Insights & Deeds Office Trends",
  description:
    "Data-backed South African real estate market intelligence: Deeds Office transaction trends, 5-year capital appreciation, suburb price per square metre, and demographic shift analysis.",
  alternates: {
    canonical: absoluteUrl("/insights"),
  },
  openGraph: {
    title: "SA Property Market Insights & Deeds Office Intelligence",
    description:
      "Independent real estate analytics across Gauteng, Western Cape, and KwaZulu-Natal. Track suburb growth, registered transfer prices, and average days on market.",
    url: absoluteUrl("/insights"),
    type: "article",
  },
};

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
