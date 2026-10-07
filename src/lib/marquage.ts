/**
 * Règles de marquage de l'outil « Personnaliser » : techniques, seuils des
 * contrôles, emplacements et tailles. Partagé client + serveur, sans
 * dépendance au navigateur.
 *
 * Les contrôles CONSEILLENT, ils ne bloquent jamais : c'est Seritex qui
 * confirme la faisabilité au moment du devis et du BAT. Les seuils ci-dessous
 * reprennent les textes de la page Techniques ; ils pourront être déplacés
 * dans Paramètres de la plateforme.
 */

export type TechniqueId = "serigraphie" | "broderie" | "flex-quadriflex" | "impression-numerique";

export type Technique = {
  id: TechniqueId;
  label: string;
  resume: string;
  /** Nombre de couleurs au-delà duquel la technique n'est pas adaptée (null = illimité). */
  maxCouleurs: number | null;
  /** Dégradés et photos : rendu possible ? */
  degrades: boolean;
  /** Épaisseur minimale d'un trait ou d'une lettre, en mm, à la taille imprimée. */
  traitMinMm: number;
  /** Résolution minimale d'un fichier image (pixels par pouce à la taille imprimée). */
  dpiMin: number;
};

export const TECHNIQUES: Technique[] = [
  {
    id: "serigraphie",
    label: "Sérigraphie",
    resume: "Logos, textes et visuels relativement simples, jusqu'à 5 couleurs ; tenue au lavage, idéale en série.",
    maxCouleurs: 5,
    degrades: false,
    traitMinMm: 0.5,
    dpiMin: 150,
  },
  {
    id: "broderie",
    label: "Broderie",
    resume: "Le rendu le plus haut de gamme, en relief : logos simples ou textes, une couleur par fil.",
    maxCouleurs: 12,
    degrades: false,
    traitMinMm: 1,
    dpiMin: 100,
  },
  {
    id: "flex-quadriflex",
    label: "Flex & QuadriFlex",
    resume: "Contours nets et couleurs vives : noms, numéros, staffs. Flex 1 couleur, QuadriFlex couleurs illimitées.",
    maxCouleurs: null,
    degrades: true,
    traitMinMm: 1,
    dpiMin: 150,
  },
  {
    id: "impression-numerique",
    label: "Impression numérique",
    resume: "Couleurs illimitées, photos et dégradés, dès une pièce.",
    maxCouleurs: null,
    degrades: true,
    traitMinMm: 0.3,
    dpiMin: 150,
  },
];

export const getTechnique = (id: TechniqueId) => TECHNIQUES.find((t) => t.id === id)!;

/* ------------------------------------------------------------------------ */
/* Emplacements                                                             */
/* ------------------------------------------------------------------------ */

export type Vue = "face" | "dos";

/**
 * Position d'un emplacement sur la silhouette (repère 400 × 440, torse de
 * x = 100 à 300 ≈ 52 cm de large), et largeur maximale de marquage.
 */
export type Placement = { vue: Vue; x: number; y: number; maxCm: number; defautCm: number };

/** Unités du repère de la silhouette par centimètre de vêtement. */
export const UNITES_PAR_CM = 200 / 52;

const PLACEMENTS: Record<string, Placement> = {
  coeur: { vue: "face", x: 248, y: 150, maxCm: 12, defautCm: 9 },
  poitrine: { vue: "face", x: 200, y: 175, maxCm: 30, defautCm: 21 },
  "manche-d": { vue: "face", x: 70, y: 118, maxCm: 9, defautCm: 7 },
  "manche-g": { vue: "face", x: 330, y: 118, maxCm: 9, defautCm: 7 },
  nuque: { vue: "dos", x: 200, y: 92, maxCm: 10, defautCm: 7 },
  dos: { vue: "dos", x: 200, y: 200, maxCm: 32, defautCm: 29.7 },
};

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Les emplacements viennent de la plateforme (clé et libellé libres, ex.
 * « mand » / « Manche D »). On les reconnaît par mots-clés ; un emplacement
 * inconnu est placé au centre de la face.
 */
