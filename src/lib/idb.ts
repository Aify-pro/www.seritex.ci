/**
 * Petit accès à IndexedDB pour les données gardées dans CE navigateur :
 * « brouillons » (composition en cours, un par article) et « panier »
 * (articles ajoutés, avec leurs logos et leur maquette PDF). Tout est
 * facultatif : si le navigateur refuse (navigation privée…), les fonctions
 * renvoient null et le parcours continue sans sauvegarde.
 */

const BASE = "seritex-site";
const VERSION = 2;
export type Magasin = "brouillons" | "panier";

function ouvrir(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(BASE, VERSION);
      req.onupgradeneeded = () => {
        for (const m of ["brouillons", "panier"] as const) {
          if (!req.result.objectStoreNames.contains(m)) req.result.createObjectStore(m);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function executer<T>(magasin: Magasin, mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  const db = await ouvrir();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(magasin, mode);
      const req = f(tx.objectStore(magasin));
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
