"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Identification } from "@/components/compte/identification";
import { useCompte } from "@/components/compte/use-compte";
import { CadreEspace } from "./cadre";

const inputCls =
  "mt-1 block min-h-12 w-full border-2 border-ink bg-paper px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-indigo focus:outline-none read-only:bg-ecru";

type Retour = { ok: boolean; message: string } | null;

/** « Mon compte » : coordonnées (le téléphone est modifiable) et changement de mot de passe. */
export function PageCompte() {
  const compte = useCompte();
  const profil = compte.profil;
  const [telephone, setTelephone] = useState<string | null>(null);
  const [retourTel, setRetourTel] = useState<Retour>(null);
  const [mdp, setMdp] = useState({ actuel: "", nouveau: "", confirmation: "" });
  const [retourMdp, setRetourMdp] = useState<Retour>(null);
  const [occupe, setOccupe] = useState<"tel" | "mdp" | null>(null);

  if (!compte.charge) {
    return (
      <p role="status" className="text-muted">
        <Loader2 aria-hidden className="mr-2 inline animate-spin" size={16} /> Chargement…
      </p>
    );
  }
  if (!profil) {
    return (
      <div className="max-w-2xl border-2 border-ink bg-paper p-5 shadow-hard sm:p-8">
        <Identification retour="/espace-client/compte" onConnecte={compte.connecte} />
      </div>
    );
  }

  async function enregistrerTelephone(e: FormEvent) {
    e.preventDefault();
    setOccupe("tel");
    setRetourTel(null);
    try {
      const r = await fetch("/api/compte/profil", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telephone: telephone ?? profil!.telephone }) });
      const j = await r.json();
      if (j.identification) void compte.actualiser();
      if (j.ok) compte.connecte({ ...profil!, telephone: j.telephone });
      setRetourTel({ ok: !!j.ok, message: j.ok ? "Téléphone enregistré." : (j.message ?? "Enregistrement impossible.") });
      if (j.ok) setTelephone(null);
    } catch {
      setRetourTel({ ok: false, message: "Connexion impossible. Réessayez." });
    } finally {
      setOccupe(null);
    }
  }

  async function changerMdp(e: FormEvent) {
    e.preventDefault();
    setRetourMdp(null);
    if (mdp.nouveau !== mdp.confirmation) return setRetourMdp({ ok: false, message: "La confirmation ne correspond pas au nouveau mot de passe." });
    setOccupe("mdp");
    try {
      const r = await fetch("/api/compte/mot-de-passe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actuel: mdp.actuel, nouveau: mdp.nouveau }) });
      const j = await r.json();
      if (j.identification) void compte.actualiser();
      setRetourMdp({ ok: !!j.ok, message: j.ok ? "Mot de passe modifié." : (j.message ?? "Changement impossible.") });
      if (j.ok) setMdp({ actuel: "", nouveau: "", confirmation: "" });
    } catch {
      setRetourMdp({ ok: false, message: "Connexion impossible. Réessayez." });
    } finally {
      setOccupe(null);
    }
  }

  const message = (r: Retour) =>
    r ? (
      <p role={r.ok ? "status" : "alert"} className={`text-sm font-medium ${r.ok ? "text-indigo" : "text-rouge"}`}>
        {r.message}
      </p>
    ) : null;

  return (
    <CadreEspace profil={profil} titre="Mon compte." deconnecter={() => void compte.deconnecter()}>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-5 border-2 border-ink bg-paper p-5 shadow-hard-sm sm:p-6" aria-labelledby="coordonnees">
          <h2 id="coordonnees" className="font-display text-2xl font-black">
            Mes coordonnées
          </h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="font-mono text-xs tracking-wider uppercase">Nom</dt>
            <dd className="font-semibold">{profil.nom}</dd>
            <dt className="font-mono text-xs tracking-wider uppercase">E-mail</dt>
            <dd>{profil.email}</dd>
            <dt className="font-mono text-xs tracking-wider uppercase">Société</dt>
            <dd>{profil.societe ?? <span className="text-muted">en cours de rattachement</span>}</dd>
          </dl>
          <form onSubmit={enregistrerTelephone} className="space-y-3 border-t-2 border-dashed border-ink pt-5" noValidate>
            <div>
              <label htmlFor="e-tel" className="font-display font-semibold">
                Téléphone / WhatsApp
              </label>
              <input id="e-tel" type="tel" inputMode="tel" autoComplete="tel" value={telephone ?? profil.telephone} onChange={(e) => setTelephone(e.target.value)} className={inputCls} />
            </div>
            {message(retourTel)}
            <button type="submit" disabled={occupe === "tel" || telephone === null} className="btn-presse inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-orange px-5 font-display font-bold text-ink disabled:opacity-50">
              {occupe === "tel" ? <Loader2 aria-hidden className="animate-spin" size={16} /> : null} Enregistrer
            </button>
          </form>
          <p className="text-sm text-muted">Pour changer votre nom, votre e-mail ou votre société, écrivez à info@seritex.ci.</p>
        </section>

        <section className="space-y-4 border-2 border-ink bg-paper p-5 shadow-hard-sm sm:p-6" aria-labelledby="mdp">
          <h2 id="mdp" className="font-display text-2xl font-black">
            Mot de passe
          </h2>
          <form onSubmit={changerMdp} className="space-y-4" noValidate>
            <div>
              <label htmlFor="m-actuel" className="font-display font-semibold">
                Mot de passe actuel
              </label>
              <input id="m-actuel" type="password" autoComplete="current-password" value={mdp.actuel} onChange={(e) => setMdp({ ...mdp, actuel: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label htmlFor="m-nouveau" className="font-display font-semibold">
                Nouveau mot de passe <span className="font-normal text-muted">(8 caractères minimum)</span>
              </label>
              <input id="m-nouveau" type="password" autoComplete="new-password" minLength={8} value={mdp.nouveau} onChange={(e) => setMdp({ ...mdp, nouveau: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label htmlFor="m-conf" className="font-display font-semibold">
                Confirmer le nouveau mot de passe
              </label>
              <input id="m-conf" type="password" autoComplete="new-password" value={mdp.confirmation} onChange={(e) => setMdp({ ...mdp, confirmation: e.target.value })} className={inputCls} required />
            </div>
            {message(retourMdp)}
            <button type="submit" disabled={occupe === "mdp" || !mdp.actuel || !mdp.nouveau} className="btn-presse inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-orange px-5 font-display font-bold text-ink disabled:opacity-50">
              {occupe === "mdp" ? <Loader2 aria-hidden className="animate-spin" size={16} /> : null} Changer mon mot de passe
            </button>
          </form>
          <p className="text-sm text-muted">
            Mot de passe perdu ?{" "}
            <Link href="/espace-client/mot-de-passe-oublie" className="font-semibold underline">
              Recevoir un lien par e-mail
            </Link>
          </p>
        </section>
      </div>
    </CadreEspace>
  );
}
