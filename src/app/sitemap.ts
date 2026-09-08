import type { MetadataRoute } from "next";
import { projects } from "@/lib/data";
import { siteUrl } from "@/lib/site";

/* Twelve case studies are statically generated and nothing was telling a
   crawler they existed. Generated from the same array the pages are, so a new
   project appears here by being added once. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...projects.map((p) => ({
      url: `${siteUrl}/work/${p.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
