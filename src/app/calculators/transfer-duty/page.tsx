import type { Metadata } from "next";
import CalculatorsView from "@/components/calculators-view";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "SARS Transfer Duty Calculator 2024/2025 | South African Property Tax",
  description:
    "Calculate official SARS Transfer Duty on residential property purchases in South Africa. Free tax exemption up to R1.1 million, graduated tax brackets, and 0% transfer duty developer exemptions.",
  alternates: {
    canonical: absoluteUrl("/calculators/transfer-duty"),
  },
  openGraph: {
    title: "SARS Transfer Duty Calculator 2024/2025 | Dynasty Estates",
    description:
      "Interactive South African Transfer Duty calculator based on official statutory SARS tax brackets. Understand property tax exemptions and legal closing costs.",
    url: absoluteUrl("/calculators/transfer-duty"),
    type: "website",
  },
};

export default function TransferDutyCalculatorPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the SARS Transfer Duty threshold in South Africa for 2024/2025?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Under the current SARS tax schedule, property transactions valued up to R1,100,000 are completely exempt from Transfer Duty (0% rate). Transactions above R1.1 million are taxed on a graduated sliding scale from 3% up to 13% for properties over R11 million.",
        },
      },
      {
        "@type": "Question",
        name: "Do buyers pay transfer duty on new off-plan property developments?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. When purchasing a new property directly from a VAT-registered property developer, the purchase price includes Value-Added Tax (VAT at 15%). Therefore, no SARS Transfer Duty is payable by the buyer.",
        },
      },
      {
        "@type": "Question",
        name: "When must transfer duty be paid to SARS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Transfer duty must be paid to the transferring attorney (conveyancer) before registration at the Deeds Office. The conveyancer pays SARS to obtain a statutory Transfer Duty Receipt, without which the Registrar of Deeds will not register the property into the buyer's name.",
        },
      },
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SARS Transfer Duty Calculator",
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ZAR",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <CalculatorsView initialTab="transfer-duty" />
    </>
  );
}
