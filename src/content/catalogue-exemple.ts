import type { ModeleCatalogue } from "@/lib/catalogue-plateforme";

/**
 * Catalogue d'exemple pour développer l'outil « Personnaliser » sans données
 * publiées sur la plateforme. Utilisé UNIQUEMENT si CATALOGUE_EXEMPLE=1
 * (jamais en production). Couleurs reprises du référentiel Seritex.
 */
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
  },
];
