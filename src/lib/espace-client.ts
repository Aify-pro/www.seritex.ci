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
  };
}