export function placementPour(cle: string, libelle: string): Placement {
  const t = `${sansAccents(cle)} ${sansAccents(libelle)}`;
  if (/nuque/.test(t)) return PLACEMENTS.nuque;
  if (/\bdos\b/.test(t)) return PLACEMENTS.dos;
  if (/manche|\bman[dg]\b/.test(t)) {
    return /gauche|\bmang\b|manche g\b/.test(t) ? PLACEMENTS["manche-g"] : PLACEMENTS["manche-d"];
  }
  if (/coeur/.test(t)) return PLACEMENTS.coeur;
  return PLACEMENTS.poitrine;
}

/** Tailles de marquage proposées (largeur en cm). */
export const FORMATS = [
  { id: "coeur", label: "Cœur", cm: 9 },
  { id: "a5", label: "A5", cm: 14.8 },
  { id: "a4", label: "A4", cm: 21 },
  { id: "a3", label: "A3", cm: 29.7 },
] as const;

/* ------------------------------------------------------------------------ */
/* Contrôles                                                                */
/* ------------------------------------------------------------------------ */

/** Résultat de l'analyse d'un fichier logo (voir analyse-logo.ts). */
export type AnalyseLogo = {
  vectoriel: boolean;
  /** Fichier non analysable (PDF, AI, EPS) : seul l'envoi au conseiller est possible. */
  analysable: boolean;
  /** Largeur utile du dessin dans le fichier d'origine, en pixels (fichiers image). */
  largeurUtilePx: number;
  /** Hauteur / largeur du dessin (marges transparentes retirées). */
  ratio: number;
  couleurs: string[];
  degrade: boolean;
  transparent: boolean;
  /** Couleur de fond détectée quand le fichier n'est pas transparent. */
  fond: string | null;
  /** Trait le plus fin (5e centile), en fraction de la largeur du dessin. */
  traitFinRatio: number;
};

export type Statut = "ok" | "attention" | "inadapte";
export type Controle = { id: string; statut: Statut; titre: string; detail: string };

const clair = (hex: string) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
};

