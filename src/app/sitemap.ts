import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { techniques } from "@/content/techniques";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/savoir-faire", "/techniques", "/produits", "/realisations", "/commander", "/devis"];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.8 })),
    ...techniques.map((t) => ({ url: `${site.url}/techniques/${t.slug}`, changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
