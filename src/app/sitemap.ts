import { MetadataRoute } from "next";
import { getPropertyList } from "@/lib/property-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dynastyestates.co.za";
  const now = new Date().toISOString();

  // 1. Core Platform Pages
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/calculators`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
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
      priority: 0.7,
    },
    {
      url: `${baseUrl}/seller`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  // 2. Individual Property Detail Pages
  // A sitemap that omits listings is recoverable; one that 500s is not, and
  // Search Console treats a failed fetch as a site-level problem. Log and
  // degrade to the static routes rather than substituting demo listings.
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

  // 3. High-Demand Location & Transaction Landing Hubs
  const locationHubs = [
    { province: "gauteng", city: "pretoria", type: "for-sale" },
    { province: "gauteng", city: "johannesburg", type: "for-sale" },
    { province: "gauteng", city: "johannesburg", type: "to-rent" },
    { province: "western-cape", city: "cape-town", type: "for-sale" },
    { province: "western-cape", city: "cape-town", type: "to-rent" },
    { province: "kwazulu-natal", city: "durban", type: "for-sale" },
  ];

  const locationRoutes: MetadataRoute.Sitemap = locationHubs.map((hub) => ({
    url: `${baseUrl}/${hub.type}/${hub.province}/${hub.city}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [...coreRoutes, ...locationRoutes, ...propertyRoutes];
}

