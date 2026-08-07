import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private, transactional or single-use pages — nothing here belongs
        // in an index, and several would leak booking references.
        disallow: [
          "/admin",
          "/admin/",
          "/account",
          "/api/",
          "/booking/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/auth/",
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
