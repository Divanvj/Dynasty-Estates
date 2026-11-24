import { unstable_cache } from "next/cache";
import { Suspense } from "react";

import { getPropertyList } from "@/lib/property-data";

import SearchContent from "./search-content";

/**
 * /search used to be one client component: the HTML held only "Loading search
 * engine...", and the listings were queried from Firestore after the page's
 * script had loaded. On a phone the first result card appeared at about 5.3 s
 * (PageSpeed, mobile, 24 Nov). Now the catalogue is fetched here and the first
 * results are rendered on the server; filtering and sorting stay in the browser.
 *
 * The catalogue is cached for 5 minutes, the same as the home page, so a page
 * view does not read every listing from Firestore. Reading `searchParams`
 * makes the page render per request, which is what lets the filters in the URL
 * (read with useSearchParams in SearchContent) shape the server HTML; a static
 * page would have sent the Suspense fallback instead.
 */
const getCatalogue = unstable_cache(getPropertyList, ["search-catalogue"], { revalidate: 300 });

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  let initialProperties: Awaited<ReturnType<typeof getPropertyList>> | null;
  try {
    initialProperties = await getCatalogue();
  } catch (error) {
    // The browser tries again and shows the error if that fails too.
    console.error("Search catalogue query failed:", error);
    initialProperties = null;
  }

  return (
    <main className="min-h-screen bg-transparent px-4 pt-3 pb-5 sm:pt-5 text-slate-900 dark:text-slate-100 md:px-6 lg:px-8 transition-colors duration-300">
      <Suspense fallback={<div className="text-center py-20 text-slate-600 dark:text-slate-400">Loading search engine...</div>}>
        <SearchContent initialProperties={initialProperties} />
      </Suspense>
    </main>
  );
}
