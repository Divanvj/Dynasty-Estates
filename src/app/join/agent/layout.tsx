import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply for agent access | Dynasty Estates",
  robots: { index: false, follow: false },
};

export default function JoinAgentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
