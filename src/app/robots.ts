import { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/search",
          "/property/",
          "/for-sale",
          "/for-sale/",
          "/to-rent",
          "/to-rent/",
          "/calculators",
          "/insights",
          "/agents",
          "/legal/privacy",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/agent",
          "/agent/*",
          "/seller",
          "/seller/*",
          "/saved",
          "/saved/*",
          "/inquiries",
          "/inquiries/*",
          "/collections",
          "/collections/*",
          "/compare",
          "/compare/*",
          "/api/",
          "/api/*",
          "/auth",
          "/auth/*",
          "/*?*minPrice=*", // Prevent combinatorial query param crawl traps
          "/*?*maxPrice=*",
          "/*?*beds=*",
          "/*?*baths=*",
          "/*?*parking=*",
          "/*?*furnished=*",
          "/*?*features=*",
          "/*?*sort=*",
          "/*?*view=*",
          "/*?*q=*",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

