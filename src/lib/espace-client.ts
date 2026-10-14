import type { Profil } from "@/lib/compte";
import { sessionAvecJeton } from "@/lib/compte";
import type { ArticleResume, DemandeDetail, DemandeListe, DevisDetail, DevisResume, Echange, LigneDevis } from "./espace-client-types";
import { libelleDelai } from "./espace-client-types";

/**
 * Lecture des données du client connecté. On parle à la base AVEC SA SESSION (jeton du
 * client + clé « anon ») : c'est la RLS de la plateforme qui borne tout à sa société, et
 * qui masque les devis non envoyés. Aucune clé de service ici.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const idValide = (v: string) => UUID.test(v);

async function lire<T>(jeton: string, chemin: string): Promise<T | null> {
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${chemin}`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY!, Authorization: `Bearer ${jeton}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[espace-client] lecture refusée", chemin.split("?")[0], res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Session du client, ou la réponse à renvoyer (401 non connecté, 200 vide si pas encore rattaché). */
export async function sessionClient(): Promise<{ profil: Profil; jeton: string } | Response> {
  const s = await sessionAvecJeton();
  if (!s) return Response.json({ connecte: false }, { status: 401 });
  return s;
}
export const nonRattache = () => Response.json({ connecte: true, rattache: false });

type LigneDemande = { id: string; reference: string; status: string; description: string | null; created_at: string; personnalisation: unknown };

function articlesDe(p: unknown): ArticleResume[] {
  const liste = (p as { articles?: unknown[] } | null)?.articles;
  if (!Array.isArray(liste)) return [];
  return liste.map((a) => {
    const x = (a ?? {}) as Record<string, unknown>;
    const marq = Array.isArray(x.marquages) ? (x.marquages as Record<string, unknown>[]) : [];
    return {
      modele: String(x.modele ?? "Article"),
      couleur: x.couleur ? String(x.couleur) : null,
      grammage: typeof x.grammage === "number" ? x.grammage : null,
      quantite: Number(x.quantite) || 0,
      marquages: marq.map((m) => ({
        technique: String(m.technique_libelle ?? "Technique à définir"),
        largeur_cm: typeof m.largeur_cm === "number" ? m.largeur_cm : null,
        nb_couleurs: typeof m.nb_couleurs === "number" ? m.nb_couleurs : null,
        consigne: String(m.consigne ?? ""),
      })),
    };
  });
}

const resumeTexte = (d: string | null) => (d ?? "").split("\n").find((l) => l.trim()) ?? "";

const COLONNES_DEMANDE = "id,reference,status,description,created_at,personnalisation";

export async function listerDemandes(jeton: string): Promise<DemandeListe[] | null> {
  const r = await lire<LigneDemande[]>(jeton, `requests?select=${COLONNES_DEMANDE}&order=created_at.desc&limit=200`);
  if (!r) return null;
  return r.map((d) => {
    const arts = articlesDe(d.personnalisation);
    return {
      id: d.id,
      reference: d.reference,
      statut: d.status,
      resume: arts.length ? arts.map((a) => a.modele).join(", ") : resumeTexte(d.description),
      date: d.created_at,
      articles: arts.length,
      pieces: arts.reduce((n, a) => n + a.quantite, 0),
    };
  });
}

type LigneDevisListe = { id: string; reference: string; status: string; total_amount: number; devise: string | null; created_at: string; valid_until: string | null; request_id?: string };
const COLONNES_DEVIS_LISTE = "id,reference,status,total_amount,devise,created_at,valid_until";
const versResume = (q: LigneDevisListe): DevisResume => ({
  id: q.id, reference: q.reference, statut: q.status, total: Number(q.total_amount), devise: q.devise ?? "XOF", date: q.created_at, valide_jusqu_au: q.valid_until,
});

export async function listerDevis(jeton: string): Promise<DevisResume[] | null> {
  const r = await lire<LigneDevisListe[]>(jeton, `quotes?select=${COLONNES_DEVIS_LISTE}&order=created_at.desc&limit=200`);
  return r ? r.map(versResume) : null;
}

