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
  /** Le devis serait acceptable, mais ce droit est retiré au compte par Seritex. */
  acceptation_retiree?: boolean;
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

/** États simplifiés des commandes (vue client_commandes de la plateforme) : jamais les étapes internes. */
export const ETAT_COMMANDE: Record<string, string> = {
  en_preparation: "En préparation",
  en_fabrication: "En fabrication",
  terminee: "Terminée",
  annulee: "Annulée",
};

export const ETAT_LIVRAISON: Record<string, string> = {
  en_preparation: "En préparation",
  planifiee: "Planifiée",
  prete_a_enlever: "Prête à enlever",
  en_route: "En route",
  livree: "Livrée",
  enlevee: "Enlevée",
  reception_confirmee: "Réception confirmée",
  a_replanifier: "À replanifier",
  litige: "Litige en cours",
};

export const STATUT_ECHANTILLON: Record<string, string> = {
  demande: "Demandé",
  en_fabrication: "En fabrication",
  envoye: "Envoyé",
  recu_client: "Reçu",
  en_validation: "En validation",
  valide: "Validé",
  a_ajuster: "À ajuster",
  refuse: "Refusé",
  sans_suite: "Sans suite",
};

export type CommandeListe = {
  id: string;
  reference: string;
  etat: string;
  quantite: number;
  prevue: string | null;
  date: string;
  section: string | null;
  devis_reference: string | null;
  demande_id: string | null;
};

export type LivraisonListe = {
  id: string;
  reference: string | null;
  etat: string;
  mode: "livraison" | "retrait";
  lieu: string | null;
  commande: string | null;
  quantite: number;
  /** Date la plus parlante : livraison effective, sinon planifiée, sinon promise. */
  date: string | null;
};

export type LivraisonDetail = LivraisonListe & {
  lignes: { designation: string; taille: string | null; quantite: number; livree: number | null }[];
  suivi: { etat: string; date: string }[];
};

export type EchantillonListe = {
  id: string;
  reference: string;
  numero: string | null;
  besoin: string;
  statut: string;
  echeance: string | null;
  date: string;
  demande: { id: string; reference: string } | null;
  /** Le client attend de répondre : l'échantillon lui est parvenu et sa validation n'est pas posée. */
  peut_repondre: boolean;
  /** Date à laquelle le client a validé (la direction valide de son côté). */
  validee_le: string | null;
};

/** Longueur maximale du message joint à une réponse sur un échantillon. */
export const COMMENTAIRE_ECHANTILLON_MAX = 2000;

export const CATEGORIE_FICHIER: Record<string, string> = {
  visuel: "Visuels",
  maquette: "Maquettes",
  image_de_marque: "Image de marque",
  fiche_technique: "Fiches techniques",
  nuancier: "Nuanciers",
  autre: "Autres fichiers",
};

export type FichierListe = { id: string; nom: string; categorie: string; type: string | null; taille: number | null; date: string };

/** 1,2 Mo, 340 Ko… */
export function formatTaille(octets: number | null | undefined): string {
  if (octets == null || octets < 0) return "";
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

/** Au-delà, le site ne relaie pas le fichier (réponses limitées à 4,5 Mo) : le client le demande à son conseiller. */
export const TAILLE_MAX_TELECHARGEMENT = 4_000_000;

