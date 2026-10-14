/** Formes et libellés partagés entre les routes /api/espace-client/* et les écrans (sans dépendance serveur). */

export const STATUT_DEMANDE: Record<string, string> = {
  nouvelle: "Nouvelle",
  infos_manquantes: "Informations manquantes",
  en_analyse: "En analyse",
  devis_en_preparation: "Devis en préparation",
  devis_envoye: "Devis envoyé",
  relance: "Relance",
  refusee: "Refusée",
  acceptee: "Acceptée",
  cloturee: "Clôturée",
};

/** Un client ne voit jamais un devis « brouillon » ou « en validation interne » (règle de la base) ; libellés par prudence. */
export const STATUT_DEVIS: Record<string, string> = {
  brouillon: "En préparation",
  en_validation_interne: "En préparation",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
  expire: "Expiré",
};

export type MarquageResume = { technique: string; largeur_cm: number | null; nb_couleurs: number | null; consigne: string };
export type ArticleResume = {
  modele: string;
  couleur: string | null;
  grammage: number | null;
  quantite: number;
  marquages: MarquageResume[];
};

export type DemandeListe = {
  id: string;
  reference: string;
  statut: string;
  resume: string;
  date: string;
  articles: number;
  pieces: number;
};

export type DevisResume = { id: string; reference: string; statut: string; total: number; devise: string; date: string; valide_jusqu_au: string | null };

export type Echange = { id: string; auteur: "vous" | "seritex"; texte: string; date: string };

export type DemandeDetail = {
  id: string;
  reference: string;
  statut: string;
  description: string;
  date: string;
  articles: ArticleResume[];
  devis: DevisResume[];
  echanges: Echange[];
};

export type LigneDevis = { description: string; quantite: number; prix_unitaire: number; remise_pct: number; total: number };

export type DevisDetail = DevisResume & {
  objet: string | null;
  reference_client: string | null;
  demande: { id: string; reference: string } | null;
  lignes: LigneDevis[];
  remise_pct: number;
  total_ht: number | null;
  tva_rate: number;
  total_tva: number | null;
  exoneration: string | null;
  mode_reglement: string | null;
  conditions_paiement: string | null;
  acompte_pct: number;
  delai: string | null;
  /** Calculé côté serveur : devis envoyé, encore valable. */
  peut_accepter: boolean;
  /** Devis envoyé dont la date de validité est dépassée. */
  expire_le_jour: boolean;
};

const UNITES: Record<string, [string, string]> = {
  jours: ["jour", "jours"],
  jours_ouvres: ["jour ouvré", "jours ouvrés"],
  semaines: ["semaine", "semaines"],
  mois: ["mois", "mois"],
};
const DEPARTS: Record<string, string> = {
  commande: "à compter de la commande",
  acompte: "à compter du versement de l'acompte",
  validation_echantillon: "à compter de la validation de l'échantillon",
};

export function libelleDelai(valeur: number | null, unite: string | null, depart: string | null): string | null {
  if (!valeur || !unite || !UNITES[unite]) return null;
  const u = UNITES[unite][valeur > 1 ? 1 : 0];
  return `${valeur} ${u}${depart && DEPARTS[depart] ? ` ${DEPARTS[depart]}` : ""}`;
}

/** 1 234 567 F CFA, ou « 1 234,50 EUR » pour une autre devise. */
export function formatMontant(v: number | null | undefined, devise = "XOF"): string {
  if (v == null || Number.isNaN(v)) return "—";
  if (devise === "XOF") return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(v)).replace(/[  ]/g, " ")} F CFA`;
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v).replace(/[  ]/g, " ")} ${devise}`;
}

export const formatDateFr = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", timeZone: "Africa/Abidjan" }) : "—";
