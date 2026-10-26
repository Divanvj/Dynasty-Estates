import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "PPRA Verified Property Practitioners & Real Estate Agents",
  description:
    "Connect with licensed South African Property Practitioners holding verified PPRA Fidelity Fund Certificates. Expert real estate advisory in Waterkloof, Camps Bay, Sandton, and Ballito.",
  alternates: {
    canonical: absoluteUrl("/agents"),
  },
  openGraph: {
    title: "PPRA Verified Property Practitioners Directory | Dynasty Estates",
    description:
      "Find certified estate agents with active luxury mandates, valid statutory FFC licensing, and hyper-local property market knowledge across South Africa.",
    url: absoluteUrl("/agents"),
    type: "website",
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
