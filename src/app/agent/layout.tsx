import type { Metadata } from "next";

import AgentShell from "./agent-shell";

export const metadata: Metadata = {
  title: "Agent dashboard",
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
