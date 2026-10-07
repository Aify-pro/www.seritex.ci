import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { techniques } from "@/content/techniques";
import { getCatalogue, slugModele } from "@/lib/catalogue-plateforme";
import { getReglages } from "@/lib/reglages-site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { eshop } = await getReglages();
  const articles = eshop ? await getCatalogue() : [];
  const pages = ["", "/savoir-faire", "/techniques", "/produits", "/realisations", "/commander", "/devis", ...(eshop ? ["/e-shop"] : [])];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.8 })),
    ...articles.map((m) => ({ url: `${site.url}/e-shop/${slugModele(m)}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...techniques.map((t) => ({ url: `${site.url}/techniques/${t.slug}`, changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
