import type { ModeleCatalogue } from "@/lib/catalogue-plateforme";

/**
 * Catalogue d'exemple pour développer l'outil « Personnaliser » sans données
 * publiées sur la plateforme. Utilisé UNIQUEMENT si CATALOGUE_EXEMPLE=1
 * (jamais en production). Couleurs reprises du référentiel Seritex.
 */

/** Mockup d'exemple (avant) : autres proportions que la silhouette standard, zones nommées comme sur la plateforme. */
const MOCKUP_AVANT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 640"><defs><style>.cls-1{fill:#ffffff;stroke:#15163a;stroke-width:3}.cls-2{fill:#000;opacity:.07}</style></defs><g id="manche_gauche"><polygon class="cls-1" points="170,95 20,265 105,315 175,215"/></g><g id="manche_droite"><polygon class="cls-1" points="430,95 580,265 495,315 425,215"/></g><g id="corps_avant"><path class="cls-1" d="M170 95 L250 72 Q300 115 350 72 L430 95 L430 600 L170 600 Z"/></g><g id="col"><path class="cls-1" d="M250 72 Q300 128 350 72 L338 68 Q300 108 262 68 Z"/></g><path class="cls-2" d="M170 95 L215 95 L215 600 L170 600 Z"/></svg>`;

const tailles = ["XS", "S", "M", "L", "XL", "XXL"].map((t) => ({ id: `t-${t}`, cle: t, libelle: t }));
const couleur = (nom: string, hex: string, statut: "disponible" | "non_suivi" | "indisponible" = "disponible") => ({
  id: `c-${nom}`,
  nom,
  hex,
  statut,
});

export const catalogueExemple: ModeleCatalogue[] = [
  {
    id: "exemple-tshirt",
    code: "TSCR",
    nom: "T-shirt col rond",
    famille: "Textile",
    sousFamille: "Jersey",
    texteCommercial: "Le classique Seritex, confectionné dans nos ateliers d'Abidjan.",
    statut: "partiel",
    couleurs: [
      couleur("Blanc", "#FFFFFF"),
      couleur("Noir", "#1E1E1E"),
      couleur("Bleu marine", "#22396A"),
      couleur("Bleu roi", "#1372C4"),
      couleur("Rouge vif", "#E20B2A"),
      couleur("Jaune d'or", "#F8C800", "non_suivi"),
      couleur("Vert émeraude", "#008C55"),
      couleur("Orange", "#F28722", "indisponible"),
    ],
    grammages: [
      { id: "g-150", nom: "Jersey 150", grammage: 150, composition: "100 % coton" },
      { id: "g-180", nom: "Jersey 180", grammage: 180, composition: "100 % coton" },
    ],
    disponibilites: [{ grammageId: "g-180", couleurId: "c-Rouge vif", statut: "indisponible" }],
    tailles,
    emplacements: [
      { id: "z-poitrine", cle: "poitrine", libelle: "Poitrine" },
      { id: "z-coeur", cle: "coeur", libelle: "Cœur" },
      { id: "z-dos", cle: "dos", libelle: "Dos" },
      { id: "z-mand", cle: "mand", libelle: "Manche D" },
      { id: "z-mang", cle: "mang", libelle: "Manche G" },
      { id: "z-nuque", cle: "nuque", libelle: "Nuque" },
    ],
    medias: [],
    zonesCouleur: [
      { cle: "corps_avant", libelle: "Corps avant" },
      { cle: "corps_arriere", libelle: "Corps arrière" },
      { cle: "col", libelle: "Col" },
      { cle: "manche_gauche", libelle: "Manche gauche" },
      { cle: "manche_droite", libelle: "Manche droite" },
    ],
    mockups: [
      {
        vue: "avant",
        svg: MOCKUP_AVANT,
        zones: { corps_avant: "corps_avant", col: "col", manche_gauche: "manche_gauche", manche_droite: "manche_droite" },
        largeurCm: 56,
        cadre: { x: 20, y: 68, w: 560, h: 532 },
        reperes: { "z-poitrine": { x: 300, y: 250 }, "z-coeur": { x: 362, y: 185 } },
      },
    ],
  },
  {
    id: "exemple-polo",
    code: "POLO",
    nom: "Polo piqué",
    famille: "Textile",
    sousFamille: "Piqué",
    texteCommercial: "Le polo pour vos équipes, en piqué de coton.",
    statut: "disponible",
    couleurs: [couleur("Blanc", "#FFFFFF"), couleur("Bleu nuit", "#193A7A"), couleur("Gris anthracite", "#565A5C")],
    grammages: [{ id: "g-210", nom: "Piqué 210", grammage: 210, composition: "100 % coton" }],
    disponibilites: [],
    tailles,
    emplacements: [
      { id: "zp-coeur", cle: "coeur", libelle: "Cœur" },
      { id: "zp-dos", cle: "dos", libelle: "Dos" },
    ],
    medias: [],
    zonesCouleur: [],
    mockups: [],
  },
];
