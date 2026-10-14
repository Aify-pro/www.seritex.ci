"use client";

import { useState, type FormEvent } from "react";
import { Loader2, LogIn, MailCheck, UserPlus } from "lucide-react";
import type { Profil } from "@/lib/compte";

const inputCls =
  "mt-1 block min-h-12 w-full border-2 border-ink bg-paper px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-indigo focus:outline-none aria-[invalid=true]:border-rouge";

type Onglet = "connexion" | "inscription";
type Erreurs = Partial<Record<"nom" | "email" | "telephone" | "mot_de_passe", string>>;

/**
 * Identification DANS le parcours : la maquette reste accessible à tous, mais
 * l'envoi d'une demande demande un compte. Rien n'est perdu — la composition
 * est gardée dans le navigateur (brouillon) pendant l'inscription et la
 * confirmation de l'adresse par e-mail.
 */
export function Identification({ retour, onConnecte }: { retour: string; onConnecte: (p: Profil) => void }) {
  const [onglet, setOnglet] = useState<Onglet>("inscription");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [nonConfirme, setNonConfirme] = useState(false);
  const [renvoi, setRenvoi] = useState<string | null>(null);
  const [champs, setChamps] = useState({ nom: "", entreprise: "", email: "", telephone: "", mot_de_passe: "" });
  const maj = (k: keyof typeof champs) => (e: React.ChangeEvent<HTMLInputElement>) => setChamps((c) => ({ ...c, [k]: e.target.value }));

  async function appeler(url: string, corps: Record<string, unknown>) {
    setOccupe(true);
    setMessage(null);
    setErreurs({});
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
      return (await res.json()) as { ok: boolean; message?: string; erreurs?: Erreurs; code?: string; confirmation?: boolean; connecte?: boolean; profil?: Profil };
    } catch {
      setMessage("Connexion impossible. Vérifiez votre réseau : votre composition est conservée.");
      return null;
    } finally {
      setOccupe(false);
    }
  }

  async function inscrire(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const piege = new FormData(e.currentTarget).get("site_web");
    const r = await appeler("/api/compte/inscription", { ...champs, retour, site_web: piege });
    if (!r) return;
    if (!r.ok) {
      if (r.erreurs) {
        setErreurs(r.erreurs);
        e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(r.erreurs)[0]}"]`)?.focus();
      } else setMessage(r.message ?? "Création du compte impossible.");
      return;
    }
    if (r.connecte) {
      // Confirmation par e-mail non exigée : on enchaîne par une connexion pour récupérer le profil.
      const c = await appeler("/api/compte/connexion", { email: champs.email, mot_de_passe: champs.mot_de_passe });
      if (c?.ok && c.profil) onConnecte(c.profil);
      return;
    }
    setConfirmation(champs.email.trim().toLowerCase());
  }

  async function connecter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNonConfirme(false);
    const piege = new FormData(e.currentTarget).get("site_web");
    const r = await appeler("/api/compte/connexion", { email: champs.email, mot_de_passe: champs.mot_de_passe, site_web: piege });
    if (!r) return;
    if (r.ok && r.profil) return onConnecte(r.profil);
    setNonConfirme(r.code === "non_confirme");
    setMessage(r.message ?? "Connexion impossible.");
  }

  async function renvoyer(email: string) {
    setRenvoi(null);
    const r = await appeler("/api/compte/renvoyer", { email, retour });
    setRenvoi(r?.ok ? "E-mail renvoyé. Pensez à regarder vos courriers indésirables." : (r?.message ?? "Envoi impossible pour le moment."));
  }

  if (confirmation) {
    return (
      <div role="status" className="space-y-4 border-2 border-ink bg-orange/15 p-5">
        <MailCheck aria-hidden className="text-indigo" size={36} />
        <h3 className="font-display text-2xl font-black">Vérifiez votre boîte mail.</h3>
        <p>
          Nous avons envoyé un lien de confirmation à <strong>{confirmation}</strong>. Cliquez dessus, puis revenez vous connecter : <strong>votre
          composition vous attend sur cet appareil</strong>, rien n&apos;est perdu.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setConfirmation(null);
              setOnglet("connexion");
            }}
            className="btn-presse inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-orange px-5 font-display font-bold text-ink"
          >
            <LogIn aria-hidden size={18} /> J&apos;ai confirmé, me connecter
          </button>
          <button type="button" disabled={occupe} onClick={() => void renvoyer(confirmation)} className="min-h-12 border-2 border-ink bg-paper px-5 font-display font-bold disabled:opacity-50">
            Renvoyer le lien
          </button>
        </div>
        {renvoi ? <p role="status" className="text-sm font-medium">{renvoi}</p> : null}
      </div>
    );
  }

  const aria = (k: keyof Erreurs) => ({ "aria-invalid": erreurs[k] ? true : undefined, "aria-describedby": erreurs[k] ? `i-${k}-erreur` : undefined });
  const erreur = (k: keyof Erreurs) =>
    erreurs[k] ? (
      <p id={`i-${k}-erreur`} role="alert" className="mt-1 text-sm font-medium text-rouge">
        {erreurs[k]}
      </p>
    ) : null;
  const piege = (
    <div aria-hidden className="absolute -left-[9999px]" tabIndex={-1}>
      <label>
        Site web <input name="site_web" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );

  return (
    <div className="space-y-5 border-t-2 border-dashed border-ink pt-6">
      <div>
        <p className="font-mono text-xs tracking-widest text-rouge uppercase">Pour envoyer votre demande</p>
        <h3 className="mt-1 font-display text-2xl font-black">Identifiez-vous ou créez votre compte</h3>
        <p className="mt-1 text-muted">Votre maquette reste telle quelle : elle est gardée sur cet appareil pendant que vous vous identifiez.</p>
      </div>

      <div role="tablist" aria-label="Identification" className="grid grid-cols-2 gap-2 sm:max-w-md">
        {(["inscription", "connexion"] as const).map((o) => (
          <button
            key={o}
            type="button"
            role="tab"
            aria-selected={onglet === o}
            onClick={() => {
              setOnglet(o);
              setMessage(null);
              setErreurs({});
              setNonConfirme(false);
            }}
            className={`min-h-11 border-2 border-ink px-3 font-display text-sm font-bold ${onglet === o ? "bg-indigo text-white shadow-hard-sm" : "bg-paper"}`}
          >
            {o === "inscription" ? "Créer un compte" : "J'ai un compte"}
          </button>
        ))}
      </div>

      {onglet === "inscription" ? (
        <form onSubmit={inscrire} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="i-nom" className="font-display font-semibold">Nom et prénom *</label>
              <input id="i-nom" name="nom" value={champs.nom} onChange={maj("nom")} autoComplete="name" required className={inputCls} {...aria("nom")} />
              {erreur("nom")}
            </div>
            <div>
              <label htmlFor="i-entreprise" className="font-display font-semibold">Entreprise / organisation</label>
              <input id="i-entreprise" name="entreprise" value={champs.entreprise} onChange={maj("entreprise")} autoComplete="organization" className={inputCls} />
            </div>
            <div>
              <label htmlFor="i-email" className="font-display font-semibold">E-mail *</label>
              <input id="i-email" name="email" type="email" value={champs.email} onChange={maj("email")} autoComplete="email" inputMode="email" required className={inputCls} {...aria("email")} />
              {erreur("email")}
            </div>
            <div>
              <label htmlFor="i-telephone" className="font-display font-semibold">Téléphone / WhatsApp *</label>
              <input id="i-telephone" name="telephone" type="tel" value={champs.telephone} onChange={maj("telephone")} autoComplete="tel" inputMode="tel" required placeholder="+225 07 00 00 00 00" className={inputCls} {...aria("telephone")} />
              {erreur("telephone")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="i-mdp" className="font-display font-semibold">Mot de passe * <span className="font-normal text-muted">(8 caractères minimum)</span></label>
              <input id="i-mdp" name="mot_de_passe" type="password" value={champs.mot_de_passe} onChange={maj("mot_de_passe")} autoComplete="new-password" minLength={8} required className={`${inputCls} sm:max-w-sm`} {...aria("mot_de_passe")} />
              {erreur("mot_de_passe")}
            </div>
          </div>
          {piege}
          {message ? <p role="alert" className="font-medium text-rouge">{message}</p> : null}
          <button type="submit" disabled={occupe} className="btn-presse inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-orange px-6 font-display text-lg font-bold text-ink disabled:opacity-60">
            {occupe ? <Loader2 aria-hidden className="animate-spin" /> : <UserPlus aria-hidden size={18} />} Créer mon compte
          </button>
          <p className="text-sm text-muted">Un lien de confirmation vous sera envoyé par e-mail. Votre compte sert à suivre vos demandes ; Seritex le rattache ensuite à votre fiche client.</p>
        </form>
      ) : (
        <form onSubmit={connecter} noValidate className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="c2-email" className="font-display font-semibold">E-mail</label>
              <input id="c2-email" name="email" type="email" value={champs.email} onChange={maj("email")} autoComplete="email" inputMode="email" required className={inputCls} />
            </div>
            <div>
              <label htmlFor="c2-mdp" className="font-display font-semibold">Mot de passe</label>
              <input id="c2-mdp" name="mot_de_passe" type="password" value={champs.mot_de_passe} onChange={maj("mot_de_passe")} autoComplete="current-password" required className={inputCls} />
            </div>
          </div>
          {piege}
          {message ? <p role="alert" className="font-medium text-rouge">{message}</p> : null}
          {nonConfirme ? (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" disabled={occupe} onClick={() => void renvoyer(champs.email)} className="min-h-11 border-2 border-ink bg-paper px-4 font-display text-sm font-bold disabled:opacity-50">
                Renvoyer le lien de confirmation
              </button>
              {renvoi ? <p role="status" className="text-sm font-medium">{renvoi}</p> : null}
            </div>
          ) : null}
          <button type="submit" disabled={occupe} className="btn-presse inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-orange px-6 font-display text-lg font-bold text-ink disabled:opacity-60">
            {occupe ? <Loader2 aria-hidden className="animate-spin" /> : <LogIn aria-hidden size={18} />} Me connecter
          </button>
        </form>
      )}
    </div>
  );
}
