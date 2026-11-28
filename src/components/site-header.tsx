import AccountActions from "@/components/account-actions";
import BrandLogo from "@/components/brand-logo";
import SiteHeaderReveal from "@/components/site-header-reveal";
import SiteNavigation from "@/components/site-navigation";

/**
 * The one desktop header, rendered once in the root layout. Before this, the
 * home and browse pages drew this bar themselves and ~20 other pages each drew
 * a different one (search: Home · Collections · Compare · Saved; property: a
 * hand-drawn "D" tile + Search Catalogue; map: "Geospatial Intelligence"…), so
 * the menu changed from page to page. Pages now keep only their own title and
 * page actions in an ordinary row below this.
 *
 * Below `lg` the brand, menu and account live in MobileAppBar instead, so this
 * is `hidden lg:block`.
 *
 * `z-[60]`, above every page layer. The Sell / Tools / Profile dropdowns live
 * inside this bar's stacking context, so they can only ever be as high as the
 * bar itself. At z-50 it tied with page rows that are also z-50 (the listing
 * action row, /compare's and /map-search's bars) and those, coming later in
 * the DOM, painted over the open dropdowns. Page content stays at ≤ z-50;
 * dialogs that must cover the header sit at z-[80] or above (or portal to the
 * body, as ExpandableSearchPanel does).
 *
 * SiteHeaderReveal makes it sticky and brings it back on any small scroll up.
 *
 * One frosted-glass look everywhere (owner, 28 Nov 2026), at the top of the
 * page and floating over listings alike.
 */
export default function SiteHeader() {
  return (
    <SiteHeaderReveal>
      <header className="pointer-events-auto mx-auto flex max-w-[1440px] items-center justify-between rounded-card border border-white/70 bg-white/60 px-6 py-3 shadow-[0_12px_30px_rgba(36,48,50,0.06)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-[#0b1719]/70 dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
        <BrandLogo />
        <SiteNavigation />
        <AccountActions />
      </header>
    </SiteHeaderReveal>
  );
}
