import Link from "next/link";

import HeroHeadline from "@/components/hero-headline";
import HomeHeroPhoto from "@/components/home-hero-photo";
import HomeHeroSearch from "@/components/home-hero-search";
import HomeTrendingListings from "@/components/home-trending-listings";
import HomeSpotlight from "@/components/home-spotlight";
import { getPropertyList } from "@/lib/property-data";

// The catalogue changes without a deploy (listings published, sold, removed),
// so this page is rebuilt at most every 5 minutes. Without it the build-time
// copy was served until the next deploy (found in S1-5: deleted listings
// still showed on the live home page).
export const revalidate = 300;
export default async function Home() {
  // A catalogue failure must not 500 the landing page: it renders without
  // listings and the error is logged. There is no sample catalogue to fall
  // back to any more (S1-1).
  let properties: Awaited<ReturnType<typeof getPropertyList>>;
  try {
    properties = await getPropertyList();
  } catch (error) {
    console.error("Homepage catalogue query failed:", error);
    properties = [];
  }

  return (
    <main className="min-h-screen bg-transparent px-3 py-4 text-slate-900 dark:text-slate-100 md:px-6 lg:px-8">
        {/*
          Full-width photo hero (owner, 25 Nov 2026). Was a frosted panel with
          no picture, which read as plain. Now the hero runs edge to edge over
          our own render of a coastal home (HomeHeroPhoto), with the page
          colour fading up from the bottom behind the headline and search.

          It sits outside the 1500px container, and the negative margins undo
          <main>'s padding so the photo reaches both edges. From `lg` the
          floating SiteHeader (z-[60], 98px tall with its top gap) sits over
          the photo: -mt (98px + main's 16px top padding) pulls the hero up under it, and the top padding
          keeps the content clear of it. Below `lg` the phone bar is sticky and
          solid, so the photo starts under it.

          z-40, the same layer the hero always had: under the header and its
          menus (z-[60]/61), over the sections below. No transform or filter
          on this section: the search panel's full-screen dialog is `fixed`,
          and either would trap it inside the hero.

          The scroll-driven camera move (HomeHeroScene, inside HomeHeroPhoto):
          from `lg`, when motion is allowed, the section is 70vh taller than
          its stage and the stage is sticky, so the hero holds still while the
          camera moves through the house; the search stays in place and usable
          the whole time. Phones and reduced motion get no hold. `sticky` does
          not trap the fixed filters dialog (only transform/filter would).
        */}
        <section
          id="discover"
          className="relative z-40 -mx-3 -mt-4 md:-mx-6 lg:-mx-8 lg:-mt-[114px] motion-safe:lg:h-[calc(min(860px,94vh)+70vh)]"
        >
          <div className="relative isolate flex min-h-[580px] flex-col justify-end sm:min-h-[640px] lg:h-[min(860px,94vh)] lg:min-h-0 motion-safe:lg:sticky motion-safe:lg:top-0">
          <HomeHeroPhoto />
          <div className="mx-auto w-full max-w-[1440px] px-3 pb-8 pt-40 sm:px-6 sm:pb-12 md:px-8 lg:px-10 lg:pb-16">
            {/*
              <AmbientCursorHue heroScoped /> was mounted here: an animated
              aurora field with cursor parallax, running a canvas and a
              requestAnimationFrame loop behind the headline.

              Removed for two reasons. It is the most recognisable
              "AI-generated landing page" signature of this era, and neither
              Property24 nor Private Property animates anything behind their
              search — both open on a photograph or a flat colour. And the home
              page measures 9.5s LCP with 650ms of blocking on throttled
              mobile, where the cost is main-thread work rather than bytes;
              this was main-thread work for decoration.

              The component still exists and is still used elsewhere. Only the
              hero stops mounting it.
            */}

            {/*
              max-w-5xl, not 3xl. This wrapper holds only the headline, and the
              approved hero copy includes four deliberate two-line couplets. At
              768px each half of a couplet wrapped on its own, so a two-line
              couplet rendered as four rows and the hero's height swung as the
              copy rotated. At 1024px the halves fit their own lines, which is
              what the couplets were written to do.
            */}
            <div className="relative z-10 mx-auto max-w-5xl text-center">
              <HeroHeadline />
            </div>

            {/* Interactive Search Component */}
            <HomeHeroSearch />

            {/*
              Two hero tiles stood here: "20 Active" and "100% Solar". Both were
              hardcoded — the first a fabricated count that would have read as
              thin at launch and odd at scale, the second a claim the catalogue
              does not substantiate. Counts belong on the results page, where
              they describe a real query. Removed per the Improvement Notes.
            */}
          </div>
          </div>
        </section>

      <div className="mx-auto max-w-[1500px]">
        {/* Spotlight — led by the viewer's own recent views, falling back to the
            catalogue's best for a first-time visitor. Was a single hardcoded
            Camps Bay listing with a stock photograph, shown to everyone. */}
        <HomeSpotlight properties={properties} />

        <HomeTrendingListings properties={properties} />

        {/* Collections. This section used to pair a "Metros at a Glance" panel
            of growth figures typed into this file (+7.8%, +6.4%…) with two
            invented shortlists ("2 collaborators · 4 votes cast") shown to
            every visitor. Neither came from data, so both are gone; the panel
            now says what Collections does and sends people to start one.
            Market figures live on /insights, which labels them as sample. */}
        <section className="mx-auto mt-8 max-w-[1440px]">
          <div className="rounded-panel border border-emerald-500/25 bg-gradient-to-br from-[#082224] to-[#041416] p-6 text-white shadow-[0_20px_45px_rgba(4,20,22,0.35)] backdrop-blur-xl md:p-8">
            {/* `flex-wrap` + `min-w-0`: `.pill` is `flex-shrink: 0` and
                `white-space: nowrap`; without them the button overflowed its
                row at 375px and pushed the document into a horizontal scroll. */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 max-w-2xl">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400 font-semibold">Collections</p>
                <h3 className="mt-1 text-2xl font-light text-white">Find homes with your partner</h3>
                <p className="mt-3 text-sm leading-relaxed text-emerald-100/80">
                  Save homes into a shared collection, invite your partner or family, and vote Love, Like or Reject on each one together.
                </p>
              </div>
              <Link
                href="/collections"
                className="pill border border-emerald-400/40 bg-emerald-500/20 font-semibold text-emerald-200 hover:bg-emerald-500/30 transition-all"
              >
                Start a collection →
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
