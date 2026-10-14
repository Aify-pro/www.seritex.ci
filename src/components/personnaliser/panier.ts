import { executer } from "@/lib/idb";
import type { ArticleEnvoye } from "@/lib/envoi-personnalisation";
import type { ConfigStockee } from "./brouillon";

/**
 * Panier de l'e-shop, gardé dans CE navigateur (IndexedDB) : chaque article
 * emporte sa composition (pour la modifier), ses logos, sa maquette PDF et la
 * charge utile déjà calculée pour la plateforme. La demande part en une seule
 * fois depuis la page panier.
 */

export type ArticlePanier = {
  id: string;
  ajouteLe: number;
  modeleId: string;
  /** Fin d'adresse de la fiche article (/e-shop/<slug>) pour « Modifier ». */
  slug: string;
  nom: string;
  /** Pour l'affichage du panier. */
  resume: { couleur: string; couleurHex: string; grammage: string | null; quantite: number; marquages: string[] };
  /** Pour modifier l'article (il retourne dans le configurateur). */
  config: ConfigStockee;
  etape: number;
  /** Charge utile pour la plateforme (sans les fichiers). */
  envoi: ArticleEnvoye;
  /** Logos distincts de l'article ; `marquage` = rang du premier marquage qui l'utilise (à partir de 1). */
  logos: { fichier: File; marquage: number }[];
  maquette: Blob;
  apercu: Blob | null;
};

const MAGASIN = "panier";
export const EVENEMENT_PANIER = "sx-panier";

const prevenir = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENEMENT_PANIER));
};

export async function lirePanier(): Promise<ArticlePanier[]> {
  const l = await executer<ArticlePanier[]>(MAGASIN, "readonly", (s) => s.getAll());
  return (l ?? []).sort((a, b) => a.ajouteLe - b.ajouteLe);
}

/** false si le navigateur refuse de garder le panier (navigation privée, stockage plein…). */
export async function ajouterAuPanier(nouveau: Omit<ArticlePanier, "id" | "ajouteLe">): Promise<boolean> {
  const a: ArticlePanier = { ...nouveau, id: crypto.randomUUID(), ajouteLe: Date.now() };
  const ok = (await executer(MAGASIN, "readwrite", (s) => s.put(a, a.id))) !== null;
  if (ok) prevenir();
  return ok;
}

export async function retirerDuPanier(id: string) {
  await executer(MAGASIN, "readwrite", (s) => s.delete(id));
  prevenir();
}

export async function viderPanier() {
  await executer(MAGASIN, "readwrite", (s) => s.clear());
  prevenir();
}

export async function compterPanier(): Promise<number> {
  return (await executer<number>(MAGASIN, "readonly", (s) => s.count())) ?? 0;
}
