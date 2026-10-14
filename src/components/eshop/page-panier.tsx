"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Download, Loader2, LogOut, Pencil, PlusCircle, Send, Trash2 } from "lucide-react";
import { Identification } from "@/components/compte/identification";
import { useCompte } from "@/components/compte/use-compte";
import { ecrireBrouillon } from "@/components/personnaliser/brouillon";
import { EVENEMENT_PANIER, lirePanier, retirerDuPanier, viderPanier, type ArticlePanier } from "@/components/personnaliser/panier";
import { FICHIERS_MAX, validerCoordonnees, type Coordonnees, type ErreursCoordonnees, type FichierDepose } from "@/lib/envoi-personnalisation";
import { telecharger } from "@/lib/maquette";

const inputCls =
  "mt-1 block min-h-12 w-full border-2 border-ink bg-paper px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-indigo focus:outline-none aria-[invalid=true]:border-rouge";

type Etat =
  | { kind: "saisie" }
  | { kind: "envoi"; etape: string }
  | { kind: "envoye"; reference: string | null; articles: ArticlePanier[] }
  | { kind: "erreur"; message: string };

/** Miniature d'un article (aperçu PNG gardé dans le navigateur). */
function Miniature({ blob, nom }: { blob: Blob | null; nom: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    // Création de l'adresse locale de l'image (système externe) : mise à jour d'état légitime.
    const t = setTimeout(() => setUrl(u), 0);
    return () => {
      clearTimeout(t);
      URL.revokeObjectURL(u);
    };
  }, [blob]);
  return (
    <div className="grid aspect-[4/3] w-full place-items-center border-2 border-ink bg-ecru">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt={`Aperçu : ${nom}`} className="max-h-full max-w-full object-contain" /> : null}
    </div>
  );
}

