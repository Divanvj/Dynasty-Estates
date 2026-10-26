import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "South African Property Financial Calculators | SARS Transfer Duty & Bond Repayments",
  description:
    "Comprehensive South African real estate financial tools: calculate 2024/2025 SARS Transfer Duty, monthly home loan bond repayments, conveyancing legal fees, and buyer affordability.",
  alternates: {
    canonical: absoluteUrl("/calculators"),
  },
  openGraph: {
    title: "SA Property Financial Calculators | SARS Transfer Duty & Bond Repayments",
    description:
      "Interactive property calculators: statutory SARS Transfer Duty brackets, bond amortization schedules, conveyancing tariffs, and maximum purchase affordability.",
    url: absoluteUrl("/calculators"),
    type: "website",
  },
};

export default function CalculatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
