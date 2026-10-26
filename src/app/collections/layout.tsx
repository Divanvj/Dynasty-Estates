import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Collections",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
