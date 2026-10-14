import { chargerLogo } from "@/lib/analyse-logo";
import { executer } from "@/lib/idb";
import type { ModeleCatalogue } from "@/lib/catalogue-plateforme";
import type { Configuration, Marquage } from "./etat";

/**
 * Brouillon de la composition, gardé dans CE navigateur (IndexedDB, logos
 * compris) : la personne peut s'identifier, créer un compte ou confirmer son
 * e-mail dans un autre onglet sans rien perdre. Un brouillon par article.
 * Tout est facultatif : si le navigateur refuse (navigation privée…), la
 * composition reste simplement non sauvegardée.
 */

const MAGASIN = "brouillons";
const VALIDITE_MS = 14 * 24 * 3600 * 1000;

type MarquageStocke = Omit<Marquage, "logo"> & { logo: { nom: string; fichier: File } | null };
/** Composition telle qu'elle est gardée dans le navigateur (le logo est le fichier, pas son analyse). */
export type ConfigStockee = Omit<Configuration, "marquages"> & { marquages: MarquageStocke[] };
type Stocke = { v: 1; t: number; etape: number; config: ConfigStockee };

export const versStocke = (config: Configuration): ConfigStockee => ({
  ...config,
  marquages: config.marquages.map((m) => ({ ...m, logo: m.logo ? { nom: m.logo.nom, fichier: m.logo.fichier } : null })),
});

/** Écrit directement un brouillon (ex. « Modifier » un article du panier : il revient dans le configurateur). */
export async function ecrireBrouillon(modeleId: string, config: ConfigStockee, etape: number) {
  const stocke: Stocke = { v: 1, t: Date.now(), etape, config };
  await executer(MAGASIN, "readwrite", (s) => s.put(stocke, modeleId));
}

export async function sauverBrouillon(modeleId: string, config: Configuration, etape: number) {
  await ecrireBrouillon(modeleId, versStocke(config), etape);
}

export async function effacerBrouillon(modeleId: string) {
  await executer(MAGASIN, "readwrite", (s) => s.delete(modeleId));
}

/** Relit le brouillon et le confronte au catalogue d'aujourd'hui (couleurs, tissus, emplacements) ; null s'il n'y en a pas ou s'il est périmé. */
export async function lireBrouillon(modele: ModeleCatalogue): Promise<{ config: Configuration; etape: number } | null> {
  const b = await executer<Stocke | undefined>(MAGASIN, "readonly", (s) => s.get(modele.id));
  if (!b || b.v !== 1 || Date.now() - b.t > VALIDITE_MS) return null;
  const c = b.config;
  if (!modele.couleurs.some((x) => x.id === c.couleurId)) return null;

  const marquages: Marquage[] = [];
  for (const m of c.marquages) {
    if (!modele.emplacements.some((e) => e.id === m.emplacementId)) continue;
    let logo = null;
    if (m.logo) {
      try {
        logo = await chargerLogo(m.logo.fichier);
      } catch {
        logo = null;
      }
    }
    marquages.push({ ...m, logo });
  }
  const zonesValides = c.couleursZones && modele.zonesCouleur.every((z) => c.couleursZones![z.cle] && modele.couleurs.some((x) => x.id === c.couleursZones![z.cle]));
  return {
    etape: Math.min(Math.max(0, b.etape), 2),
    config: {
      ...c,
      modeleId: modele.id,
      grammageId: modele.grammages.some((g) => g.id === c.grammageId) ? c.grammageId : (modele.grammages[0]?.id ?? null),
      couleursZones: zonesValides ? c.couleursZones : null,
      marquages,
    },
  };
}
