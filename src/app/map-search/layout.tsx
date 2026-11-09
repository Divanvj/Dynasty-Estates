import { FeatureGate } from "@/components/platform-status";

/** Lets the developer console switch this page off (/console/flags). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FeatureGate flag="mapSearch" name="Map search">
      {children}
    </FeatureGate>
  );
}
