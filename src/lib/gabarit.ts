import type { MockupCatalogue, ModeleCatalogue } from "./catalogue-plateforme";
import { placementPour, type Placement, type Vue } from "./marquage";

/**
 * Gabarit d'une vue : la silhouette standard du site, ou le mockup SVG déposé
 * dans la fiche article de la plateforme (migration 0121), avec son échelle
 * (calibrage) et les repères des zones d'impression.
 */

export const VIEWBOX_STANDARD: [number, number, number, number] = [0, 0, 400, 440];

const vueMockup = (vue: Vue): MockupCatalogue["vue"] => (vue === "face" ? "avant" : "dos");

export function mockupPour(modele: ModeleCatalogue, vue: Vue): MockupCatalogue | null {
  return modele.mockups.find((m) => m.vue === vueMockup(vue)) ?? null;
}

/** Cadre de dessin d'un mockup (viewBox de son élément racine). */
export function viewBoxDe(mockup: MockupCatalogue | null): [number, number, number, number] {
  if (!mockup) return VIEWBOX_STANDARD;
  const ouverture = mockup.svg.slice(0, mockup.svg.indexOf(">"));
  const v = ouverture.match(/viewBox="\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)\s*"/);
  return v ? [Number(v[1]), Number(v[2]), Number(v[3]), Number(v[4])] : VIEWBOX_STANDARD;
}

/**
 * Placement d'un emplacement du modèle : position type de la silhouette
 * standard, ou — si le modèle a un mockup — le repère posé dans la fiche
 * article, à l'échelle du mockup. Sans repère, la position type est reportée
 * proportionnellement dans le cadre du vêtement.
 */
export function placementDe(modele: ModeleCatalogue, emplacementId: string): Placement {
  const zone = modele.emplacements.find((e) => e.id === emplacementId);
  const base = placementPour(zone?.cle ?? "", zone?.libelle ?? "");
  const mk = (zone && modele.mockups.find((m) => m.reperes[zone.id])) ?? mockupPour(modele, base.vue);
  if (!mk || !(mk.largeurCm > 0) || !(mk.cadre.w > 0)) return base;
  const r = (zone && mk.reperes[zone.id]) ?? {
    // Silhouette standard : vêtement de x = 5 à 395 et de y = 40 à 420.
    x: mk.cadre.x + ((base.x - 5) / 390) * mk.cadre.w,
    y: mk.cadre.y + ((base.y - 40) / 380) * mk.cadre.h,
  };
  return {
    ...base,
    vue: mk.vue === "avant" ? "face" : "dos",
    x: r.x,
    y: r.y,
    echelle: mk.cadre.w / mk.largeurCm,
    cadre: [mk.cadre.x, mk.cadre.y, mk.cadre.x + mk.cadre.w, mk.cadre.y + mk.cadre.h],
  };
}

/** Couleur (hex) de chaque zone : couleur unique partout, ou choix par zone. */
export function couleursDesZones(
  modele: ModeleCatalogue,
  couleurId: string,
  couleursZones: Record<string, string> | null,
): Record<string, string> {
  const hex = (id: string) => modele.couleurs.find((c) => c.id === id)?.hex ?? "#FFFFFF";
  return Object.fromEntries(modele.zonesCouleur.map((z) => [z.cle, hex(couleursZones?.[z.cle] ?? couleurId)]));
}

/**
 * Couleur du tissu sous un marquage : en couleurs par zone, celle du corps de
 * la vue (corps avant / corps arrière) ; sinon la couleur unique.
 */
export function couleurSousMarquage(
  modele: ModeleCatalogue,
  vue: Vue,
  couleurId: string,
  couleursZones: Record<string, string> | null,
): { nom: string; hex: string | null } {
  const sansAccents = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const corps =
    modele.zonesCouleur.find((z) => {
      const t = sansAccents(`${z.cle} ${z.libelle}`);
      return /corps|buste/.test(t) && (vue === "face" ? /avant|devant/.test(t) : /arriere|dos/.test(t));
    }) ?? modele.zonesCouleur.find((z) => /corps|buste/.test(sansAccents(`${z.cle} ${z.libelle}`)));
  const id = (corps && couleursZones?.[corps.cle]) || couleurId;
  const c = modele.couleurs.find((x) => x.id === id);
  return { nom: c?.nom ?? "", hex: c?.hex ?? null };
}
