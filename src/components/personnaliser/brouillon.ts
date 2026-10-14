import { chargerLogo } from "@/lib/analyse-logo";
import type { ModeleCatalogue } from "@/lib/catalogue-plateforme";
import type { Configuration, Marquage } from "./etat";

/**
 * Brouillon de la composition, gardé dans CE navigateur (IndexedDB, logos
 * compris) : la personne peut s'identifier, créer un compte ou confirmer son
 * e-mail dans un autre onglet sans rien perdre. Un brouillon par article.
 * Tout est facultatif : si le navigateur refuse (navigation privée…), la
 * composition reste simplement non sauvegardée.
 */

const BASE = "seritex-site";
const MAGASIN = "brouillons";
const VALIDITE_MS = 14 * 24 * 3600 * 1000;

type MarquageStocke = Omit<Marquage, "logo"> & { logo: { nom: string; fichier: File } | null };
type Stocke = { v: 1; t: number; etape: number; config: Omit<Configuration, "marquages"> & { marquages: MarquageStocke[] } };

function ouvrir(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(BASE, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(MAGASIN);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function executer<T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await ouvrir();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(MAGASIN, mode);
      const req = f(tx.objectStore(MAGASIN));
      tx.oncomplete = () => {
        db.close();
        resolve(req.result ?? null);
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function sauverBrouillon(modeleId: string, config: Configuration, etape: number) {
  const stocke: Stocke = {
    v: 1,
    t: Date.now(),
    etape,
    config: { ...config, marquages: config.marquages.map((m) => ({ ...m, logo: m.logo ? { nom: m.logo.nom, fichier: m.logo.fichier } : null })) },
  };
  await executer("readwrite", (s) => s.put(stocke, modeleId));
}

export async function effacerBrouillon(modeleId: string) {
  await executer("readwrite", (s) => s.delete(modeleId));
}

/** Relit le brouillon et le confronte au catalogue d'aujourd'hui (couleurs, tissus, emplacements) ; null s'il n'y en a pas ou s'il est périmé. */
export async function lireBrouillon(modele: ModeleCatalogue): Promise<{ config: Configuration; etape: number } | null> {
  const b = await executer<Stocke | undefined>("readonly", (s) => s.get(modele.id));
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
