import type { Metadata } from "next";

import AgentShell from "./agent-shell";

export const metadata: Metadata = {
  title: "Practitioner Workspace | Dynasty Estates",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AgentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AgentShell>{children}</AgentShell>;
}
