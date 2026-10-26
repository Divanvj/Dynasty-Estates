import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Properties",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
