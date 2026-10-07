import { unstable_cache } from "next/cache";

/**
 * Catalogue réel de la plateforme Seritex (fonction SQL `eshop_catalogue`,
 * migration 0108 de l'application) : modèles cochés « Publiable sur
 * l'e-shop », sans aucun prix (le prix arrive par le devis validé).
 *
 * SERVEUR UNIQUEMENT : utilise la clé « service role », comme /api/demande.
 * Les photos sont dans un bucket privé ; on les signe ici pour une heure, et
 * le catalogue est remis en cache 5 minutes (les liens restent donc valides).
 */

export type Disponibilite = "disponible" | "non_suivi" | "indisponible";
export type DisponibiliteModele = Disponibilite | "partiel";

export type CouleurCatalogue = { id: string; nom: string; hex: string | null; statut: Disponibilite };
export type GrammageCatalogue = { id: string; nom: string; grammage: number | null; composition: string | null };
export type TailleCatalogue = { id: string; cle: string; libelle: string };
export type EmplacementCatalogue = { id: string; cle: string; libelle: string };
export type MediaCatalogue = { url: string; couleurId: string | null; principale: boolean };

export type ModeleCatalogue = {
  id: string;
  code: string | null;
  nom: string;
  famille: string | null;
  sousFamille: string | null;
  texteCommercial: string | null;
  statut: DisponibiliteModele;
  couleurs: CouleurCatalogue[];
  grammages: GrammageCatalogue[];
  /** Disponibilité par grammage × couleur (seules les combinaisons connues). */
  disponibilites: { grammageId: string; couleurId: string; statut: Disponibilite }[];
  tailles: TailleCatalogue[];
  emplacements: EmplacementCatalogue[];
  medias: MediaCatalogue[];
};

/** Mention affichée à la place d'un article ou d'une couleur indisponible (même texte que la plateforme). */
export const MENTION_INDISPONIBLE = "Indisponible actuellement — contactez notre service commercial.";

type LigneSql = {
  id: string;
  code: string | null;
  nom: string;
  famille: string | null;
  sous_famille: string | null;
  texte_commercial: string | null;
  statut: DisponibiliteModele;
  couleurs: CouleurCatalogue[];
  grammages: { id: string; nom: string; grammage: number | string | null; composition: string | null }[];
  disponibilites: { textile_id: string; color_id: string; statut: Disponibilite }[];
  tailles: TailleCatalogue[];
  emplacements: EmplacementCatalogue[];
  medias: { path: string; color_id: string | null; principale: boolean }[];
};

const DUREE_LIENS_PHOTOS = 3600;

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("[catalogue] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
  return { url, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } };
}

async function signerPhotos(paths: string[]): Promise<Map<string, string>> {
  const liens = new Map<string, string>();
  if (paths.length === 0) return liens;
  const { url, headers } = config();
  const res = await fetch(`${url}/storage/v1/object/sign/articles`, {
    method: "POST",
    headers,
    body: JSON.stringify({ expiresIn: DUREE_LIENS_PHOTOS, paths }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[catalogue] signature des photos échouée", res.status, await res.text());
    return liens;
  }
  const signes = (await res.json()) as { path: string | null; signedURL: string | null; error: string | null }[];
  for (const s of signes) {
    if (s.path && s.signedURL) liens.set(s.path, `${url}/storage/v1${s.signedURL}`);
  }
  return liens;
}

async function chargerCatalogue(): Promise<ModeleCatalogue[]> {
  const { url, headers } = config();
  const res = await fetch(`${url}/rest/v1/rpc/eshop_catalogue`, { method: "POST", headers, body: "{}", cache: "no-store" });
  if (!res.ok) throw new Error(`[catalogue] lecture échouée (${res.status}) : ${await res.text()}`);
  const lignes = ((await res.json()) ?? []) as LigneSql[];
  const liens = await signerPhotos(lignes.flatMap((l) => l.medias.map((m) => m.path)));

  return lignes.map((l) => ({
    id: l.id,
    code: l.code,
    nom: l.nom,
    famille: l.famille,
    sousFamille: l.sous_famille,
    texteCommercial: l.texte_commercial,
    statut: l.statut,
    couleurs: l.couleurs,
    grammages: l.grammages.map((g) => ({ ...g, grammage: g.grammage == null ? null : Number(g.grammage) })),
    disponibilites: l.disponibilites.map((d) => ({ grammageId: d.textile_id, couleurId: d.color_id, statut: d.statut })),
    tailles: l.tailles,
    emplacements: l.emplacements,
    medias: l.medias.flatMap((m) => {
      const lien = liens.get(m.path);
      return lien ? [{ url: lien, couleurId: m.color_id, principale: m.principale }] : [];
    }),
  }));
}

/**
 * Catalogue mis en cache 5 minutes. En cas de panne de la plateforme, renvoie
 * une liste vide (le site reste en ligne, le formulaire de devis aussi).
 */
export async function getCatalogue(): Promise<ModeleCatalogue[]> {
  // Développement sans données publiées : catalogue d'exemple (jamais en production).
  if (process.env.CATALOGUE_EXEMPLE === "1" && process.env.VERCEL_ENV !== "production") {
    const { catalogueExemple } = await import("@/content/catalogue-exemple");
    return catalogueExemple;
  }
  return getCatalogueCache();
}

const getCatalogueCache = unstable_cache(
  async (): Promise<ModeleCatalogue[]> => {
    try {
      return await chargerCatalogue();
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  ["catalogue-plateforme"],
  { revalidate: 300, tags: ["catalogue"] },
);

/** Couleurs à proposer : on retire celles dont tout le tissu manque. */
export function couleursProposees(m: ModeleCatalogue): CouleurCatalogue[] {
  return m.couleurs.filter((c) => c.statut !== "indisponible");
}

/** Grammages proposés pour une couleur donnée (une combinaison indisponible est retirée). */
export function grammagesProposes(m: ModeleCatalogue, couleurId: string): GrammageCatalogue[] {
  return m.grammages.filter(
    (g) => !m.disponibilites.some((d) => d.grammageId === g.id && d.couleurId === couleurId && d.statut === "indisponible"),
  );
}

/** Photo à montrer pour une couleur : principale de la couleur, sinon principale « toutes couleurs », sinon la première. */
export function photoPour(m: ModeleCatalogue, couleurId: string | null): string | null {
  const pick =
    (couleurId && m.medias.find((p) => p.couleurId === couleurId && p.principale)) ||
    (couleurId && m.medias.find((p) => p.couleurId === couleurId)) ||
    m.medias.find((p) => p.couleurId === null && p.principale) ||
    m.medias[0];
  return pick ? pick.url : null;
}
