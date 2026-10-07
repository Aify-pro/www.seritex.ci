"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Download, FileImage, Loader2, Send } from "lucide-react";
import type { ModeleCatalogue } from "@/lib/catalogue-plateforme";
import { validerCoordonnees, type Coordonnees, type ErreursCoordonnees, type FichierDepose, type MarquageEnvoye } from "@/lib/envoi-personnalisation";
import { imageMaquette, pdfMaquette, telecharger, type ContenuMaquette } from "@/lib/maquette";
import { controler, formatCm, getTechnique } from "@/lib/marquage";
import { Apercu, formePour, type MarquageApercu } from "./apercu";
import type { Configuration } from "./etat";
import { libelleEmplacement } from "./etape-marquage";
import { Titre } from "./ui";

type Etat =
  | { kind: "saisie" }
  | { kind: "envoi"; etape: string }
  | { kind: "envoye"; reference: string | null }
  | { kind: "ferme"; message: string }
  | { kind: "erreur"; message: string };

const inputCls =
  "mt-1 block min-h-12 w-full border-2 border-ink bg-paper px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-indigo focus:outline-none aria-[invalid=true]:border-rouge";

export function EtapeEnvoi({
  modele,
  config,
  couleur,
  couleurHex,
  grammage,
  total,
  apercus,
}: {
  modele: ModeleCatalogue;
  config: Configuration;
  couleur: string;
  couleurHex: string;
  grammage: string | null;
  total: number;
  apercus: MarquageApercu[];
}) {
  const face = useRef<SVGSVGElement>(null);
  const dos = useRef<SVGSVGElement>(null);
  const [etat, setEtat] = useState<Etat>({ kind: "saisie" });
  const [erreurs, setErreurs] = useState<ErreursCoordonnees>({});
  const [coord, setCoord] = useState<Coordonnees>({ nom: "", entreprise: "", email: "", telephone: "", date_souhaitee: "", message: "" });
  const [prepa, setPrepa] = useState<"pdf" | "image" | null>(null);

  const forme = formePour(modele.nom, modele.sousFamille);
  const sansCadre = apercus.map((a) => ({ ...a, actif: false }));
  const aDos = sansCadre.some((a) => a.placement.vue === "dos");

  const marquagesDetail = config.marquages.map((m, i) => {
    const alertes = m.logo ? controler(m.logo.analyse, m.technique, m.largeurCm, couleurHex).filter((c) => c.statut !== "ok").map((c) => c.titre) : [];
    return { m, i, alertes, libelle: libelleEmplacement(modele, m.emplacementId) };
  });

  function contenu(reference: string | null = null): ContenuMaquette {
    const vues = [{ titre: "Face", svg: face.current! }, ...(aDos && dos.current ? [{ titre: "Dos", svg: dos.current }] : [])];
    return {
      vues,
      reference,
      client: coord.nom ? [coord.nom, coord.entreprise].filter(Boolean).join(" — ") : undefined,
      article: [
        { libelle: "Article", valeur: modele.nom },
        { libelle: "Couleur", valeur: couleur },
        ...(grammage ? [{ libelle: "Tissu", valeur: grammage }] : []),
        {
          libelle: "Quantité",
          valeur: `${total} pièce(s)${
            config.repartition
              ? ` (${Object.entries(config.repartition)
                  .filter(([, v]) => Number.parseInt(v, 10) > 0)
                  .map(([k, v]) => `${k.split("/").pop()} : ${v}`)
                  .join(", ")})`
              : ", répartition par taille proposée avec le devis"
          }`,
        },
      ],
      marquages: marquagesDetail.map(({ m, i, alertes, libelle }) => ({
        titre: `Marquage ${i + 1} · ${libelle} · ${formatCm(m.largeurCm)} · ${getTechnique(m.technique).label}`,
        details: [
          m.logo ? `Fichier : ${m.logo.nom}` : "Logo à transmettre au conseiller",
          m.logo?.analyse.analysable ? (m.logo.analyse.degrade ? "dégradés détectés" : `${m.logo.analyse.couleurs.length} couleur(s)`) : null,
          m.consigne ? `« ${m.consigne} »` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        logoUrl: m.logo?.apercuUrl ?? null,
        alertes,
      })),
    };
  }

  async function telechargerPdf(reference: string | null = null) {
    setPrepa("pdf");
    try {
      telecharger(await pdfMaquette(contenu(reference)), `maquette-seritex${reference ? `-${reference}` : ""}.pdf`);
    } finally {
      setPrepa(null);
    }
  }

  async function telechargerImage() {
    setPrepa("image");
    try {
      telecharger(await imageMaquette([face.current!, ...(aDos && dos.current ? [dos.current] : [])]), "maquette-seritex.png");
    } finally {
      setPrepa(null);
    }
  }

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const piege = new FormData(e.currentTarget).get("site_web");
    const errs = validerCoordonnees(coord);
    setErreurs(errs);
    if (Object.keys(errs).length) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }

    try {
      setEtat({ kind: "envoi", etape: "Préparation de votre maquette…" });
      const pdf = await pdfMaquette(contenu());

      // Fichiers : chaque logo une seule fois (il peut servir à plusieurs marquages), puis la maquette.
      const logos: { fichier: File; marquage: number }[] = [];
      config.marquages.forEach((m, i) => {
        if (m.logo && !logos.some((l) => l.fichier === m.logo!.fichier)) logos.push({ fichier: m.logo.fichier, marquage: i + 1 });
      });
      const maquette = new File([pdf], "maquette.pdf", { type: "application/pdf" });
      const aEnvoyer = [...logos.map((l) => l.fichier), maquette];

      setEtat({ kind: "envoi", etape: "Envoi de vos fichiers…" });
      const prep = await fetch("/api/personnaliser/preparer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_web: piege, fichiers: aEnvoyer.map((f) => ({ nom: f.name, type: f.type || "application/octet-stream", taille: f.size })) }),
      });
      const p = await prep.json();
      if (p.ferme) return setEtat({ kind: "ferme", message: p.message });
      if (!prep.ok || !p.ok) return setEtat({ kind: "erreur", message: p.message ?? "Envoi impossible pour le moment." });

      const deposes: FichierDepose[] = [];
      for (const [i, f] of aEnvoyer.entries()) {
        const depot = p.depots[i] as { path: string; url: string };
        const res = await fetch(depot.url, { method: "PUT", body: f, headers: { "Content-Type": f.type || "application/octet-stream", "x-upsert": "false" } });
        if (!res.ok) return setEtat({ kind: "erreur", message: `Le fichier « ${f.name} » n'a pas pu être envoyé. Réessayez.` });
        deposes.push(i < logos.length ? { path: depot.path, nom: f.name, role: "logo", marquage: logos[i].marquage } : { path: depot.path, nom: "maquette.pdf", role: "maquette" });
      }

      setEtat({ kind: "envoi", etape: "Transmission à Seritex…" });
      const marquages: MarquageEnvoye[] = marquagesDetail.map(({ m, alertes, libelle }) => ({
        emplacement_id: m.emplacementId,
        emplacement_libelle: libelle,
        largeur_cm: m.largeurCm,
        technique: m.technique,
        technique_libelle: getTechnique(m.technique).label,
        nb_couleurs: m.logo?.analyse.analysable ? m.logo.analyse.couleurs.length : 0,
        degrade: !!m.logo?.analyse.degrade,
        consigne: m.consigne,
        alertes,
      }));
      const res = await fetch("/api/personnaliser/envoyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          envoi_id: p.envoiId,
          coordonnees: coord,
          modele_id: modele.id,
          couleur_id: config.couleurId || null,
          textile_id: config.grammageId,
          quantite: total,
          repartition: config.repartition
            ? Object.fromEntries(Object.entries(config.repartition).map(([k, v]) => [k, Number.parseInt(v, 10) || 0]))
            : null,
          marquages,
          fichiers: deposes,
        }),
      });
      const r = await res.json();
      if (r.ferme) return setEtat({ kind: "ferme", message: r.message });
      if (!res.ok || !r.ok) return setEtat({ kind: "erreur", message: r.message ?? "Envoi impossible pour le moment." });
      setEtat({ kind: "envoye", reference: r.reference ?? null });
    } catch {
      setEtat({ kind: "erreur", message: "Connexion impossible. Vérifiez votre réseau et réessayez : votre composition est conservée." });
    }
  }

  const aria = (k: keyof Coordonnees) => ({
    "aria-invalid": erreurs[k] ? true : undefined,
    "aria-describedby": erreurs[k] ? `${k}-erreur` : undefined,
  });
  const champ = (k: keyof Coordonnees, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`c-${k}`} className="font-display font-semibold">
        {label}
      </label>
      <input
        id={`c-${k}`}
        name={k}
        value={coord[k]}
        onChange={(e) => setCoord({ ...coord, [k]: e.target.value })}
        className={inputCls}
        {...aria(k)}
        {...props}
      />
      {erreurs[k] ? (
        <p id={`${k}-erreur`} role="alert" className="mt-1 text-sm font-medium text-rouge">
          {erreurs[k]}
        </p>
      ) : null}
    </div>
  );

  if (etat.kind === "envoye") {
    return (
      <div role="status" className="space-y-4">
        <CheckCircle2 aria-hidden className="text-indigo" size={48} />
        <h2 className="font-display text-3xl font-black">Composition bien reçue.</h2>
        {etat.reference ? <p className="font-mono text-sm tracking-widest text-rouge uppercase">Référence {etat.reference}</p> : null}
        <p className="text-lg text-muted">
          Votre conseiller Seritex étudie votre maquette et vous recontacte pour le devis. Le BAT vous sera soumis avant toute production.
        </p>
        <button
          type="button"
          onClick={() => void telechargerPdf(etat.reference)}
          className="inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-paper px-5 font-display font-bold"
        >
          <Download aria-hidden size={18} /> Télécharger ma maquette (PDF)
        </button>
        {/* Les vues restent montées pour pouvoir régénérer la maquette. */}
        <div className="sr-only" aria-hidden>
          <Apercu ref={face} vue="face" couleurHex={couleurHex} forme={forme} marquages={sansCadre} />
          {aDos ? <Apercu ref={dos} vue="dos" couleurHex={couleurHex} forme={forme} marquages={sansCadre} /> : null}
        </div>
      </div>
    );
  }

  const occupe = etat.kind === "envoi";

  return (
    <div className="space-y-8">
      <div>
        <Titre>Ma maquette</Titre>
        <p className="mt-1 text-muted">Vérifiez votre composition, téléchargez-la si vous le souhaitez, puis envoyez-la à Seritex. Aucun engagement : vous recevrez un devis.</p>
      </div>

      <div className={`grid gap-3 ${aDos ? "grid-cols-2" : "max-w-xs grid-cols-1"}`}>
        <figure className="border-2 border-ink bg-ecru p-2">
          <Apercu ref={face} vue="face" couleurHex={couleurHex} forme={forme} marquages={sansCadre} />
          <figcaption className="font-mono text-xs tracking-wider uppercase">Face</figcaption>
        </figure>
        {aDos ? (
          <figure className="border-2 border-ink bg-ecru p-2">
            <Apercu ref={dos} vue="dos" couleurHex={couleurHex} forme={forme} marquages={sansCadre} />
            <figcaption className="font-mono text-xs tracking-wider uppercase">Dos</figcaption>
          </figure>
        ) : null}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-2 border-ink bg-ecru p-4 text-sm">
        <dt className="font-mono text-xs tracking-wider uppercase">Article</dt>
        <dd className="font-semibold">{modele.nom}</dd>
        <dt className="font-mono text-xs tracking-wider uppercase">Couleur</dt>
        <dd>{couleur}</dd>
        {grammage ? (
          <>
            <dt className="font-mono text-xs tracking-wider uppercase">Tissu</dt>
            <dd>{grammage}</dd>
          </>
        ) : null}
        <dt className="font-mono text-xs tracking-wider uppercase">Quantité</dt>
        <dd>{total} pièce{total > 1 ? "s" : ""}</dd>
        {marquagesDetail.map(({ m, i, libelle, alertes }) => (
          <div key={m.id} className="contents">
            <dt className="font-mono text-xs tracking-wider uppercase">Marquage {i + 1}</dt>
            <dd>
              {libelle} · {formatCm(m.largeurCm)} · {getTechnique(m.technique).label}
              {m.logo ? ` · ${m.logo.nom}` : " · logo à transmettre"}
              {alertes.length ? <span className="block text-xs text-muted">À vérifier avec votre conseiller : {alertes.join(" ; ")}</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!!prepa || occupe}
          onClick={() => void telechargerPdf()}
          className="inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-paper px-5 font-display font-bold disabled:opacity-50"
        >
          {prepa === "pdf" ? <Loader2 aria-hidden size={18} className="animate-spin" /> : <Download aria-hidden size={18} />} Télécharger le PDF
        </button>
        <button
          type="button"
          disabled={!!prepa || occupe}
          onClick={() => void telechargerImage()}
          className="inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-paper px-5 font-display font-bold disabled:opacity-50"
        >
          {prepa === "image" ? <Loader2 aria-hidden size={18} className="animate-spin" /> : <FileImage aria-hidden size={18} />} Télécharger l&apos;image
        </button>
      </div>

      {etat.kind === "ferme" ? (
        <div role="alert" className="border-2 border-ink bg-orange/15 p-5">
          <p className="font-display text-lg font-bold">{etat.message}</p>
          <p className="mt-2 text-sm text-muted">Votre composition reste affichée : téléchargez-la et joignez-la à votre demande de devis.</p>
          <Link href="/devis" className="mt-4 inline-flex min-h-12 items-center border-2 border-ink bg-orange px-5 font-display font-bold">
            Demander un devis
          </Link>
        </div>
      ) : (
        <form onSubmit={envoyer} noValidate className="space-y-5 border-t-2 border-dashed border-ink pt-6">
          <p className="font-mono text-xs tracking-widest text-rouge uppercase">Vos coordonnées</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {champ("nom", "Nom et prénom *", { autoComplete: "name", required: true })}
            {champ("entreprise", "Entreprise / organisation", { autoComplete: "organization" })}
            {champ("email", "E-mail *", { type: "email", autoComplete: "email", inputMode: "email", required: true })}
            {champ("telephone", "Téléphone / WhatsApp *", { type: "tel", autoComplete: "tel", inputMode: "tel", required: true, placeholder: "+225 07 00 00 00 00" })}
            {champ("date_souhaitee", "Date de livraison souhaitée", { type: "date" })}
          </div>
          <div>
            <label htmlFor="c-message" className="font-display font-semibold">
              Un message pour votre conseiller ?
            </label>
            <textarea
              id="c-message"
              name="message"
              rows={3}
              maxLength={3000}
              value={coord.message}
              onChange={(e) => setCoord({ ...coord, message: e.target.value })}
              className={inputCls}
            />
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
            className="btn-presse inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-orange px-6 font-display text-lg font-bold text-ink disabled:opacity-60"
          >
            {occupe ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden size={18} />}
            {occupe ? etat.etape : "Envoyer à Seritex"}
          </button>
          <p className="text-sm text-muted">
            Vos coordonnées servent uniquement à vous recontacter pour ce projet. Vos fichiers sont transmis à Seritex et ne sont pas publiés.
          </p>
        </form>
      )}
    </div>
  );
}
