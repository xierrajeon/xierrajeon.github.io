import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** Route handlers must opt in explicitly under `output: "export"`. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The admin bundle is public but has nothing worth indexing.
      disallow: "/admin",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
