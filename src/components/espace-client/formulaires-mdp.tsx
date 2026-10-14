"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";

const inputCls =
  "mt-1 block min-h-12 w-full border-2 border-ink bg-paper px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-indigo focus:outline-none";
const boite = "max-w-xl space-y-5 border-2 border-ink bg-paper p-5 shadow-hard sm:p-8";
const bouton = "btn-presse inline-flex min-h-12 items-center justify-center gap-2 border-2 border-ink bg-orange px-6 font-display text-lg font-bold text-ink disabled:opacity-60";

/** Étape 1 : saisie de l'e-mail ; la réponse est la même que l'adresse ait un compte ou non. */
export function FormulaireOubli() {
  const [email, setEmail] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const piege = new FormData(e.currentTarget).get("site_web");
    setOccupe(true);
    setErreur(null);
    try {
      const r = await fetch("/api/compte/recuperation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, site_web: piege }) });
      const j = await r.json();
      if (j.ok) setEnvoye(true);
      else setErreur(j.message ?? "Envoi impossible pour le moment.");
    } catch {
      setErreur("Connexion impossible. Réessayez.");
    } finally {
      setOccupe(false);
    }
  }

  if (envoye) {
    return (
      <div role="status" className={boite}>
        <MailCheck aria-hidden className="text-indigo" size={40} />
        <h2 className="font-display text-2xl font-black">Vérifiez votre boîte mail.</h2>
        <p>
          Si un compte existe pour <strong>{email}</strong>, un lien pour choisir un nouveau mot de passe vient d&apos;être envoyé. Il est personnel, à usage unique et limité
          dans le temps. Pensez à regarder vos courriers indésirables.
        </p>
        <Link href="/espace-client" className="inline-flex min-h-11 items-center border-2 border-ink bg-paper px-4 font-display font-bold">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} noValidate className={boite}>
      <h2 className="font-display text-2xl font-black">Mot de passe oublié ?</h2>
      <p className="text-muted">Indiquez l&apos;adresse e-mail de votre compte : nous vous envoyons un lien pour en choisir un nouveau.</p>
      <div>
        <label htmlFor="o-email" className="font-display font-semibold">
          E-mail
        </label>
        <input id="o-email" name="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
      </div>
      <div aria-hidden className="absolute -left-[9999px]" tabIndex={-1}>
        <label>
          Site web <input name="site_web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {erreur ? (
        <p role="alert" className="font-medium text-rouge">
          {erreur}
        </p>
      ) : null}
      <button type="submit" disabled={occupe || !email} className={bouton}>
        {occupe ? <Loader2 aria-hidden className="animate-spin" /> : null} Recevoir le lien
      </button>
      <p className="text-sm text-muted">
        <Link href="/espace-client" className="font-semibold underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}

/** Étape 2 : nouveau mot de passe. Le jeton du lien n'est consommé qu'à l'envoi de ce formulaire. */
export function FormulaireReinitialisation({ jeton }: { jeton: string | null }) {
  const router = useRouter();
  const [mdp, setMdp] = useState({ nouveau: "", confirmation: "" });
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<{ message: string; lien: boolean } | null>(null);
  const [fait, setFait] = useState(false);

  if (!jeton || erreur?.lien) {
    return (
      <div role="alert" className={boite}>
        <h2 className="font-display text-2xl font-black">{erreur?.message ?? "Ce lien n'est pas valide."}</h2>
        <Link href="/espace-client/mot-de-passe-oublie" className="inline-flex min-h-12 items-center border-2 border-ink bg-orange px-5 font-display font-bold text-ink">
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (mdp.nouveau.length < 8) return setErreur({ message: "Au moins 8 caractères.", lien: false });
    if (mdp.nouveau !== mdp.confirmation) return setErreur({ message: "La confirmation ne correspond pas.", lien: false });
    setOccupe(true);
    try {
      const r = await fetch("/api/compte/reinitialiser", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token_hash: jeton, mot_de_passe: mdp.nouveau }) });
      const j = await r.json();
      if (j.ok) {
        setFait(true);
        setTimeout(() => router.push("/espace-client"), 1500);
      } else setErreur({ message: j.message ?? "Changement impossible.", lien: !!j.lien });
    } catch {
      setErreur({ message: "Connexion impossible. Réessayez.", lien: false });
    } finally {
      setOccupe(false);
    }
  }

  if (fait) {
    return (
      <div role="status" className={boite}>
        <CheckCircle2 aria-hidden className="text-indigo" size={40} />
        <h2 className="font-display text-2xl font-black">Mot de passe modifié. Vous êtes connecté.</h2>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} noValidate className={boite}>
      <h2 className="font-display text-2xl font-black">Choisissez votre nouveau mot de passe</h2>
      <div>
        <label htmlFor="r-nouveau" className="font-display font-semibold">
          Nouveau mot de passe <span className="font-normal text-muted">(8 caractères minimum)</span>
        </label>
        <input id="r-nouveau" type="password" autoComplete="new-password" minLength={8} required value={mdp.nouveau} onChange={(e) => setMdp({ ...mdp, nouveau: e.target.value })} className={inputCls} />
      </div>
      <div>
        <label htmlFor="r-conf" className="font-display font-semibold">
          Confirmer
        </label>
        <input id="r-conf" type="password" autoComplete="new-password" required value={mdp.confirmation} onChange={(e) => setMdp({ ...mdp, confirmation: e.target.value })} className={inputCls} />
      </div>
      {erreur ? (
        <p role="alert" className="font-medium text-rouge">
          {erreur.message}
        </p>
      ) : null}
      <button type="submit" disabled={occupe} className={bouton}>
        {occupe ? <Loader2 aria-hidden className="animate-spin" /> : null} Valider
      </button>
    </form>
  );
}
