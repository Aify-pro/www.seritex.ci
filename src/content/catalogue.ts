/** Gammes de produits, réalisations et clients — repris de l'ancien site. */

export type Gamme = {
  slug: string;
  name: string;
  text: string;
  items: string[];
  image: string;
  w: number;
  h: number;
};

export const gammes: Gamme[] = [
  {
    slug: "t-shirts",
    name: "T-shirts",
    text: "Col rond ou col V, manches courtes ou longues, bicolore ou uni : vous trouverez forcément le tee-shirt qui correspond à vos attentes, en homme, femme et enfant.",
    items: ["Col rond", "Col V", "Col boutonné", "Raglan", "Body dame", "Manches longues"],
    image: "/images/produits/t-shirts.webp",
    w: 350,
    h: 348,
  },
  {
    slug: "polos",
    name: "Polos",
    text: "Le produit incontournable, aussi à l'aise sur un terrain de sport que dans un environnement professionnel. Il apporte une touche de classe à tous vos projets.",
    items: ["Homme / dame", "Jersey", "Col zippé", "Manches longues", "Insert pagne"],
    image: "/images/produits/polos.webp",
    w: 350,
    h: 369,
  },
  {
    slug: "corporate",
    name: "Corporate",
    text: "Chemises, robes et ensembles personnalisés : restez élégants en toute situation et portez les couleurs de votre entreprise avec professionnalisme.",
    items: ["Chemises ML / MC", "Col mao", "Robes polo", "Ensembles dame", "Insert pagne"],
    image: "/images/produits/corporate.webp",
    w: 350,
    h: 328,
  },
  {
    slug: "tenues-de-travail",
    name: "Tenues de travail",
    text: "Bâtiment, restauration, sécurité, beauté : des vêtements adaptés à votre secteur, du tablier à la parka, aux couleurs de votre entreprise.",
    items: ["Combinaisons", "Salopettes", "Ensembles chemise + pantalon", "Bandes rétroréfléchissantes"],
    image: "/images/produits/tenues-de-travail.webp",
    w: 600,
    h: 500,
  },
  {
    slug: "chasubles",
    name: "Chasubles haute visibilité",
    text: "Gilets fluorescents équipés de 2 à 4 bandes rétroréfléchissantes : un équipement de protection individuelle pour les chantiers et la sécurité routière.",
    items: ["Gilet HV", "2 à 4 bandes", "Marquage dos / cœur"],
    image: "/images/produits/chasubles.webp",
    w: 600,
    h: 320,
  },
  {
    slug: "sport",
    name: "Sport",
    text: "Jeux de maillots de football, handball, basketball, survêtements et ensembles : équipez vos clubs, écoles et événements sportifs.",
    items: ["Jeux de maillots", "Survêtements", "Joggings", "Ensembles dame"],
    image: "/images/produits/sport.webp",
    w: 600,
    h: 525,
  },
  {
    slug: "goodies",
    name: "Goodies & accessoires",
    text: "Casquettes, bobs, sacs, bandanas, fanions, toques… Idéals pour les opérations publicitaires : petit prix, grande visibilité.",
    items: ["Casquettes & bobs", "Sacs & cabas", "Bandanas", "Fanions", "Toques & tabliers"],
    image: "/images/produits/goodies.webp",
    w: 600,
    h: 365,
  },
];

/** Gros plans de marquages réalisés pour des clients (photos de l'ancien site). */
export const realisations = [
  { src: "/images/realisations/orange.webp", client: "Orange CI", produit: "T-shirt" },
  { src: "/images/realisations/shell.webp", client: "Shell", produit: "Tenue de travail" },
  { src: "/images/realisations/coca-cola.webp", client: "Coca-Cola", produit: "Polo" },
  { src: "/images/realisations/maltina.webp", client: "Maltina", produit: "T-shirt" },
  { src: "/images/realisations/moov.webp", client: "Moov", produit: "T-shirt" },
  { src: "/images/realisations/nsia.webp", client: "NSIA", produit: "Maillot" },
  { src: "/images/realisations/brassivoire.webp", client: "Brassivoire", produit: "T-shirt" },
  { src: "/images/realisations/coq-ivoire.webp", client: "Coq Ivoire", produit: "Tablier" },
  { src: "/images/realisations/blue-band.webp", client: "Blue Band", produit: "T-shirt" },
  { src: "/images/realisations/flag-solibra.webp", client: "Solibra — Flag", produit: "T-shirt" },
  { src: "/images/realisations/yoplait.webp", client: "Yoplait", produit: "T-shirt" },
  { src: "/images/realisations/xxl.webp", client: "XXL Energy", produit: "T-shirt" },
] as const;

/** Photos d'événements (ancienne page Facebook / réalisations). */
export const evenements = [
  { src: "/images/photos/equipe-jaune-bras-leves.webp", alt: "Une équipe en t-shirts jaunes personnalisés lève les bras" },
  { src: "/images/photos/equipe-tabliers-orange.webp", alt: "Une brigade en tabliers orange personnalisés" },
  { src: "/images/photos/ouvriers-haute-visibilite.webp", alt: "Des ouvriers en tenues de travail haute visibilité" },
  { src: "/images/photos/station-shell-equipe.webp", alt: "L'équipe d'une station-service en tenues rouges" },
  { src: "/images/photos/equipe-orange.webp", alt: "Une équipe en polos orange personnalisés" },
  { src: "/images/photos/foule-tshirts-verts.webp", alt: "Une foule en t-shirts verts lors d'un événement" },
  { src: "/images/photos/enfants-jaune.webp", alt: "Des enfants en t-shirts jaunes personnalisés" },
  { src: "/images/photos/tenues-grises-reflechissantes.webp", alt: "Des agents en tenues grises à bandes réfléchissantes" },
  { src: "/images/photos/staff-vert-fluo.webp", alt: "Un staff événementiel en t-shirts vert fluo" },
  { src: "/images/photos/equipe-rouge-boutique.webp", alt: "Une équipe en t-shirts rouges dans une boutique" },
  { src: "/images/photos/fanfare-bleue.webp", alt: "Une fanfare en t-shirts bleus personnalisés" },
  { src: "/images/photos/supporters-verts.webp", alt: "Des supporters joyeux en t-shirts verts" },
] as const;

export const clients = [
  { name: "Orange Côte d'Ivoire", logo: "/images/clients/orange.webp" },
  { name: "MTN CI", logo: "/images/clients/mtnci.webp" },
  { name: "Moov", logo: "/images/clients/moov.webp" },
  { name: "Nestlé", logo: "/images/clients/nestle.webp" },
  { name: "NSIA", logo: "/images/clients/nsia.webp" },
  { name: "CIE", logo: "/images/clients/cie.webp" },
  { name: "SODECI", logo: "/images/clients/sodeci.webp" },
  { name: "CANAL+", logo: "/images/clients/canal.webp" },
  { name: "FrieslandCampina", logo: "/images/clients/friedsland.webp" },
  { name: "SUNU Assurances", logo: "/images/clients/sunu.webp" },
  { name: "AERIA", logo: "/images/clients/aeria.webp" },
] as const;
