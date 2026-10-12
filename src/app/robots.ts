import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://dynastyestates.co.za";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/search",
          "/property/",
          "/for-sale/",
          "/to-rent/",
          "/calculators",
          "/insights",
          "/agents",
          "/seller",
          "/legal",
          "/collections",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/agent",
          "/agent/*",
          "/saved",
          "/inquiries",
          "/api/",
          "/api/*",
          "/auth",
          "/*?*priceMin=*", // Prevent combinatorial query param crawl traps
          "/*?*priceMax=*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

