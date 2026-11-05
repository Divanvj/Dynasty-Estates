import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

// The page's figures are hardcoded placeholders, so the metadata must not
// promise registry data either. "Deeds Office transaction trends" and
// "Independent real estate analytics" were describing a feed that does not
// exist, in the text search engines show.
export const metadata: Metadata = {
  title: "South Africa Property Market Insights | Dynasty Estates",
  description:
    "How suburb growth, days on market and price per square metre will be presented on Dynasty Estates. Sample figures while the platform is in beta.",
  alternates: {
    canonical: absoluteUrl("/insights"),
  },
  openGraph: {
    title: "South Africa Property Market Insights | Dynasty Estates",
    description:
      "A preview of Dynasty Estates market insights for Gauteng, the Western Cape and KwaZulu-Natal. Sample figures while the platform is in beta.",
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
