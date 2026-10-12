import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import MobileNav from "@/components/mobile-nav";
import { ThemeProvider } from "@/components/theme-provider";

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

export const metadata: Metadata = {
  title: "Dynasty Estates | Property Intelligence",
  description:
    "Luxury property discovery interface inspired by premium modern real-estate experiences.",
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
                var isDark = stored === "dark" || (!stored && prefersDark) || (stored === "system" && prefersDark);
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
        className="min-h-full bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 antialiased pb-[calc(68px+env(safe-area-inset-bottom))] lg:pb-0"
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <MobileNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
