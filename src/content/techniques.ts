/** Techniques de marquage — textes repris de l'ancien site Seritex. */

export type Technique = {
  slug: string;
  name: string;
  code: string; // affiché comme une référence d'étiquette
  tagline: string;
  summary: string;
  intro: string[];
  steps: string[];
  forWho: string[];
  specs: { label: string; value: string }[];
  image: string;
  color: "indigo" | "orange" | "rouge" | "ink";
};

export const techniques: Technique[] = [
  {
    slug: "serigraphie",
    name: "Sérigraphie",
    code: "TQ-01",
    tagline: "Le marquage par pochoirs et couches successives de couleurs, à même le textile.",
    summary:
      "Idéale pour les grandes séries : l'encre pénètre la fibre, les couleurs sont éclatantes et tiennent au lavage.",
    intro: [
      "La sérigraphie consiste à appliquer successivement sur le vêtement les différentes couches de couleurs qui composent un visuel. Les encres passent à travers une maille tendue dans un écran, qui fonctionne comme un pochoir.",
      "Le rendu est détaillé et fidèle, avec des traits fins. Le textile reste léger et souple, le marquage est peu perceptible au toucher, et la tenue au lavage est excellente.",
    ],
    steps: [
      "Le visuel est séparé couleur par couleur pour former un calque par couleur.",
      "Chaque calque est fixé sur un écran grâce à une émulsion qui durcit à la lumière : l'écran devient un pochoir.",
      "Le vêtement est placé sur la machine et les couleurs sont appliquées une à une.",
      "Le vêtement passe au four : l'encre se fixe définitivement dans les fibres.",
    ],
    forWho: [
      "Commandes en grandes quantités : rendu optimal pour un coût faible.",
      "Logos, textes et visuels relativement simples, jusqu'à 5 couleurs.",
      "Pour une photo haute résolution, préférez l'impression numérique directe.",
    ],
    specs: [
      { label: "Séries", value: "Moyennes à très grandes" },
      { label: "Couleurs", value: "Jusqu'à 5" },
      { label: "Toucher", value: "Souple, intégré à la fibre" },
      { label: "Point fort", value: "Tenue au lavage, coût en série" },
    ],
    image: "/images/atelier/serigraphie.webp",
    color: "indigo",
  },
  {
    slug: "broderie",
    name: "Broderie",
    code: "TQ-02",
    tagline: "Le marquage haut de gamme, solide et plébiscité pour son aspect chic.",
    summary:
      "Un motif cousu en relief, fil par fil : le rendu le plus premium et le plus durable pour vos polos, casquettes et vestes.",
    intro: [
      "La broderie consiste à coudre un motif en relief sur le vêtement au moyen de fils colorés. C'est la technique de marquage qui offre le rendu le plus haut de gamme et le plus solide.",
      "Le fil capte la lumière et offre des reflets brillants : c'est l'ensemble vêtement + visuel qui est valorisé.",
    ],
    steps: [
      "Le visuel est converti en une grille de points de broderie pour la machine.",
      "Le vêtement est chargé dans la brodeuse.",
      "La machine brode le motif point par point ; un test est photographié et soumis à votre validation.",
    ],
    forWho: [
      "Logos simples ou textes : chaque fil correspond à une seule couleur.",
      "Pièces épaisses et premium : polos, sweats, vestes, tabliers, softshells, casquettes.",
      "Tenues corporate et uniformes qui doivent durer.",
    ],
    specs: [
      { label: "Séries", value: "Toutes quantités" },
      { label: "Couleurs", value: "Une par fil" },
      { label: "Toucher", value: "Relief" },
      { label: "Point fort", value: "Aspect haut de gamme, solidité" },
    ],
    image: "/images/realisations/coca-cola.webp",
    color: "rouge",
  },
  {
    slug: "flex-quadriflex",
    name: "Flex & QuadriFlex",
    code: "TQ-03",
    tagline: "Le marquage en vinyle découpé et pressé à haute température.",
    summary:
      "Contours nets, couleurs vives et opaques : parfait pour les noms et numéros de maillots, les staffs et les vêtements techniques.",
    intro: [
      "Une forme est découpée dans une bobine de vinyle puis appliquée sur le vêtement à haute température, au moyen d'une presse textile.",
      "Le Flex utilise un vinyle teinté dans la masse : un visuel monochrome, avec des finitions possibles pailletées, fluo ou phosphorescentes. Le QuadriFlex imprime d'abord le visuel sur un vinyle blanc : couleurs illimitées et rendu photographique.",
    ],
    steps: [
      "Le visuel est imprimé (QuadriFlex) puis découpé par un traceur.",
      "On « échenille » : l'excédent de vinyle est retiré à la main.",
      "Le marquage est posé sur le textile et pressé à chaud.",
    ],
    forWho: [
      "Équipements sportifs : nom, surnom et numéro sur maillots, shorts, survêtements.",
      "Vêtements techniques et EPI : sweats, softshells, bodywarmers, tenues de travail.",
      "Événements : t-shirts, polos et casquettes pour rendre votre staff visible.",
    ],
    specs: [
      { label: "Séries", value: "De l'unité aux grandes séries" },
      { label: "Couleurs", value: "1 (Flex) · illimitées (QuadriFlex)" },
      { label: "Toucher", value: "Léger relief" },
      { label: "Point fort", value: "Contours nets, tous supports" },
    ],
    image: "/images/photos/match-football.webp",
    color: "orange",
  },
  {
    slug: "impression-numerique",
    name: "Impression numérique directe",
    code: "TQ-04",
    tagline: "Les couleurs illimitées, à même le textile. Simple, efficace et ultra détaillée.",
    summary:
      "Comme une imprimante, mais sur le vêtement : photos, dégradés et détails fins, dès une seule pièce.",
    intro: [
      "L'impression directe (DTG) imprime le visuel à même le textile. Elle convient à tous les visuels, du format cœur au A3, avec un rendu mat, réaliste et une grande finesse de trait.",
      "Sur un vêtement clair, seules les couleurs sont déposées. Sur un vêtement coloré, une sous-couche blanche conserve l'éclat des couleurs.",
    ],
    steps: [
      "Le vêtement est préparé puis chargé dans la machine.",
      "La machine imprime le visuel directement dans le tissu.",
      "Le textile passe au four pour fixer l'encre.",
    ],
    forWho: [
      "Logos, photos et illustrations détaillés sur tous types de textiles.",
      "Créateurs de marque et particuliers à la recherche d'un rendu soigné.",
      "Petites et moyennes séries, dès une pièce.",
    ],
    specs: [
      { label: "Séries", value: "Dès 1 pièce" },
      { label: "Couleurs", value: "Illimitées" },
      { label: "Toucher", value: "Fin et mat" },
      { label: "Point fort", value: "Photos, jusqu'à 600 dpi" },
    ],
    image: "/images/photos/groupe-tshirts-blancs.webp",
    color: "ink",
  },
];

export function getTechnique(slug: string) {
  return techniques.find((t) => t.slug === slug);
}
