import type { Metadata } from "next";
import CalculatorsView from "@/components/calculators-view";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Home Loan Bond Repayment Calculator | South Africa Interest & Amortization",
  description:
    "Calculate monthly South African mortgage bond repayments based on the current SARB repo and prime lending rate (11.75%). Model extra monthly payments, deposit savings, and loan term reductions.",
  alternates: {
    canonical: absoluteUrl("/calculators/bond-repayment"),
  },
  openGraph: {
    title: "SA Home Loan Bond Repayment Calculator | Dynasty Estates",
    description:
      "Accurate South African home loan repayment calculations. See how an extra R1,500/month cuts years off your mortgage and saves hundreds of thousands in interest.",
    url: absoluteUrl("/calculators/bond-repayment"),
    type: "website",
  },
};

export default function BondRepaymentCalculatorPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How is a South African home loan repayment calculated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "South African commercial banks (Standard Bank, Absa, FNB, Nedbank) calculate home loan repayments using standard monthly amortization formulas based on the SARB Prime Lending Rate, the loan term (usually 20 or 30 years), and the financed capital amount after deposit.",
        },
      },
      {
        "@type": "Question",
        name: "How much interest can I save by paying extra into my South African bond each month?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Because interest is calculated daily and compounded monthly in South Africa, paying an extra R1,000 to R2,000 monthly directly reduces your capital balance, saving between R300,000 and R700,000 in interest and cutting 3 to 6 years off a standard 20-year loan term.",
        },
      },
      {
        "@type": "Question",
        name: "What bank fees are charged when opening a home loan in South Africa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "South African banks charge a statutory National Credit Act (NCA) initiation fee (capped at R6,037.50 including VAT) and a monthly administration fee (typically R69/month) for the duration of the home loan facility.",
        },
      },
    ],
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "South Africa Home Loan Bond Repayment Calculator",
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
      <CalculatorsView initialTab="amortization" />
    </>
  );
}
