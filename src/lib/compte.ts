import { cookies } from "next/headers";

/**
 * Comptes du site (e-shop) : e-mail + mot de passe, portés par l'authentification
 * Supabase (GoTrue) du même projet que la plateforme. Le navigateur ne parle
 * jamais à Supabase : tout passe par nos routes /api/compte/*, et la session
 * vit dans deux cookies httpOnly (jeton d'accès + jeton de renouvellement).
 *
 * La clé « anon » (SUPABASE_ANON_KEY) est publique par conception : la
 * protection vient de la RLS de la base. Elle ne sert qu'à l'authentification ;
 * la clé « service role » reste réservée à l'enregistrement des demandes.
 *
 * Clé absente = comptes indisponibles : l'envoi d'une composition est alors
 * refusé (on ne laisse jamais passer sans identification).
 */

const AT = "sx_at";
const RT = "sx_rt";

export type Profil = {
  id: string;
  email: string;
  nom: string;
  telephone: string;
  entreprise: string;
  /** Le compte est-il déjà rattaché par Seritex à une fiche client ? */
  rattache: boolean;
  /** Nom de la société (ou de la fiche particulier) une fois rattaché. */
  societe: string | null;
};

type ErreurAuth = { status: number; code: string };
type Jetons = { access_token: string; refresh_token: string; expires_in?: number };

const base = () => process.env.SUPABASE_URL;
const anon = () => process.env.SUPABASE_ANON_KEY;
export const comptesDisponibles = () => !!(base() && anon() && process.env.SUPABASE_SERVICE_ROLE_KEY);

async function auth<T>(chemin: string, init: { method?: string; body?: unknown; token?: string } = {}): Promise<{ ok: true; data: T } | { ok: false; erreur: ErreurAuth }> {
  try {
    const res = await fetch(`${base()}/auth/v1/${chemin}`, {
      method: init.method ?? "POST",
      headers: { apikey: anon()!, Authorization: `Bearer ${init.token ?? anon()}`, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, erreur: { status: res.status, code: String(data.error_code ?? data.code ?? data.error ?? "erreur") } };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, erreur: { status: 0, code: "reseau" } };
  }
}

export type UtilisateurAuth = {
  id: string;
  email?: string;
  identities?: unknown[];
  user_metadata?: Record<string, unknown>;
};

/** Pose la session dans des cookies httpOnly (appelable depuis une route seulement). */
export async function poserSession(j: Jetons) {
  const c = await cookies();
  const commun = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  c.set(AT, j.access_token, { ...commun, maxAge: Math.max(60, j.expires_in ?? 3600) });
  c.set(RT, j.refresh_token, { ...commun, maxAge: 60 * 60 * 24 * 30 });
}

export async function effacerSession() {
  const c = await cookies();
  c.delete(AT);
  c.delete(RT);
}

export const inscrire = (email: string, password: string, data: Record<string, string>, redirectTo: string) =>
  auth<UtilisateurAuth & Partial<Jetons>>(`signup?redirect_to=${encodeURIComponent(redirectTo)}`, { body: { email, password, data } });

export const connecter = (email: string, password: string) =>
  auth<Jetons & { user: UtilisateurAuth }>("token?grant_type=password", { body: { email, password } });

export const renvoyerConfirmation = (email: string, redirectTo: string) =>
  auth<unknown>(`resend?redirect_to=${encodeURIComponent(redirectTo)}`, { body: { type: "signup", email } });

/** Appel REST à la plateforme avec la clé de service (jamais exposée au navigateur). */
async function rest<T>(chemin: string, init: { method?: string; body?: unknown } = {}): Promise<T | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base() || !key) return null;
  try {
    const res = await fetch(`${base()}/rest/v1/${chemin}`, {
      method: init.method ?? "GET",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[compte] appel plateforme refusé", chemin, res.status, await res.text());
      return null;
    }
    // Un PATCH réussi renvoie un corps vide : « {} » le distingue d'un échec (null).
    return (await res.json().catch(() => ({}))) as T;
  } catch {
    return null;
  }
}

/** Crée le profil « client » côté plateforme (migration 0125) ; sans effet s'il existe déjà. */
export async function creerProfil(u: { id: string; email: string; nom: string; telephone: string; entreprise: string }) {
  const res = await fetch(`${base()}/rest/v1/rpc/create_site_account`, {
    method: "POST",
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ p_user_id: u.id, p_email: u.email, p_nom: u.nom, p_telephone: u.telephone, p_entreprise: u.entreprise }),
  }).catch(() => null);
  if (!res?.ok) console.error("[compte] création du profil échouée", res?.status, await res?.text().catch(() => ""));
  return !!res?.ok;
}

type LigneProfil = { id: string; email: string; full_name: string; phone: string | null; entreprise_declaree: string | null; company_id: string | null };

