import type { LogoCharge } from "@/lib/analyse-logo";
import {
  couleursProposees,
  grammagesProposes,
  type ModeleCatalogue,
} from "@/lib/catalogue-plateforme";
import { placementPour, type TechniqueId } from "@/lib/marquage";

/** Un marquage : un logo, un emplacement, une taille, une technique, et sa position ajustée par le client. */
export type Marquage = {
  id: string;
  emplacementId: string;
  logo: LogoCharge | null;
  largeurCm: number;
  technique: TechniqueId;
  consigne: string;
  /** Décalage du centre par rapport à la position type de l'emplacement (cm, vers la droite / vers le bas de l'aperçu). */
  dxCm: number;
  dyCm: number;
  /** Inclinaison en degrés (sens horaire), de -180 à 180. */
  rotation: number;
};

export type Configuration = {
  modeleId: string;
  couleurId: string;
  grammageId: string | null;
  quantite: string;
  /** Répartition par taille, facultative (sinon Seritex propose la répartition au devis). */
  repartition: Record<string, string> | null;
  marquages: Marquage[];
};

let compteur = 0;
export const nouvelId = () => `m${Date.now().toString(36)}${(compteur++).toString(36)}`;

export function nouveauMarquage(m: ModeleCatalogue, emplacementId: string): Marquage {
  const z = m.emplacements.find((e) => e.id === emplacementId);
  const p = z ? placementPour(z.cle, z.libelle) : null;
  return { id: nouvelId(), emplacementId, logo: null, largeurCm: p?.defautCm ?? 9, technique: "serigraphie", consigne: "", dxCm: 0, dyCm: 0, rotation: 0 };
}

export function configurationInitiale(m: ModeleCatalogue): Configuration {
  const couleur = couleursProposees(m)[0];
  const grammage = couleur ? grammagesProposes(m, couleur.id)[0] : m.grammages[0];
  return {
    modeleId: m.id,
    couleurId: couleur?.id ?? "",
    grammageId: grammage?.id ?? null,
    quantite: "",
    repartition: null,
    marquages: m.emplacements[0] ? [nouveauMarquage(m, m.emplacements[0].id)] : [],
  };
}

export const quantiteTotale = (c: Configuration) => {
  if (c.repartition) {
    return Object.values(c.repartition).reduce((s, v) => s + (Number.parseInt(v, 10) || 0), 0);
  }
  return Number.parseInt(c.quantite, 10) || 0;
};
