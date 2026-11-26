import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Estate agents",
  description:
    "Estate agents who list homes on Dynasty Estates, by area, with their contact details and the homes they have listed.",
  alternates: {
    canonical: absoluteUrl("/agents"),
  },
  openGraph: {
    title: "Estate agents | Dynasty Estates",
    description:
      "Find an estate agent by area and see the homes they have listed on Dynasty Estates.",
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