async function profilDe(u: UtilisateurAuth): Promise<Profil | null> {
  const lire = () => rest<LigneProfil[]>(`app_users?id=eq.${u.id}&select=id,email,full_name,phone,entreprise_declaree,company_id`);
  let l = (await lire())?.[0];
  if (!l) {
    // Profil manquant (création interrompue après l'inscription) : on le recrée depuis les infos d'inscription.
    const m = u.user_metadata ?? {};
    const nom = String(m.nom ?? "").trim();
    if (!u.email || nom.length < 2) return null;
    await creerProfil({ id: u.id, email: u.email, nom, telephone: String(m.telephone ?? ""), entreprise: String(m.entreprise ?? "") });
    l = (await lire())?.[0];
  }
  if (!l) return null;
  const societe = l.company_id ? ((await rest<{ name: string }[]>(`companies?id=eq.${l.company_id}&select=name`))?.[0]?.name ?? null) : null;
  return { id: l.id, email: l.email, nom: l.full_name, telephone: l.phone ?? "", entreprise: l.entreprise_declaree ?? "", rattache: !!l.company_id, societe };
}

/**
 * Personne connectée, ou null. Jeton d'accès expiré : renouvelé avec le jeton
 * de renouvellement (les cookies sont alors reposés). À n'appeler que depuis
 * une route /api (les cookies ne s'écrivent pas depuis un composant serveur).
 */
export async function sessionCourante(): Promise<Profil | null> {
  return (await sessionAvecJeton())?.profil ?? null;
}

/** Comme sessionCourante, avec le jeton d'accès VALIDE (renouvelé au besoin) pour agir au nom de la personne. */
export async function sessionAvecJeton(): Promise<{ profil: Profil; jeton: string } | null> {
  if (!comptesDisponibles()) return null;
  const c = await cookies();
  let at = c.get(AT)?.value;
  const rt = c.get(RT)?.value;

  let u = at ? await auth<UtilisateurAuth>("user", { method: "GET", token: at }) : null;
  if ((!u || !u.ok) && rt) {
    const r = await auth<Jetons>("token?grant_type=refresh_token", { body: { refresh_token: rt } });
    if (r.ok) {
      await poserSession(r.data);
      at = r.data.access_token;
      u = await auth<UtilisateurAuth>("user", { method: "GET", token: at });
    } else if (r.erreur.status >= 400 && r.erreur.status < 500) {
      await effacerSession();
    }
  }
  if (!u || !u.ok || !at) return null;
  const profil = await profilDe(u.data);
  return profil ? { profil, jeton: at } : null;
}

export { profilDe };

/**
 * Mot de passe oublié : le lien n'est envoyé qu'à une adresse qui a un compte CLIENT
 * (le personnel passe par la plateforme) ; la réponse est toujours la même, que
 * l'adresse existe ou non. L'e-mail contient un lien vers /espace-client/reinitialiser
 * avec un jeton qui n'est consommé que par le bouton de la page (jamais par un
 * simple affichage : les antivirus de messagerie ouvrent les liens).
 */
export async function demanderRecuperation(email: string, redirectTo: string) {
  const motif = email.replace(/[\\%_*]/g, (c) => `\\${c}`);
  const trouve = await rest<{ id: string }[]>(`app_users?email=ilike.${encodeURIComponent(motif)}&role=eq.client&active=eq.true&select=id&limit=1`);
  if (!trouve?.length) return;
  await auth<unknown>(`recover?redirect_to=${encodeURIComponent(redirectTo)}`, { body: { email } });
}

/** Échange le jeton du lien e-mail contre une session de récupération (usage unique). */
export const verifierRecuperation = (tokenHash: string) =>
  auth<Jetons>("verify", { body: { type: "recovery", token_hash: tokenHash } });

export const changerMotDePasse = (accessToken: string, motDePasse: string) =>
  auth<unknown>("user", { method: "PUT", token: accessToken, body: { password: motDePasse } });

/** Met à jour le téléphone du compte connecté (la seule coordonnée modifiable depuis le site). */
export async function majTelephone(id: string, telephone: string) {
  return (await rest<unknown>(`app_users?id=eq.${id}`, { method: "PATCH", body: { phone: telephone.trim().slice(0, 40) || null } })) !== null;
}

export const MOT_DE_PASSE_MIN = 8;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const emailValide = (e: string) => EMAIL.test(e);

/** Adresse de retour après confirmation par e-mail : jamais autre chose qu'une page de l'e-shop. */
export function retourSur(v: unknown): string {
  const s = typeof v === "string" ? v : "";
  return /^\/e-shop(\/[a-z0-9-]*)?$/i.test(s) ? s : "/e-shop";
}
