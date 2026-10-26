import { MetadataRoute } from "next";
import { verifiedPractitioners } from "@/lib/agents-data";
import { getPropertyList } from "@/lib/property-data";
import { SITE_URL } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const now = new Date().toISOString();

  // 1. Core Platform Pages (Canonical, indexable pages only)
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/for-sale`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/to-rent`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/calculators`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calculators/transfer-duty`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/calculators/bond-repayment`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/calculators/conveyancing-fees`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agents`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // 2. Individual Property Detail Pages
  let properties: Awaited<ReturnType<typeof getPropertyList>> = [];
  try {
    properties = await getPropertyList();
  } catch (error) {
    console.error("Sitemap could not load listings; emitting static routes only:", error);
  }
  const propertyRoutes: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${baseUrl}/property/${property.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // 3. Dynamic Location & Transaction Landing Hubs
  // Discovered from active inventory so sitemaps never emit broken or ghost routes.
  const provinceSet = new Set<string>();
  const citySet = new Set<string>(); // "type:province:city"

  for (const p of properties) {
    if (p.province) {
      const provSlug = p.province.toLowerCase().replace(/\s+/g, "-");
      provinceSet.add(`for-sale:${provSlug}`);
      provinceSet.add(`to-rent:${provSlug}`);

      if (p.city) {
        const citySlug = p.city.toLowerCase().replace(/\s+/g, "-");
        const type = p.listingType === "rent" ? "to-rent" : "for-sale";
        citySet.add(`${type}:${provSlug}:${citySlug}`);
        // Ensure both transaction hubs exist for high-inventory metros
        citySet.add(`for-sale:${provSlug}:${citySlug}`);
        citySet.add(`to-rent:${provSlug}:${citySlug}`);
      }
    }
  }

  // Fallback core hubs if database is initializing
  if (citySet.size === 0) {
    citySet.add("for-sale:gauteng:pretoria");
    citySet.add("for-sale:gauteng:johannesburg");
    citySet.add("to-rent:gauteng:johannesburg");
    citySet.add("for-sale:western-cape:cape-town");
    citySet.add("to-rent:western-cape:cape-town");
    citySet.add("for-sale:kwazulu-natal:durban");
  }

  const provinceRoutes: MetadataRoute.Sitemap = Array.from(provinceSet).map((entry) => {
    const [type, prov] = entry.split(":");
    return {
      url: `${baseUrl}/${type}/${prov}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    };
  });

  const cityRoutes: MetadataRoute.Sitemap = Array.from(citySet).map((entry) => {
    const [type, prov, city] = entry.split(":");
    return {
      url: `${baseUrl}/${type}/${prov}/${city}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    };
  });

  const agentRoutes: MetadataRoute.Sitemap = verifiedPractitioners.map((agent) => ({
    url: `${baseUrl}/agents/${agent.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  return [...coreRoutes, ...agentRoutes, ...provinceRoutes, ...cityRoutes, ...propertyRoutes];
}

