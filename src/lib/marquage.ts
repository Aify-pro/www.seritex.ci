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

/** Nom de la technique avec son article : « la sérigraphie », « l'impression numérique »… */
export const techniqueAvecArticle = (id: TechniqueId) =>
  ({ serigraphie: "la sérigraphie", "impression-numerique": "l'impression numérique", broderie: "la broderie", "flex-quadriflex": "le Flex / QuadriFlex" })[id];

/* ------------------------------------------------------------------------ */
/* Emplacements                                                             */
/* ------------------------------------------------------------------------ */

export type Vue = "face" | "dos";

export type Forme = "tshirt" | "polo";

/** Silhouette de l'aperçu d'après le nom du modèle (polo reconnu, t-shirt sinon). */
export const formePour = (nom: string, famille: string | null): Forme =>
  /polo|piqu/i.test(`${nom} ${famille ?? ""}`) ? "polo" : "tshirt";

/**
 * Position type d'un emplacement sur la silhouette (repère 400 × 440, torse
 * de x = 100 à 300 ≈ 52 cm de large), format habituel (`maxCm`, au-delà le
 * conseiller vérifie la faisabilité) et taille proposée par défaut.
 */
export type Placement = {
  vue: Vue;
  x: number;
  y: number;
  maxCm: number;
  defautCm: number;
  /** Mockup de la plateforme : unités du SVG par cm (sinon UNITES_PAR_CM de la silhouette standard). */
  echelle?: number;
  /** Mockup : cadre du vêtement [x0, y0, x1, y1] dans le SVG (sinon la silhouette standard). */
  cadre?: [number, number, number, number];
};

/** Unités du dessin par centimètre de vêtement, pour ce placement. */
export const echelleDe = (p: Placement) => p.echelle ?? UNITES_PAR_CM;

/** Taille de marquage : libre entre ces bornes ; ce qui dépasse du vêtement n'est pas imprimé. */
export const TAILLE_MIN_CM = 2;
export const TAILLE_MAX_CM = 100;

/** Contour du vêtement (corps + manches) dans le repère de l'aperçu, col compris en ligne droite. */
export const SILHOUETTE: [number, number][] = [
  [140, 40], [70, 62], [5, 150], [60, 185], [100, 150], [100, 420], [300, 420], [300, 150], [340, 185], [395, 150], [330, 62], [260, 40],
];

