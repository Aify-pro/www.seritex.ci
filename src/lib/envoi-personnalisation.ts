/**
 * Envoi d'une composition « Personnaliser » à Seritex : schéma partagé
 * client + serveur. La base (create_site_personnalisation, migration 0110)
 * refait tous les contrôles métier ; ici on filtre la forme.
 */

export const BUCKET = "site-personnalisation";
export const TAILLE_MAX = 15 * 1024 * 1024;
export const FICHIERS_MAX = 9;
export const TYPES_ACCEPTES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/postscript",
  "application/illustrator",
  "application/octet-stream",
];

export type FichierPrevu = { nom: string; type: string; taille: number };
export type FichierDepose = { path: string; nom: string; role: "logo" | "maquette"; marquage?: number };

export type MarquageEnvoye = {
  emplacement_id: string;
  emplacement_libelle: string;
  largeur_cm: number;
  technique: string;
  technique_libelle: string;
  nb_couleurs: number;
  degrade: boolean;
  consigne: string;
  alertes: string[];
  /** Position ajustée par le client sur l'aperçu : décalage du centre (cm, droite / bas) et inclinaison (degrés). */
  decalage_x_cm: number;
  decalage_y_cm: number;
  rotation_deg: number;
};

export type Coordonnees = {
  nom: string;
  entreprise: string;
  email: string;
  telephone: string;
  date_souhaitee: string;
  message: string;
};

export type EnvoiPersonnalisation = {
  envoi_id: string;
  coordonnees: Coordonnees;
  modele_id: string;
  couleur_id: string | null;
  /** Couleur par zone (zone_key → couleur) ; null = couleur unique. */
  couleurs_zones: Record<string, string> | null;
  textile_id: string | null;
  quantite: number;
  repartition: Record<string, number> | null;
  marquages: MarquageEnvoye[];
  fichiers: FichierDepose[];
};

export type ErreursCoordonnees = Partial<Record<keyof Coordonnees, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validerCoordonnees(c: Partial<Coordonnees>): ErreursCoordonnees {
  const e: ErreursCoordonnees = {};
  if ((c.nom ?? "").trim().length < 2) e.nom = "Indiquez votre nom.";
  if (!EMAIL.test((c.email ?? "").trim())) e.email = "Adresse e-mail invalide.";
  if ((c.telephone ?? "").replace(/\D/g, "").length < 8) e.telephone = "Indiquez un numéro joignable (8 chiffres minimum).";
  if (c.date_souhaitee && !/^\d{4}-\d{2}-\d{2}$/.test(c.date_souhaitee)) e.date_souhaitee = "Date invalide.";
  return e;
}

/** Nettoie et borne l'envoi reçu par le serveur du site ; null si la forme est invalide. */
export function nettoyerEnvoi(raw: unknown): EnvoiPersonnalisation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const c = (r.coordonnees ?? {}) as Record<string, unknown>;
  const coordonnees: Coordonnees = {
    nom: s(c.nom, 120),
    entreprise: s(c.entreprise, 160),
    email: s(c.email, 160).toLowerCase(),
    telephone: s(c.telephone, 40),
    date_souhaitee: s(c.date_souhaitee, 10),
    message: s(c.message, 3000),
  };
  if (Object.keys(validerCoordonnees(coordonnees)).length) return null;
  const envoi_id = s(r.envoi_id, 36);
  const modele_id = s(r.modele_id, 36);
  if (!UUID.test(envoi_id) || !UUID.test(modele_id)) return null;
  const borne = (v: unknown, min: number, max: number) => Math.min(max, Math.max(min, Number(v) || 0));
  const id = (v: unknown) => (UUID.test(String(v ?? "")) ? String(v) : null);
  const quantite = Math.floor(Number(r.quantite));
  if (!Number.isFinite(quantite) || quantite < 1 || quantite > 1_000_000) return null;

  const rep = r.repartition && typeof r.repartition === "object" ? (r.repartition as Record<string, unknown>) : null;
  const repartition = rep
    ? Object.fromEntries(
        Object.entries(rep)
          .slice(0, 30)
          .map(([k, v]) => [k.slice(0, 40), Math.floor(Number(v))] as const)
          .filter(([, v]) => Number.isFinite(v) && v > 0),
      )
    : null;

  const marquages = (Array.isArray(r.marquages) ? r.marquages : []).slice(0, 8).flatMap((m): MarquageEnvoye[] => {
    const x = (m ?? {}) as Record<string, unknown>;
    const emplacement_id = id(x.emplacement_id);
    if (!emplacement_id) return [];
    return [
      {
        emplacement_id,
        emplacement_libelle: s(x.emplacement_libelle, 60),
        largeur_cm: Math.min(60, Math.max(1, Number(x.largeur_cm) || 9)),
        technique: s(x.technique, 40),
        technique_libelle: s(x.technique_libelle, 60),
        nb_couleurs: Math.min(99, Math.max(0, Math.floor(Number(x.nb_couleurs) || 0))),
        degrade: !!x.degrade,
        consigne: s(x.consigne, 600),
        alertes: (Array.isArray(x.alertes) ? x.alertes : []).slice(0, 8).map((a) => s(a, 120)),
        decalage_x_cm: borne(x.decalage_x_cm, -40, 40),
        decalage_y_cm: borne(x.decalage_y_cm, -60, 60),
        rotation_deg: Math.round(borne(x.rotation_deg, -180, 180)),
      },
    ];
  });

  const fichiers = (Array.isArray(r.fichiers) ? r.fichiers : []).slice(0, FICHIERS_MAX).flatMap((f): FichierDepose[] => {
    const x = (f ?? {}) as Record<string, unknown>;
    const path = s(x.path, 300);
    if (!path.startsWith(`envois/${envoi_id}/`)) return [];
    return [
      {
        path,
        nom: s(x.nom, 200) || "fichier",
        role: x.role === "maquette" ? "maquette" : "logo",
        ...(Number.isInteger(x.marquage) ? { marquage: Number(x.marquage) } : {}),
      },
    ];
  });

  return {
    envoi_id,
    coordonnees,
    modele_id,
    couleur_id: id(r.couleur_id),
    couleurs_zones: (() => {
      const z = r.couleurs_zones && typeof r.couleurs_zones === "object" ? (r.couleurs_zones as Record<string, unknown>) : null;
      if (!z) return null;
      const propres = Object.entries(z)
        .slice(0, 20)
        .filter(([k, v]) => /^[\w-]{1,60}$/.test(k) && id(v))
        .map(([k, v]) => [k, String(v)] as const);
      return propres.length ? Object.fromEntries(propres) : null;
    })(),
    textile_id: id(r.textile_id),
    quantite,
    repartition: repartition && Object.keys(repartition).length ? repartition : null,
    marquages,
    fichiers,
  };
}

/** Nom de fichier sûr pour le stockage. */
export const nomSur = (nom: string) =>
  nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-80) || "fichier";
