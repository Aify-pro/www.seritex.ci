import { unstable_cache } from "next/cache";

/**
 * Interrupteurs du site, réglés dans la plateforme (Paramètres > Site web,
 * fonction `site_reglages`, migration 0110). Relus toutes les minutes.
 *
 * Plateforme injoignable ou réglages absents : tout est considéré comme
 * DÉSACTIVÉ — le site reste en ligne et renvoie vers la demande de devis.
 */
export type ReglagesSite = {
  eshop: boolean;
  /** Effectif : déjà combiné avec l'e-shop par la plateforme. */
  personnaliser: boolean;
  message: string | null;
};

export const REGLAGES_FERMES: ReglagesSite = { eshop: false, personnaliser: false, message: null };

/** Texte par défaut quand l'outil est désactivé sans message particulier. */
export const MESSAGE_FERMETURE = "La personnalisation en ligne est momentanément indisponible. Nos conseillers restent à votre écoute.";

async function lire(): Promise<ReglagesSite> {
  if (process.env.CATALOGUE_EXEMPLE === "1" && process.env.VERCEL_ENV !== "production") {
    return { eshop: true, personnaliser: process.env.PERSONNALISER_FERME !== "1", message: null };
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return REGLAGES_FERMES;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/site_reglages`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[reglages] lecture échouée", res.status, await res.text());
      return REGLAGES_FERMES;
    }
    const r = (await res.json()) as Partial<ReglagesSite> | null;
    return { eshop: !!r?.eshop, personnaliser: !!r?.personnaliser, message: r?.message ?? null };
  } catch (e) {
    console.error("[reglages]", e);
    return REGLAGES_FERMES;
  }
}

export const getReglages = unstable_cache(lire, ["reglages-site"], { revalidate: 60, tags: ["reglages"] });
