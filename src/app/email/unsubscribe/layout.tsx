import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stop e-mails",
  robots: { index: false, follow: false },
};

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
