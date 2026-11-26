import type { Metadata } from "next";

import AgencyShell from "./agency-shell";

export const metadata: Metadata = {
  title: "Agency",
  robots: { index: false, follow: false },
};

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return <AgencyShell>{children}</AgencyShell>;
}
