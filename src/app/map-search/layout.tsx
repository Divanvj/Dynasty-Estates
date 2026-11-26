import type { Metadata } from "next";

import { FeatureGate } from "@/components/platform-status";

export const metadata: Metadata = {
  title: "Map search",
  description: "Browse homes for sale and to rent in South Africa on a map.",
};

/** Lets the developer console switch this page off (/console/flags). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate flag="mapSearch" name="Map search">
      {children}
    </FeatureGate>
  );
}
