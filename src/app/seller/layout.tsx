import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Portal | Dynasty Estates",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SellerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
