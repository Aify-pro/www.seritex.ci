/**
 * Droits de l'espace client (plateforme, migration 0140) : tout est permis par défaut, Seritex peut en retirer
 * par société ou par compte. La BASE est l'autorité (RLS, vues, fonctions) ; ce fichier sert à parler clairement
 * au client (menu masqué, message explicite) au lieu d'afficher « aucun devis ». Lecture : client_droits_effectifs().
 */
export const DROITS = ["devis_voir", "devis_accepter", "commandes_voir", "livraisons_voir", "mediatheque_voir", "demandes_creer", "echantillons_voir"] as const;
export type Droit = (typeof DROITS)[number];
export type Droits = Record<Droit, boolean>;

/** Un droit n'est refusé que s'il est explicitement à faux : inconnu ou illisible = permis (la base refuse seule au besoin). */
export const autorise = (droits: Partial<Droits> | undefined | null, droit: Droit): boolean => droits?.[droit] !== false;

export const MESSAGE_INTERDIT = "Cet accès n'est pas activé pour votre compte. Contactez votre conseiller Seritex pour l'obtenir.";
