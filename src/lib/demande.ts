/** Schéma partagé (client + serveur) d'une demande de devis envoyée depuis le site. */

export const produits = [
  { value: "t-shirts", label: "T-shirts" },
  { value: "polos", label: "Polos" },
  { value: "corporate", label: "Chemises / corporate" },
  { value: "tenues-de-travail", label: "Tenues de travail" },
  { value: "chasubles", label: "Chasubles haute visibilité" },
  { value: "sport", label: "Sport" },
  { value: "goodies", label: "Goodies & accessoires" },
  { value: "autre", label: "Autre / je ne sais pas" },
] as const;

export const techniquesChoix = [
  { value: "conseil", label: "Je souhaite être conseillé" },
  { value: "serigraphie", label: "Sérigraphie" },
  { value: "broderie", label: "Broderie" },
  { value: "flex-quadriflex", label: "Flex / QuadriFlex" },
  { value: "impression-numerique", label: "Impression numérique" },
] as const;

export type DemandeInput = {
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  produit: string;
  technique: string;
  quantite: number;
  delai: string;
  message: string;
};

export type DemandeErrors = Partial<Record<keyof DemandeInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDemande(raw: Record<string, unknown>): { data?: DemandeInput; errors: DemandeErrors } {
  const s = (k: string, max = 200) => String(raw[k] ?? "").trim().slice(0, max);
  const data: DemandeInput = {
    nom: s("nom", 120),
    entreprise: s("entreprise", 160),
    email: s("email", 160).toLowerCase(),
    telephone: s("telephone", 40),
    produit: s("produit", 40),
    technique: s("technique", 40) || "conseil",
    quantite: Number.parseInt(s("quantite", 9), 10),
    delai: s("delai", 10),
    message: s("message", 3000),
  };

  const errors: DemandeErrors = {};
  if (data.nom.length < 2) errors.nom = "Indiquez votre nom.";
  if (!EMAIL.test(data.email)) errors.email = "Adresse e-mail invalide.";
  if (data.telephone.replace(/\D/g, "").length < 8) errors.telephone = "Indiquez un numéro joignable (8 chiffres minimum).";
  if (!produits.some((p) => p.value === data.produit)) errors.produit = "Choisissez un type de produit.";
  if (!techniquesChoix.some((t) => t.value === data.technique)) errors.technique = "Technique inconnue.";
  if (!Number.isFinite(data.quantite) || data.quantite < 1) errors.quantite = "Indiquez une quantité (1 minimum).";
  if (data.delai && !/^\d{4}-\d{2}-\d{2}$/.test(data.delai)) errors.delai = "Date invalide.";

  return Object.keys(errors).length ? { errors } : { data, errors };
}

/**
 * Recommandation indicative de technique, d'après les textes de l'ancien site :
 * sérigraphie pour les grandes séries, impression numérique pour les petites,
 * broderie pour le rendu premium, flex pour les numéros/noms.
 */
export function suggestTechnique(produit: string, quantite: number): { technique: string; raison: string } | null {
  if (!quantite || quantite < 1) return null;
  if (produit === "sport")
    return { technique: "Flex / QuadriFlex", raison: "Idéal pour les noms et numéros de maillots." };
  if (produit === "corporate" || produit === "polos")
    return { technique: "Broderie", raison: "Le rendu le plus premium pour les tenues corporate." };
  if (quantite < 50)
    return { technique: "Impression numérique", raison: "Couleurs illimitées, dès une pièce : parfait pour les petites séries." };
  return { technique: "Sérigraphie", raison: "Le meilleur rapport qualité/prix pour les grandes séries (jusqu'à 5 couleurs)." };
}