export function controler(
  a: AnalyseLogo,
  technique: TechniqueId,
  largeurCm: number,
  couleurTextileHex: string | null,
): Controle[] {
  const t = getTechnique(technique);
  const out: Controle[] = [];

  if (!a.analysable) {
    return [
      {
        id: "format",
        statut: "attention",
        titre: "Fichier transmis tel quel",
        detail: "Ce format ne peut pas être analysé en ligne : votre conseiller Seritex le vérifiera.",
      },
    ];
  }

  const n = a.couleurs.length;
  const textileFonce = couleurTextileHex ? !clair(couleurTextileHex) : false;
  if ((t.id === "serigraphie" || t.id === "broderie") && a.degrade) {
    out.push({
      id: "couleurs",
      statut: "attention",
      titre: t.id === "serigraphie" ? "Nombre d'écrans à définir" : "Nombre de fils à définir",
      detail: "Le dessin contient des dégradés : Seritex détermine les couleurs à retenir.",
    });
  } else if (t.id === "serigraphie" || t.id === "broderie") {
    const unite = t.id === "serigraphie" ? "écran" : "fil";
    const sousCouche = t.id === "serigraphie" && textileFonce ? " Sur textile foncé, une sous-couche blanche est souvent ajoutée (+1 écran), à confirmer par Seritex." : "";
    out.push({
      id: "couleurs",
      statut: t.maxCouleurs !== null && n > t.maxCouleurs ? "inadapte" : "ok",
      titre: `${n} couleur${n > 1 ? "s" : ""} : ${n} ${unite}${n > 1 ? "s" : ""}`,
      detail:
        t.maxCouleurs !== null && n > t.maxCouleurs
          ? `Au-delà de ${t.maxCouleurs} couleurs, la ${t.label.toLowerCase()} n'est pas adaptée.`
          : `Chaque couleur demande un ${unite}.${sousCouche}`,
    });
  } else if (t.id === "flex-quadriflex") {
    out.push({
      id: "couleurs",
      statut: "ok",
      titre: n <= 1 ? "1 couleur : Flex" : `${n} couleurs : QuadriFlex`,
      detail: n <= 1 ? "Vinyle teinté dans la masse, finitions possibles (pailleté, fluo)." : "Impression sur vinyle blanc puis découpe : couleurs illimitées.",
    });
  } else {
    out.push({
      id: "couleurs",
      statut: "ok",
      titre: `${n} couleur${n > 1 ? "s" : ""} : sans limite`,
      detail: textileFonce ? "Sur textile foncé, une sous-couche blanche conserve l'éclat des couleurs." : "Seules les couleurs sont déposées sur un textile clair.",
    });
  }

  out.push(
    a.degrade
      ? {
          id: "degrade",
          statut: t.degrades ? "ok" : "attention",
          titre: "Dégradés ou photo détectés",
          detail: t.degrades ? "Rendu fidèle avec cette technique." : `La ${t.label.toLowerCase()} les rend par une trame de points ou les simplifie.`,
        }
      : { id: "degrade", statut: "ok", titre: "Aplats, pas de dégradé", detail: "Aucune trame nécessaire." },
  );

  if (a.vectoriel) {
    out.push({ id: "resolution", statut: "ok", titre: "Fichier vectoriel", detail: "Net à toutes les tailles." });
  } else {
    const dpi = Math.round(a.largeurUtilePx / (largeurCm / 2.54));
    out.push({
      id: "resolution",
      statut: dpi >= t.dpiMin ? "ok" : "attention",
      titre: `Résolution : ${dpi} ppp à ${formatCm(largeurCm)}`,
      detail:
        dpi >= t.dpiMin
          ? "Suffisante pour un rendu net."
          : `En dessous de ${t.dpiMin} ppp, le marquage risque d'être flou : Seritex vous demandera le fichier source (vectoriel de préférence).`,
    });
  }

  const traitMm = a.traitFinRatio * largeurCm * 10;
  out.push({
    id: "traits",
    statut: traitMm >= t.traitMinMm ? "ok" : "attention",
    titre: traitMm >= t.traitMinMm ? `Traits assez épais à ${formatCm(largeurCm)}` : `Traits fins à ${formatCm(largeurCm)}`,
    detail:
      traitMm >= t.traitMinMm
        ? `Aucun trait sous ${t.traitMinMm.toLocaleString("fr-FR")} mm à cette taille.`
        : `Certains traits mesurent environ ${traitMm.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} mm (minimum conseillé : ${t.traitMinMm.toLocaleString("fr-FR")} mm). Agrandissez le marquage ou simplifiez le dessin.`,
  });

  out.push(
    a.transparent
      ? { id: "fond", statut: "ok", titre: "Fond transparent", detail: "Seul le dessin est imprimé." }
      : {
          id: "fond",
          statut: "attention",
          titre: "Fond non transparent",
          detail: `Le fond${a.fond ? ` (${a.fond})` : ""} a été retiré de l'aperçu ; confirmez avec votre conseiller qu'il ne doit pas être imprimé.`,
        },
  );

  return out;
}

/** Technique conseillée pour ce logo et cette quantité (indicatif). */
export function techniqueConseillee(a: AnalyseLogo, quantite: number): { id: TechniqueId; raison: string } {
  if (a.analysable && (a.degrade || a.couleurs.length > 5)) {
    return { id: "impression-numerique", raison: "Dégradés ou nombreuses couleurs : l'impression numérique les rend fidèlement." };
  }
  if (quantite > 0 && quantite < 30) {
    return { id: "impression-numerique", raison: "Petite série : l'impression numérique évite les frais d'écrans." };
  }
  return { id: "serigraphie", raison: "Logo en aplats et série : la sérigraphie offre le meilleur rendu et la meilleure tenue." };
}

export const formatCm = (cm: number) => `${cm.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} cm`;