export async function detailDemande(jeton: string, profilId: string, id: string): Promise<DemandeDetail | null> {
  const d = (await lire<LigneDemande[]>(jeton, `requests?id=eq.${id}&select=${COLONNES_DEMANDE}`))?.[0];
  if (!d) return null;
  const [devis, messages] = await Promise.all([
    lire<LigneDevisListe[]>(jeton, `quotes?request_id=eq.${id}&select=${COLONNES_DEVIS_LISTE}&order=created_at.desc`),
    lire<{ id: string; body: string; created_at: string; sender_id: string }[]>(jeton, `messages?request_id=eq.${id}&select=id,body,created_at,sender_id&order=created_at.asc`),
  ]);
  // Pas de nom du personnel : « Vous » ou « Seritex ».
  const echanges: Echange[] = (messages ?? []).map((m) => ({ id: m.id, auteur: m.sender_id === profilId ? "vous" : "seritex", texte: m.body, date: m.created_at }));
  return {
    id: d.id, reference: d.reference, statut: d.status, description: d.description ?? "", date: d.created_at,
    articles: articlesDe(d.personnalisation), devis: (devis ?? []).map(versResume), echanges,
  };
}

type LigneDevisDetail = LigneDevisListe & {
  objet: string | null; reference_client: string | null; request_id: string; remise_pct: number | null; total_ht: number | null; tva_rate: number | null;
  total_tva: number | null; tva_exoneration_motif: string | null; mode_reglement: string | null; conditions_paiement: string | null; acompte_pct: number | null;
  delai_valeur: number | null; delai_unite: string | null; delai_depart: string | null;
};
// Colonnes nommées une à une : jamais `select=*` (notes internes, motifs de rejet, références Sage…).
const COLONNES_DEVIS = `${COLONNES_DEVIS_LISTE},objet,reference_client,request_id,remise_pct,total_ht,tva_rate,total_tva,tva_exoneration_motif,mode_reglement,conditions_paiement,acompte_pct,delai_valeur,delai_unite,delai_depart`;

export async function detailDevis(jeton: string, id: string): Promise<DevisDetail | null> {
  const q = (await lire<LigneDevisDetail[]>(jeton, `quotes?id=eq.${id}&select=${COLONNES_DEVIS}`))?.[0];
  if (!q) return null;
  const [lignes, demande] = await Promise.all([
    lire<{ description: string; quantity: number; unit_price: number; remise_pct: number | null }[]>(jeton, `quote_lines?quote_id=eq.${id}&select=description,quantity,unit_price,remise_pct&order=id`),
    lire<{ id: string; reference: string }[]>(jeton, `requests?id=eq.${q.request_id}&select=id,reference`),
  ]);
  const lignesNettes: LigneDevis[] = (lignes ?? []).map((l) => {
    const remise = Number(l.remise_pct ?? 0);
    return { description: l.description, quantite: l.quantity, prix_unitaire: Number(l.unit_price), remise_pct: remise, total: Math.round(l.quantity * Number(l.unit_price) * (1 - remise / 100) * 100) / 100 };
  });
  return {
    ...versResume(q),
    objet: q.objet, reference_client: q.reference_client, demande: demande?.[0] ? { id: demande[0].id, reference: demande[0].reference } : null, lignes: lignesNettes,
    remise_pct: Number(q.remise_pct ?? 0), total_ht: q.total_ht == null ? null : Number(q.total_ht), tva_rate: Number(q.tva_rate ?? 0),
    total_tva: q.total_tva == null ? null : Number(q.total_tva), exoneration: q.tva_exoneration_motif,
    mode_reglement: q.mode_reglement, conditions_paiement: q.conditions_paiement, acompte_pct: Number(q.acompte_pct ?? 0),
    delai: libelleDelai(q.delai_valeur, q.delai_unite, q.delai_depart),
    peut_accepter: q.status === "envoye" && !validiteDepassee(q.valid_until),
    expire_le_jour: q.status === "envoye" && validiteDepassee(q.valid_until),
  };
}

