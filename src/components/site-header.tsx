import AccountActions from "@/components/account-actions";
import BrandLogo from "@/components/brand-logo";
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
 * `relative z-50`: the bar is a backdrop-blur stacking context, so at `auto`
 * page content that follows painted over the Sell / Tools dropdowns. A section
 * that must cover the header should portal to the body (as
 * ExpandableSearchPanel does) rather than raise its own z-index.
 */
export default function SiteHeader() {
  return (
    <div className="no-print relative z-50 hidden px-8 pt-6 lg:block">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between rounded-card border border-white/70 bg-white/40 px-6 py-3 shadow-[0_12px_30px_rgba(36,48,50,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1719]/70 dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
        <BrandLogo />
        <SiteNavigation />
        <AccountActions />
      </header>
    </div>
  );
}
