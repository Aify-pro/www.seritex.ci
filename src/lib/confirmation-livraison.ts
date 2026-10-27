/**
 * Confirmation de réception d'une livraison, sans compte : le client arrive depuis le lien de l'e-mail
 * « livraison effectuée ». Le jeton (48 caractères aléatoires, haché en base, valable 30 jours, à usage unique)
 * fait office d'identité. On appelle deux fonctions de la plateforme ouvertes à la clé « anon » ; elles
 * vérifient tout elles-mêmes (jeton, expiration, réponse unique) et ne renvoient que l'utile.
 * Aucune clé de service ici. L'alerte au service livraison en cas de problème part de la base (file d'attente).
 */

const JETON = /^[0-9a-f]{20,128}$/i;
export const jetonValide = (v: string) => JETON.test(v);

export const COMMENTAIRE_MAX = 2000;

export type InfoConfirmation = {
  reference: string | null;
  client_nom: string | null;
  livree_at: string | null;
  pieces: number;
  reponse: "confirme" | "probleme" | null;
  expire: boolean;
};

async function rpc<T>(nom: string, body: unknown): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/${nom}`, {
      method: "POST",
      headers: { apikey: process.env.SUPABASE_ANON_KEY!, Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY!}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const j = (await res.json().catch(() => null)) as T | { message?: string } | null;
    if (!res.ok) return { ok: false, message: (j as { message?: string } | null)?.message ?? "" };
    return { ok: true, data: j as T };
  } catch {
    return { ok: false, message: "" };
  }
}

/** `null` : lien inconnu ou illisible. */
export async function infoConfirmation(jeton: string): Promise<InfoConfirmation | null> {
  if (!jetonValide(jeton)) return null;
  const r = await rpc<InfoConfirmation[]>("shipment_confirmation_info", { p_token: jeton });
  return r.ok ? (r.data[0] ?? null) : null;
}

export type ResultatReponse = { ok: true } | { ok: false; status: number; message: string };

/** Les messages de la base sont déjà rédigés pour le client (« ce lien de confirmation a expiré »…). */
export async function repondreConfirmation(jeton: string, reponse: "confirme" | "probleme", commentaire: string): Promise<ResultatReponse> {
  if (!jetonValide(jeton)) return { ok: false, status: 404, message: "Ce lien de confirmation n'est pas valide." };
  const r = await rpc<unknown>("answer_shipment_confirmation", { p_token: jeton, p_reponse: reponse, p_commentaire: commentaire.trim() || null });
  if (r.ok) return { ok: true };
  const m = r.message.toLowerCase();
  if (m.includes("invalide")) return { ok: false, status: 404, message: "Ce lien de confirmation n'est pas valide." };
  if (m.includes("déjà")) return { ok: false, status: 409, message: "Cette livraison a déjà reçu une réponse. Merci !" };
  if (m.includes("expiré")) return { ok: false, status: 410, message: "Ce lien de confirmation a expiré. Contactez-nous si besoin." };
  if (m.includes("décrivez")) return { ok: false, status: 422, message: "Décrivez en quelques mots le problème rencontré." };
  return { ok: false, status: 502, message: "Votre réponse n'a pas pu être enregistrée. Réessayez, ou contactez-nous." };
}