const dansSilhouette = ([x, y]: [number, number]) => {
  let dedans = false;
  for (let i = 0, j = SILHOUETTE.length - 1; i < SILHOUETTE.length; j = i++) {
    const [xi, yi] = SILHOUETTE[i];
    const [xj, yj] = SILHOUETTE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
};

/** Le visuel (incliné compris) sort-il du vêtement ? Contrôle sur les bords du visuel. */
export function debordeDuVetement(p: Placement, largeurCm: number, ratio: number, dxCm: number, dyCm: number, rotation: number): boolean {
  const u = echelleDe(p);
  const w = largeurCm * u;
  const h = w * ratio;
  const cx = p.x + dxCm * u;
  const cy = p.y + dyCm * u;
  const a = (rotation * Math.PI) / 180;
  const points: [number, number][] = [];
  for (const fx of [-0.5, -0.25, 0, 0.25, 0.5])
    for (const fy of [-0.5, -0.25, 0, 0.25, 0.5]) {
      if (Math.abs(fx) !== 0.5 && Math.abs(fy) !== 0.5) continue; // bords seulement
      const lx = fx * w;
      const ly = fy * h;
      points.push([cx + lx * Math.cos(a) - ly * Math.sin(a), cy + lx * Math.sin(a) + ly * Math.cos(a)]);
    }
  // Mockup : contrôle sur le cadre du vêtement (approché) ; silhouette standard : contour exact.
  if (p.cadre) {
    const [x0, y0, x1, y1] = p.cadre;
    return points.some(([x, y]) => x < x0 || x > x1 || y < y0 || y > y1);
  }
  return points.some((pt) => !dansSilhouette(pt));
}

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

/**
 * Décalage (en cm) ramené dans le cadre du vêtement : le visuel se place
 * n'importe où sur la face (cœur, ventre, épaule…) ; ce qui dépasse du
 * vêtement est masqué à l'aperçu et signalé.
 */
export function bornerDecalage(p: Placement, dxCm: number, dyCm: number): { dxCm: number; dyCm: number } {
  const [x0, y0, x1, y1] = p.cadre ?? [5, 40, 395, 420];
  const u = echelleDe(p);
  const x = Math.min(x1, Math.max(x0, p.x + dxCm * u));
  const y = Math.min(y1, Math.max(y0, p.y + dyCm * u));
  const arrondi = (v: number) => Math.round(v * 2) / 2;
  return { dxCm: arrondi((x - p.x) / u), dyCm: arrondi((y - p.y) / u) };
}

/** Inclinaison ramenée entre -180° et 180°. */
export const normaliserAngle = (a: number) => {
  const r = ((((Math.round(a) + 180) % 360) + 360) % 360) - 180;
  return r === -180 ? 180 : r;
};

/** « 2 cm vers la droite, 1,5 cm plus haut, incliné de 15° » — vide si rien n'a bougé. */
export function decrirePosition(dxCm: number, dyCm: number, rotation: number): string {
  const n = (v: number) => Math.abs(v).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  const parties = [
    dxCm ? `${n(dxCm)} cm vers la ${dxCm > 0 ? "droite" : "gauche"}` : null,
    dyCm ? `${n(dyCm)} cm plus ${dyCm > 0 ? "bas" : "haut"}` : null,
    rotation ? `incliné de ${rotation}°` : null,
  ].filter(Boolean);
  return parties.join(", ");
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

/* ------------------------------------------------------------------------ */
/* Rapport de marquage (étape « Ma maquette » et maquette PDF)               */
/* ------------------------------------------------------------------------ */

export type ContexteRapport = {
  technique: TechniqueId;
  largeurCm: number;
  quantite: number;
  couleurTextile: { nom: string; hex: string | null };
  /** Article « premium » (polo, piqué…) : la broderie y est naturelle. */
  premium: boolean;
  /** Format habituel de l'emplacement (cm) : au-delà, faisabilité à confirmer. */
  formatHabituelCm: number;
  /** Une partie du visuel sort du vêtement (elle n'est pas imprimée). */
  deborde: boolean;
};

export type Rapport = {
  /** Ce que nous voyons dans le fichier. */
  constat: string;
  couleurs: string[];
  /** Dégradé : `couleurs` sont alors les teintes principales, pas des aplats. */
  degrade: boolean;
  conseil: { id: TechniqueId; label: string; pourquoi: string };
  /** Pourquoi pas les autres techniques, une phrase chacune. */
  alternatives: { id: TechniqueId; label: string; avis: string }[];
  /** Si le client a choisi une autre technique que celle conseillée. */
  remarqueChoix: string | null;
  /** Points à vérifier, rédigés. */
  aVerifier: string[];
};

const ORDRE: TechniqueId[] = ["serigraphie", "impression-numerique", "broderie", "flex-quadriflex"];
const n1 = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

/**
 * Rapport rédigé pour le client : couleurs détectées, technique que nous
 * privilégions et pourquoi, pourquoi pas les autres, points à vérifier.
 * Purement indicatif : le conseiller confirme au devis, puis au BAT.
 */
export function rapportMarquage(a: AnalyseLogo, c: ContexteRapport): Rapport {
  const textileFonce = c.couleurTextile.hex ? !clair(c.couleurTextile.hex) : false;
  const textile = c.couleurTextile.nom.toLowerCase();

  if (!a.analysable) {
    const t = getTechnique(c.technique);
    return {
      constat:
        "Votre fichier est dans un format que nous ne pouvons pas analyser en ligne (PDF, AI ou EPS). C'est souvent un fichier source de bonne qualité : votre conseiller l'ouvrira pour compter les couleurs et vérifier les traits.",
      couleurs: [],
      degrade: false,
      conseil: { id: t.id, label: t.label, pourquoi: `Nous partons sur la technique que vous avez choisie, ${techniqueAvecArticle(t.id)} ; votre conseiller vous confirmera qu'elle convient après examen du fichier.` },
      alternatives: [],
      remarqueChoix: null,
      aVerifier: [],
    };
  }

  const n = a.couleurs.length;
  const traitMm = a.traitFinRatio * c.largeurCm * 10;
  const q = c.quantite;

  // Constat
  const constat = [
    a.degrade
      ? "Votre logo contient des dégradés ou des nuances (effet photo) : les couleurs passent de l'une à l'autre en douceur, sans zones franches à séparer."
      : `Votre logo est composé de ${n} couleur${n > 1 ? "s" : ""} en aplat${n > 1 ? "s" : ""} (des zones de couleur franche, sans dégradé).`,
    a.vectoriel
      ? "C'est un fichier vectoriel : il restera net quelle que soit la taille."
      : `C'est une image de ${a.largeurUtilePx} pixels de large pour ${formatCm(c.largeurCm)} imprimés.`,
    `Il sera marqué sur un textile ${textile}${textileFonce ? ", donc foncé" : ""}.`,
  ].join(" ");

  // Notation de chaque technique, avec les raisons qui la portent ou la desservent.
  type Eval = { id: TechniqueId; score: number; pour: string[]; contre: string[] };
  const ev: Record<TechniqueId, Eval> = {
    serigraphie: { id: "serigraphie", score: 0, pour: [], contre: [] },
    "impression-numerique": { id: "impression-numerique", score: 0, pour: [], contre: [] },
    broderie: { id: "broderie", score: 0, pour: [], contre: [] },
    "flex-quadriflex": { id: "flex-quadriflex", score: 0, pour: [], contre: [] },
  };
  const pour = (id: TechniqueId, pts: number, txt: string) => ((ev[id].score += pts), ev[id].pour.push(txt));
  const contre = (id: TechniqueId, pts: number, txt: string) => ((ev[id].score -= pts), ev[id].contre.push(txt));

  // Sérigraphie
  if (!a.degrade && n <= 5) pour("serigraphie", 3, `vos ${n} couleur${n > 1 ? "s" : ""} en aplat${n > 1 ? "s" : ""} demandent ${n} écran${n > 1 ? "s" : ""} seulement`);
  if (q >= 50) pour("serigraphie", 3, `sur ${q} pièces, la préparation des écrans est vite amortie et chaque pièce revient moins cher`);
  else if (q >= 30) pour("serigraphie", 1, `à partir d'une trentaine de pièces, les écrans commencent à être amortis`);
  else contre("serigraphie", 2, `sur ${q} pièce${q > 1 ? "s" : ""}, la préparation des écrans pèse lourd`);
  if (a.degrade) contre("serigraphie", 3, "les dégradés doivent être tramés en petits points, le rendu est moins fidèle");
  if (n > 5) contre("serigraphie", 4, `au-delà de 5 couleurs (ici ${n}), il faudrait trop d'écrans`);
  if (textileFonce && !a.degrade) ev.serigraphie.pour.push("l'encre couvre très bien un textile foncé, avec une sous-couche blanche si besoin");

  // Impression numérique
  if (a.degrade) pour("impression-numerique", 3, "elle reproduit fidèlement les dégradés et les nuances");
  if (n > 5) pour("impression-numerique", 3, "le nombre de couleurs n'a aucune incidence");
  if (q > 0 && q < 30) pour("impression-numerique", 3, `pour ${q} pièce${q > 1 ? "s" : ""}, il n'y a aucun écran à préparer`);
  if (traitMm < 0.5) pour("impression-numerique", 1, "elle restitue les traits très fins");
  if (q >= 100 && !a.degrade && n <= 5) contre("impression-numerique", 1, `sur ${q} pièces en aplats, elle est moins avantageuse que la sérigraphie`);
  if (textileFonce) ev["impression-numerique"].contre.push("sur textile foncé, une sous-couche blanche est déposée, le toucher est un peu plus marqué");

  // Broderie
  if (c.premium) pour("broderie", 3, "c'est la finition naturelle d'un polo ou d'une pièce haut de gamme, en relief et très durable");
  if (!a.degrade && n <= 6) pour("broderie", 1, "le logo est simple, chaque couleur correspond à un fil");
  if (a.degrade) contre("broderie", 4, "un dégradé ne se brode pas, il serait simplifié en quelques couleurs");
  if (traitMm < 1) contre("broderie", 3, `certains traits ne mesurent que ${n1(traitMm)} mm à cette taille, trop fins pour un fil (1 mm minimum)`);
  if (c.largeurCm > 25) contre("broderie", 2, `à ${formatCm(c.largeurCm)} de large, une broderie devient lourde et rigide sur le tissu`);

  // Flex / QuadriFlex
  if (n <= 1 && !a.degrade) pour("flex-quadriflex", 3, "un logo d'une seule couleur se découpe parfaitement dans un vinyle de couleur (Flex)");
  if (q > 0 && q <= 20) pour("flex-quadriflex", 1, "il convient bien aux petites quantités et aux noms ou numéros personnalisés");
  if (n > 1 || a.degrade) ev["flex-quadriflex"].contre.push("avec plusieurs couleurs, il faut passer au QuadriFlex, imprimé puis découpé, au toucher plus épais");
  if (c.largeurCm > 25) contre("flex-quadriflex", 1, "sur une grande surface, le vinyle forme une zone moins souple");

  const classement = ORDRE.map((id) => ev[id]).sort((x, y) => y.score - x.score || ORDRE.indexOf(x.id) - ORDRE.indexOf(y.id));
  const best = classement[0];
  const label = getTechnique(best.id).label;
  const pourquoi = `Nous privilégions ${techniqueAvecArticle(best.id)} : ${(best.pour.length ? best.pour : ["c'est la technique la plus polyvalente pour ce visuel"]).join(" ; ")}.`;

  const alternatives = classement.slice(1).map((e) => {
    const t = getTechnique(e.id);
    const avis = e.contre.length
      ? `${e.contre[0].charAt(0).toUpperCase()}${e.contre[0].slice(1)}.`
      : e.pour.length
        ? `Possible aussi : ${e.pour[0]}.`
        : "Possible, mais sans avantage particulier pour ce logo.";
    return { id: e.id, label: t.label, avis };
  });

  const remarqueChoix =
    c.technique !== best.id
      ? `Vous avez choisi ${techniqueAvecArticle(c.technique)}. C'est possible ; nous vous recommandons toutefois ${techniqueAvecArticle(best.id)} pour les raisons ci-dessus. Votre conseiller en discutera avec vous.`
      : null;

  const aVerifier: string[] = [];
  const t = getTechnique(c.technique);
  if (!a.vectoriel) {
    const dpi = Math.round(a.largeurUtilePx / (c.largeurCm / 2.54));
    if (dpi < t.dpiMin)
      aVerifier.push(
        `La résolution de votre image est un peu faible pour ${formatCm(c.largeurCm)} (${dpi} points par pouce, ${t.dpiMin} conseillés) : le marquage risquerait d'être flou. Envoyez-nous si possible le fichier d'origine de votre logo (PDF, AI, SVG ou une image plus grande).`,
      );
  }
  if (traitMm < t.traitMinMm)
    aVerifier.push(
      `Certains traits de votre logo ne mesurent qu'environ ${n1(traitMm)} mm à cette taille, en dessous des ${n1(t.traitMinMm)} mm conseillés pour ${techniqueAvecArticle(t.id)}. Agrandir un peu le marquage ou épaissir ces traits garantira un rendu net.`,
    );
  if (c.largeurCm > c.formatHabituelCm)
    aVerifier.push(
      `Votre visuel mesure ${formatCm(c.largeurCm)} de large, au-delà du format habituel de cet emplacement (${formatCm(c.formatHabituelCm)}). C'est souvent possible, mais votre conseiller confirmera la faisabilité (taille du cadre d'impression ou de broderie).`,
    );
  if (c.deborde)
    aVerifier.push(
      "Une partie de votre visuel dépasse du vêtement : elle est masquée sur l'aperçu et ne sera pas imprimée. Réduisez ou recentrez le visuel si elle doit apparaître.",
    );
  if (!a.transparent)
    aVerifier.push(
      `Votre fichier a un fond${a.fond ? ` (${a.fond})` : ""} : nous l'avons retiré de l'aperçu, car seul le dessin est normalement imprimé. Dites-le à votre conseiller si ce fond doit apparaître.`,
    );

  return {
    constat,
    couleurs: a.degrade ? a.couleurs.slice(0, 5) : a.couleurs,
    degrade: a.degrade,
    conseil: { id: best.id, label, pourquoi },
    alternatives,
    remarqueChoix,
    aVerifier,
  };
}

export const formatCm = (cm: number) => `${cm.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} cm`;
