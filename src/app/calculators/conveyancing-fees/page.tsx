import type { Metadata } from "next";
import CalculatorsView from "@/components/calculators-view";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Conveyancing Fees & Deeds Office Tariffs Calculator | South Africa",
  description:
    "Calculate property transfer attorney conveyancing costs, mortgage bond registration legal fees, Deeds Office registration levies, and FICA disbursements in South Africa.",
  alternates: {
    canonical: absoluteUrl("/calculators/conveyancing-fees"),
  },
  openGraph: {
    title: "Conveyancing & Legal Tariffs Calculator | Dynasty Estates",
    description:
      "Understand the total legal costs of transferring and registering property title in South Africa. Comprehensive breakdown of conveyancer guidelines and Deeds Office fees.",
    url: absoluteUrl("/calculators/conveyancing-fees"),
    type: "website",
  },
};

export default function ConveyancingFeesCalculatorPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Who pays conveyancing legal fees in a South African property transaction?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "In South Africa, the buyer is responsible for paying the transferring attorney's conveyancing fees and the bond registration attorney's fees, even though the seller traditionally nominates the transferring attorney in the deed of sale.",
        },
      },
      {
        "@type": "Question",
        name: "How are conveyancing fees calculated in South Africa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Conveyancing fees are based on sliding tariff guidelines recommended annually by the Legal Practice Council (LPC) and the Law Society of South Africa (LSSA), determined by the purchase price and bond facility amount, plus 15% VAT and statutory Deeds Office registration levies.",
        },
      },
      {
        "@type": "Question",
        name: "What is the difference between transfer fees and bond registration fees?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Transfer fees are paid to the transferring attorney to register ownership from the seller into the buyer's name. Bond registration fees are paid to the bank's appointed bond registration attorney to register the mortgage bond over the property title deed at the Deeds Office.",
        },
      },
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "South Africa Conveyancing Fees and Deeds Office Calculator",
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
      <CalculatorsView initialTab="conveyancing" />
    </>
  );
}