/** Date de validité dépassée (jour inclus : valable jusqu'au soir de cette date, heure d'Abidjan). */
function validiteDepassee(valideJusquAu: string | null): boolean {
  if (!valideJusquAu) return false;
  const aujourdhui = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Abidjan" });
  return valideJusquAu < aujourdhui;
}

/** Le navigateur d'origine est bien notre propre site (garde supplémentaire des actions engageantes). */
export function memeOrigine(req: Request): boolean {
  const origine = req.headers.get("origin");
  const hote = req.headers.get("host");
  if (!origine || !hote) return false;
  try {
    return new URL(origine).host === hote;
  } catch {
    return false;
  }
}

type Ecriture = { ok: true } | { ok: false; status: number; message: string };

async function ecrire(jeton: string, chemin: string, body: unknown): Promise<Ecriture> {
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${chemin}`, {
      method: "POST",
      headers: { apikey: process.env.SUPABASE_ANON_KEY!, Authorization: `Bearer ${jeton}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (res.ok) return { ok: true };
    const j = (await res.json().catch(() => ({}))) as { message?: string };
    console.error("[espace-client] écriture refusée", chemin, res.status, j.message);
    return { ok: false, status: res.status, message: j.message ?? "" };
  } catch {
    return { ok: false, status: 0, message: "" };
  }
}

export type ResultatAction = { ok: true } | { ok: false; code: "introuvable" | "indisponible" | "invalide" | "erreur"; message: string };

/**
 * Accepte un devis ENVOYÉ et encore valable. La décision est celle de la base (accept_quote : société du client,
 * statut « envoyé », une seule fois) ; on ne fait ici qu'éviter d'appeler pour rien et traduire les refus.
 */
export async function accepterDevis(jeton: string, id: string): Promise<ResultatAction> {
  const d = await detailDevis(jeton, id);
  if (!d) return { ok: false, code: "introuvable", message: "Ce devis est introuvable." };
  if (d.statut === "accepte") return { ok: false, code: "indisponible", message: "Ce devis est déjà accepté." };
  if (d.expire_le_jour) return { ok: false, code: "indisponible", message: "Ce devis n'est plus valable. Contactez-nous pour en obtenir un nouveau." };
  if (!d.peut_accepter) return { ok: false, code: "indisponible", message: "Ce devis ne peut pas être accepté en l'état." };
  const r = await ecrire(jeton, "rpc/accept_quote", { p_quote_id: id });
  if (r.ok) return r;
  // Course (deux onglets) : la base a déjà enregistré l'acceptation.
  if (/pas en attente/.test(r.message)) return { ok: false, code: "indisponible", message: "Ce devis a déjà été traité." };
  return { ok: false, code: "erreur", message: "L'acceptation n'a pas pu être enregistrée. Rien n'a été validé : réessayez ou contactez-nous." };
}

export const MESSAGE_MAX = 4000;

/** Écrit un message dans le fil d'une demande, sous le nom du client (la RLS refuse toute autre société). */
export async function ecrireMessage(jeton: string, profilId: string, demandeId: string, texte: string): Promise<ResultatAction> {
  const t = texte.trim();
  if (!t) return { ok: false, code: "invalide", message: "Écrivez votre message." };
  if (t.length > MESSAGE_MAX) return { ok: false, code: "invalide", message: `Message trop long (${MESSAGE_MAX} caractères maximum).` };
  const visible = await lire<{ id: string }[]>(jeton, `requests?id=eq.${demandeId}&select=id`);
  if (!visible?.length) return { ok: false, code: "introuvable", message: "Cette demande est introuvable." };
  const r = await ecrire(jeton, "messages", { request_id: demandeId, sender_id: profilId, body: t });
  if (r.ok) return r;
  return { ok: false, code: "erreur", message: "Votre message n'a pas pu être envoyé. Réessayez." };
}
