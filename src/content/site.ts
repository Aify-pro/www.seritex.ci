/**
 * Coordonnées et liens globaux.
 * ⚠️ Les valeurs marquées « À VÉRIFIER » viennent de l'ancien site (SPIP)
 * et datent d'avant la renumérotation ivoirienne de 2021 (10 chiffres).
 */
export const site = {
  name: "Seritex",
  slogan: "Créateur de visibilité pour votre marque",
  description:
    "Seritex confectionne vos vêtements et accessoires personnalisés à Abidjan : tricotage, teinture, confection et marquage (sérigraphie, broderie, flex, impression numérique), du fil au colis.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.seritex.ci",

  /** Application Seritex (portail client, suivi de commande). */
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://app.seritex.ci",

  contact: {
    email: "info@seritex.ci",
    // À VÉRIFIER : ancien numéro (225) 21 56 35 35, préfixe 27 ajouté depuis 2021
    phone: "+225 27 21 56 35 35",
    phoneHref: "tel:+2252721563535",
    // À VÉRIFIER : ancien WhatsApp +225 89 34 13 98 (mobile → préfixe 07 ?)
    whatsapp: "+225 07 89 34 13 98",
    whatsappHref: "https://wa.me/2250789341398",
    address: "Zone industrielle de Koumassi, 18 BP 43, Abidjan — Côte d'Ivoire",
    hours: "Du lundi au samedi, 9h – 18h",
  },

  social: {
    facebook: "https://www.facebook.com/", // À COMPLÉTER : page Facebook Seritex
  },
} as const;

export const nav = [
  { href: "/", label: "Accueil" },
  { href: "/savoir-faire", label: "Savoir-faire" },
  { href: "/techniques", label: "Techniques" },
  { href: "/produits", label: "Produits" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/commander", label: "Commander" },
] as const;
