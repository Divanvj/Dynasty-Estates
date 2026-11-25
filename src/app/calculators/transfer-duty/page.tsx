import type { Metadata } from "next";
import CalculatorsView from "@/components/calculators-view";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "SARS Transfer Duty Calculator | South African Property Tax",
  description:
    "Calculate SARS transfer duty on a South African property purchase with the current SARS table: no duty up to R1,210,000, then graduated brackets from 3% to 13%, and no transfer duty on VAT-inclusive new developments.",
  alternates: {
    canonical: absoluteUrl("/calculators/transfer-duty"),
  },
  openGraph: {
    title: "SARS Transfer Duty Calculator | Dynasty Estates",
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
        name: "What is the SARS transfer duty threshold in South Africa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For properties acquired from 1 April 2025 (SARS lists no change from 1 April 2026), there is no transfer duty up to R1,210,000. Above that, duty is charged on a sliding scale: 3% of the value above R1,210,000, rising through 6%, 8% and 11% to 13% of the value above R13,310,000. The calculator uses the same table.",
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
