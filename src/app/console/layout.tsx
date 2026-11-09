import type { Metadata } from "next";

import ConsoleShell from "./_components/console-shell";

export const metadata: Metadata = {
  title: "Developer console",
  robots: { index: false, follow: false },
};

/**
 * The developer console. Access is decided server-side on every API call
 * (src/lib/server/console-auth.ts); the shell only mirrors that answer.
 */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