export function PagePanier() {
  const router = useRouter();
  const compte = useCompte();
  const profil = compte.profil;
  const [articles, setArticles] = useState<ArticlePanier[] | null>(null);
  const [etat, setEtat] = useState<Etat>({ kind: "saisie" });
  const [erreurs, setErreurs] = useState<ErreursCoordonnees>({});
  const [coord, setCoord] = useState<Pick<Coordonnees, "nom" | "entreprise" | "telephone" | "date_souhaitee" | "message">>({
    nom: "",
    entreprise: "",
    telephone: "",
    date_souhaitee: "",
    message: "",
  });

  const charger = useCallback(() => void lirePanier().then(setArticles), []);
  useEffect(() => {
    charger();
    window.addEventListener(EVENEMENT_PANIER, charger);
    return () => window.removeEventListener(EVENEMENT_PANIER, charger);
  }, [charger]);

  // Coordonnées : celles du compte, complétées par ce que la personne a saisi.
  const coordonnees: Coordonnees = {
    nom: coord.nom || profil?.nom || "",
    entreprise: coord.entreprise || profil?.entreprise || "",
    email: profil?.email ?? "",
    telephone: coord.telephone || profil?.telephone || "",
    date_souhaitee: coord.date_souhaitee,
    message: coord.message,
  };

  async function modifier(a: ArticlePanier) {
    await ecrireBrouillon(a.modeleId, a.config, a.etape);
    await retirerDuPanier(a.id);
    router.push(`/e-shop/${a.slug}`);
  }

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!articles?.length) return;
    const piege = new FormData(e.currentTarget).get("site_web");
    const errs = validerCoordonnees(coordonnees);
    setErreurs(errs);
    if (Object.keys(errs).length) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }

    // Tous les fichiers de la demande : logos et maquette PDF de chaque article.
    const aEnvoyer: { fichier: File; role: "logo" | "maquette"; marquage?: number; article: number }[] = [];
    articles.forEach((a, i) => {
      for (const l of a.logos) aEnvoyer.push({ fichier: l.fichier, role: "logo", marquage: l.marquage, article: i + 1 });
      aEnvoyer.push({ fichier: new File([a.maquette], `maquette-article-${i + 1}.pdf`, { type: "application/pdf" }), role: "maquette", article: i + 1 });
    });
    if (aEnvoyer.length > FICHIERS_MAX) {
      return setEtat({ kind: "erreur", message: "Votre panier contient trop de fichiers : envoyez cette demande, puis créez-en une seconde pour le reste." });
    }

    try {
      setEtat({ kind: "envoi", etape: "Envoi de vos fichiers…" });
      const prep = await fetch("/api/personnaliser/preparer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_web: piege, fichiers: aEnvoyer.map((f) => ({ nom: f.fichier.name, type: f.fichier.type || "application/octet-stream", taille: f.fichier.size })) }),
      });
      const p = await prep.json();
      if (p.identification) {
        void compte.actualiser();
        return setEtat({ kind: "erreur", message: p.message });
      }
      if (!prep.ok || !p.ok) return setEtat({ kind: "erreur", message: p.message ?? "Envoi impossible pour le moment." });

      const deposes: FichierDepose[] = [];
      for (const [i, f] of aEnvoyer.entries()) {
        const depot = p.depots[i] as { path: string; url: string };
        const res = await fetch(depot.url, { method: "PUT", body: f.fichier, headers: { "Content-Type": f.fichier.type || "application/octet-stream", "x-upsert": "false" } });
        if (!res.ok) return setEtat({ kind: "erreur", message: `Le fichier « ${f.fichier.name} » n'a pas pu être envoyé. Réessayez.` });
        deposes.push({ path: depot.path, nom: f.fichier.name, role: f.role, article: f.article, ...(f.marquage ? { marquage: f.marquage } : {}) });
      }

      setEtat({ kind: "envoi", etape: "Transmission à Seritex…" });
      const res = await fetch("/api/personnaliser/envoyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envoi_id: p.envoiId, coordonnees, articles: articles.map((a) => a.envoi), fichiers: deposes }),
      });
      const r = await res.json();
      if (r.ferme) return setEtat({ kind: "erreur", message: r.message });
      if (r.identification) {
        void compte.actualiser();
        return setEtat({ kind: "erreur", message: r.message });
      }
      if (!res.ok || !r.ok) return setEtat({ kind: "erreur", message: r.message ?? "Envoi impossible pour le moment." });

      const envoyes = articles;
      await viderPanier();
      setEtat({ kind: "envoye", reference: r.reference ?? null, articles: envoyes });
    } catch {
      setEtat({ kind: "erreur", message: "Connexion impossible. Vérifiez votre réseau et réessayez : votre panier est conservé." });
    }
  }

  if (etat.kind === "envoye") {
    return (
      <div role="status" className="max-w-2xl space-y-4 border-2 border-ink bg-paper p-6 shadow-hard sm:p-8">
        <CheckCircle2 aria-hidden className="text-indigo" size={48} />
        <h2 className="font-display text-3xl font-black">Demande bien reçue.</h2>
        {etat.reference ? <p className="font-mono text-sm tracking-widest text-rouge uppercase">Référence {etat.reference}</p> : null}
        <p className="text-lg text-muted">
          Votre conseiller Seritex étudie vos {etat.articles.length} article{etat.articles.length > 1 ? "s" : ""} et vous recontacte pour le devis. Le BAT vous sera soumis avant
          toute production.
        </p>
        <div className="flex flex-wrap gap-3">
          {etat.articles.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => telecharger(a.maquette, `maquette-seritex${etat.reference ? `-${etat.reference}` : ""}-${i + 1}.pdf`)}
              className="inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-paper px-5 font-display font-bold"
            >
              <Download aria-hidden size={18} /> Maquette : {a.nom}
            </button>
          ))}
        </div>
        <Link href="/e-shop" className="inline-flex min-h-12 items-center border-2 border-ink bg-orange px-5 font-display font-bold text-ink">
          Retour à l&apos;e-shop
        </Link>
      </div>
    );
  }

  if (articles === null) {
    return (
      <p role="status" className="text-muted">
        <Loader2 aria-hidden className="mr-2 inline animate-spin" size={16} /> Chargement de votre panier…
      </p>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="max-w-xl space-y-4 border-2 border-ink bg-paper p-6 shadow-hard">
        <p className="font-display text-2xl font-black">Votre panier est vide.</p>
        <p className="text-muted">Composez un article avec votre logo, puis ajoutez-le au panier : vous pourrez en ajouter d&apos;autres et envoyer une seule demande.</p>
        <Link href="/e-shop" className="btn-presse inline-flex min-h-12 items-center border-2 border-ink bg-orange px-5 font-display font-bold text-ink">
          Choisir un article
        </Link>
      </div>
    );
  }

  const total = articles.reduce((s, a) => s + a.resume.quantite, 0);
  const occupe = etat.kind === "envoi";
  const champ = (k: keyof typeof coord | "email", label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`p-${k}`} className="font-display font-semibold">
        {label}
      </label>
      <input
        id={`p-${k}`}
        name={k}
        value={coordonnees[k]}
        onChange={(e) => k !== "email" && setCoord({ ...coord, [k]: e.target.value })}
        className={inputCls}
        aria-invalid={erreurs[k] ? true : undefined}
        aria-describedby={erreurs[k] ? `p-${k}-erreur` : undefined}
        {...props}
      />
      {erreurs[k] ? (
        <p id={`p-${k}-erreur`} role="alert" className="mt-1 text-sm font-medium text-rouge">
          {erreurs[k]}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <ul className="space-y-4 lg:col-span-7" aria-label="Articles du panier">
        {articles.map((a, i) => (
          <li key={a.id} className="grid gap-4 border-2 border-ink bg-paper p-4 shadow-hard-sm sm:grid-cols-[10rem_1fr]">
            <Miniature blob={a.apercu} nom={a.nom} />
            <div className="space-y-2">
              <p className="font-mono text-xs tracking-wider text-rouge uppercase">Article {i + 1}</p>
              <h2 className="font-display text-2xl font-black">{a.nom}</h2>
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 border border-ink bg-paper px-2 py-1">
                  <span aria-hidden className="size-3.5 rounded-full border border-ink" style={{ background: a.resume.couleurHex }} />
                  {a.resume.couleur}
                </span>
                {a.resume.grammage ? <span className="border border-ink bg-paper px-2 py-1">{a.resume.grammage}</span> : null}
                <span className="border border-ink bg-paper px-2 py-1">
                  {a.resume.quantite} pièce{a.resume.quantite > 1 ? "s" : ""}
                </span>
              </p>
              {a.resume.marquages.length ? (
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted">
                  {a.resume.marquages.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Sans marquage : article uni.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={occupe}
                  onClick={() => void modifier(a)}
                  className="inline-flex min-h-11 items-center gap-1.5 border-2 border-ink bg-paper px-4 font-display text-sm font-bold disabled:opacity-50"
                >
                  <Pencil aria-hidden size={16} /> Modifier
                </button>
                <button
                  type="button"
                  disabled={occupe}
                  onClick={() => void retirerDuPanier(a.id)}
                  className="inline-flex min-h-11 items-center gap-1.5 border-2 border-ink bg-paper px-4 font-display text-sm font-bold text-rouge disabled:opacity-50"
                >
                  <Trash2 aria-hidden size={16} /> Retirer
                </button>
              </div>
            </div>
          </li>
        ))}
        <li>
          <Link href="/e-shop" className="inline-flex min-h-12 items-center gap-2 border-2 border-dashed border-ink px-5 font-display font-bold hover:bg-ecru-dark">
            <PlusCircle aria-hidden size={18} /> Ajouter un autre article
          </Link>
        </li>
      </ul>

      <aside className="lg:col-span-5">
        <div className="space-y-5 border-2 border-ink bg-paper p-5 shadow-hard sm:p-6 lg:sticky lg:top-24">
          <div>
            <p className="font-mono text-xs tracking-widest text-rouge uppercase">Votre demande</p>
            <p className="mt-1 font-display text-2xl font-black">
              {articles.length} article{articles.length > 1 ? "s" : ""} · {total} pièce{total > 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-sm text-muted">Une seule demande, un seul devis. Aucun prix en ligne et aucun engagement : le devis vous est envoyé par votre conseiller.</p>
          </div>

          {!compte.charge ? (
            <p className="text-muted" role="status">
              <Loader2 aria-hidden className="mr-2 inline animate-spin" size={16} /> Vérification de votre identification…
            </p>
          ) : !profil ? (
            compte.disponible ? (
              <Identification retour="/e-shop/panier" onConnecte={compte.connecte} />
            ) : (
              <div role="alert" className="border-2 border-ink bg-orange/15 p-4">
                <p className="font-display font-bold">L&apos;envoi en ligne est momentanément indisponible.</p>
                <Link href="/devis" className="mt-3 inline-flex min-h-11 items-center border-2 border-ink bg-orange px-4 font-display font-bold">
                  Demander un devis
                </Link>
              </div>
            )
          ) : (
            <form onSubmit={envoyer} noValidate className="space-y-4">
              <p className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  Connecté : <strong>{profil.email}</strong>
                </span>
                <button type="button" onClick={() => void compte.deconnecter()} className="inline-flex min-h-9 items-center gap-1 border-2 border-ink bg-paper px-3 font-display text-xs font-bold">
                  <LogOut aria-hidden size={14} /> Changer de compte
                </button>
              </p>
              {champ("nom", "Nom et prénom *", { autoComplete: "name", required: true })}
              {champ("entreprise", "Entreprise / organisation", { autoComplete: "organization" })}
              {champ("telephone", "Téléphone / WhatsApp *", { type: "tel", autoComplete: "tel", inputMode: "tel", required: true, placeholder: "+225 07 00 00 00 00" })}
              {champ("date_souhaitee", "Date de livraison souhaitée", { type: "date" })}
              <div>
                <label htmlFor="p-message" className="font-display font-semibold">
                  Un message pour votre conseiller ?
                </label>
                <textarea id="p-message" name="message" rows={3} maxLength={3000} value={coord.message} onChange={(e) => setCoord({ ...coord, message: e.target.value })} className={inputCls} />
              </div>
              {/* Champ piège pour les robots : invisible pour un humain. */}
              <div aria-hidden className="absolute -left-[9999px]" tabIndex={-1}>
                <label>
                  Site web <input name="site_web" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              {etat.kind === "erreur" ? (
                <p role="alert" className="font-medium text-rouge">
                  {etat.message}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={occupe}
                className="btn-presse inline-flex min-h-12 w-full items-center justify-center gap-2 border-2 border-ink bg-orange px-6 font-display text-lg font-bold text-ink disabled:opacity-60"
              >
                {occupe ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden size={18} />}
                {occupe ? etat.etape : `Envoyer ma demande (${articles.length} article${articles.length > 1 ? "s" : ""})`}
              </button>
              <p className="text-sm text-muted">Vos coordonnées servent uniquement à vous recontacter pour ce projet. Vos fichiers sont transmis à Seritex et ne sont pas publiés.</p>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}
