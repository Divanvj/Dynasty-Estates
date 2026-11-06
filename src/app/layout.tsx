import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import MobileAppBar from "@/components/mobile-app-bar";
import MobileNav from "@/components/mobile-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_URL } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// viewportFit: "cover" is what makes env(safe-area-inset-*) resolve, so the
// bottom nav clears the home indicator on modern phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// `metadataBase` is what lets Next resolve og:image to an absolute URL. Without
// it the generated card below is emitted as a relative path, which no scraper
// will fetch — the reason every page shared from this site produced a blank
// preview card.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Property for sale and to rent in South Africa | Dynasty Estates",
    template: "%s | Dynasty Estates",
  },
  // The previous description — "Luxury property discovery interface inspired by
  // premium modern real-estate experiences" — described the interface, and
  // credited an inspiration, in the sentence Google shows to a buyer.
  description:
    "Search homes for sale and to rent across South Africa. Filter by suburb, price, bedrooms and energy resilience, and speak to the agent directly.",
  applicationName: "Dynasty Estates",
  openGraph: {
    type: "website",
    siteName: "Dynasty Estates",
    locale: "en_ZA",
    title: "Property for sale and to rent in South Africa | Dynasty Estates",
    description:
      "Search homes for sale and to rent across South Africa, with solar and energy-resilience details on every listing.",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/dynasty-app-icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/dynasty-app-icon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          A plain <script>, not next/script. This has to execute synchronously
          before first paint or the page flashes the wrong theme, and
          next/script's `beforeInteractive` explicitly does not block paint —
          it also renders through a client component, which makes React 19 warn
          that scripts inside components never execute on the client. RootLayout
          is a Server Component, so this is emitted straight into the HTML and
          runs where it needs to.

          Keep the storage key and the `dark` class in step with
          src/components/theme-provider.tsx.
        */}
        <script
          id="dynasty-theme-init"
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var stored = localStorage.getItem("dynasty_theme");
                var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                // No stored preference means light, not "follow the OS" — see
                // DEFAULT_THEME in src/components/theme-provider.tsx, which must
                // agree with this line or the page paints twice. Someone who has
                // explicitly chosen "system" still follows the OS.
                var isDark = stored === "dark" || (stored === "system" && prefersDark);
                if (isDark) {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        /* The bottom padding reserves room for the fixed tab bar. It read a
           hardcoded 68px against a bar that measured 63, so every phone page
           ended in 5px of dead space; it now derives from the same variable
           the bar is sized from. */
        className="min-h-full bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 antialiased pb-[calc(var(--dyn-mobile-nav-h)+env(safe-area-inset-bottom))] lg:pb-0"
      >
        <ThemeProvider>
          <AuthProvider>
            {/* Before `{children}`, so the sticky bar pins to the top of the
                document rather than to whatever the first page section is.
                Below `lg` only — the desktop keeps SiteNavigation and the
                per-page headers exactly as they are. */}
            <MobileAppBar />
            {children}
            <MobileNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
