import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { techniques } from "@/content/techniques";
import { getReglages } from "@/lib/reglages-site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { personnaliser } = await getReglages();
  const pages = ["", "/savoir-faire", "/techniques", "/produits", "/realisations", "/commander", "/devis", ...(personnaliser ? ["/personnaliser"] : [])];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.8 })),
    ...techniques.map((t) => ({ url: `${site.url}/techniques/${t.slug}`, changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
