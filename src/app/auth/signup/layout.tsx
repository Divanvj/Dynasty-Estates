import type { Metadata } from "next";

// The page is a client component, so its title lives here. Without it the tab
// read "Property for sale and to rent in South Africa", like the home page.
export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: true },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
