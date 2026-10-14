"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Download, FileImage, Lightbulb, Loader2, LogOut, PlusCircle, ShoppingBag } from "lucide-react";
import { slugModele, type ModeleCatalogue } from "@/lib/catalogue-plateforme";
import type { MarquageEnvoye } from "@/lib/envoi-personnalisation";
import { imageMaquette, pdfMaquette, telecharger, type ContenuMaquette } from "@/lib/maquette";
import { controler, debordeDuVetement, decrirePosition, formatCm, getTechnique, rapportMarquage, techniqueAvecArticle } from "@/lib/marquage";
import { couleurSousMarquage, mockupPour, placementDe, viewBoxDe } from "@/lib/gabarit";
import { Apercu, cadragePour, formePour, type MarquageApercu } from "./apercu";
import type { Configuration, Marquage } from "./etat";
import { libelleEmplacement } from "./etape-marquage";
import { Titre } from "./ui";
import { Identification } from "@/components/compte/identification";
import { useCompte } from "@/components/compte/use-compte";
import { effacerBrouillon, versStocke } from "./brouillon";
import { ajouterAuPanier, type ArticlePanier } from "./panier";

type Etat =
  | { kind: "saisie" }
  | { kind: "ajout"; etape: string }
  | { kind: "ajoute" }
  | { kind: "erreur"; message: string };

export function EtapeEnvoi({
  modele,
  config,
  couleur,
  couleurHex,
  grammage,
  total,
  apercus,
  couleursZonesHex,
  setMarquages,
}: {
  modele: ModeleCatalogue;
  config: Configuration;
  couleur: string;
  couleurHex: string;
  grammage: string | null;
  total: number;
  apercus: MarquageApercu[];
  couleursZonesHex: Record<string, string>;
  setMarquages: (m: Marquage[]) => void;
}) {
  const face = useRef<SVGSVGElement>(null);
  const dos = useRef<SVGSVGElement>(null);
  // Gros plans cotés, un par marquage (pour la page et le PDF).
  const zooms = useRef(new Map<string, SVGSVGElement>());
  const [etat, setEtat] = useState<Etat>({ kind: "saisie" });
  const [prepa, setPrepa] = useState<"pdf" | "image" | null>(null);
  const compte = useCompte();
  const profil = compte.profil;

  const router = useRouter();

  const forme = formePour(modele.nom, modele.sousFamille);
  const sansCadre = apercus.map((a) => ({ ...a, actif: false }));
  const aDos = sansCadre.some((a) => a.placement.vue === "dos");

  const premium = forme === "polo";
  // « Col : Rouge vif · Manche gauche : Blanc… » quand le client a personnalisé les zones.
  const couleursParZone = config.couleursZones
    ? modele.zonesCouleur
        .map((z) => `${z.libelle} : ${modele.couleurs.find((c) => c.id === config.couleursZones?.[z.cle])?.nom ?? couleur}`)
        .join(" · ")
    : null;
  const marquagesDetail = config.marquages.map((m, i) => {
    const alertes = m.logo ? controler(m.logo.analyse, m.technique, m.largeurCm, couleurHex).filter((c) => c.statut !== "ok").map((c) => c.titre) : [];
    const libelle = libelleEmplacement(modele, m.emplacementId);
    const placement = placementDe(modele, m.emplacementId);
    const vue = placement.vue;
    // « Poitrine — avant » ; inutile quand l'emplacement le dit déjà (« Dos », « Manche D », « Nuque »).
    const emplacement = /manche|dos|nuque/i.test(libelle) ? libelle : `${libelle} — ${vue === "face" ? "avant" : "dos"}`;
    const ratio = m.logo?.analyse.analysable ? m.logo.analyse.ratio : 0.6;
    const dimensions = `${formatCm(m.largeurCm)} × ${formatCm(Math.round(m.largeurCm * ratio * 10) / 10)}`;
    const rapport = m.logo
      ? rapportMarquage(m.logo.analyse, {
          technique: m.technique,
          largeurCm: m.largeurCm,
          quantite: total,
          // Couleurs par zone : le tissu réellement sous le visuel (corps avant ou arrière).
          couleurTextile: couleurSousMarquage(modele, vue, config.couleurId, config.couleursZones),
          premium,
          formatHabituelCm: placement.maxCm,
          deborde: debordeDuVetement(placement, m.largeurCm, m.logo.analyse.analysable ? m.logo.analyse.ratio : 0.6, m.dxCm, m.dyCm, m.rotation),
        })
      : null;
    const apercu = sansCadre.find((a) => a.id === m.id) ?? null;
    return { m, i, alertes, libelle, emplacement, dimensions, rapport, apercu };
  });

  /** Gros plans cotés, montés dans la page (et gardés après l'envoi pour régénérer le PDF). */
  const grosPlans = (cache = false) =>
    marquagesDetail.map(({ m, apercu }) =>
      apercu ? (
        <div key={m.id} className={cache ? "sr-only" : undefined} aria-hidden={cache || undefined}>
          <Apercu
            ref={(el) => {
              if (el) zooms.current.set(m.id, el);
              else zooms.current.delete(m.id);
            }}
            vue={apercu.placement.vue}
            couleurHex={couleurHex}
            mockup={mockupPour(modele, apercu.placement.vue)}
            couleursZones={couleursZonesHex}
            forme={forme}
            marquages={sansCadre}
            cadrage={cadragePour(apercu, viewBoxDe(mockupPour(modele, apercu.placement.vue)))}
            cotes
          />
        </div>
      ) : null,
    );

  function contenu(reference: string | null = null): ContenuMaquette {
    const vues = [{ titre: "Avant", svg: face.current! }, ...(aDos && dos.current ? [{ titre: "Dos", svg: dos.current }] : [])];
    return {
      vues,
      reference,
      client: profil ? [profil.nom, profil.entreprise].filter(Boolean).join(" — ") : undefined,
      couleurTextile: { nom: couleur, hex: couleurHex },
      article: [
        { libelle: "Article", valeur: modele.nom },
        { libelle: "Couleur", valeur: couleur },
        ...(couleursParZone ? [{ libelle: "Couleurs par zone", valeur: couleursParZone }] : []),
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
      marquages: marquagesDetail.map(({ m, i, emplacement, dimensions, rapport }) => ({
        numero: i + 1,
        emplacement,
        zoom: zooms.current.get(m.id) ?? null,
        fichier: m.logo?.nom ?? null,
        dimensions,
        technique: getTechnique(m.technique).label,
        position: decrirePosition(m.dxCm, m.dyCm, m.rotation) || null,
        consigne: m.consigne || null,
        rapport,
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

  /** Range l'article dans le panier (maquette PDF et logos compris) ; `valider` ouvre ensuite la page panier pour envoyer la demande. */
  async function ajouter(valider: boolean) {
    try {
      setEtat({ kind: "ajout", etape: "Préparation de votre maquette…" });
      const pdf = await pdfMaquette(contenu());
      const apercu = await imageMaquette([face.current!, ...(aDos && dos.current ? [dos.current] : [])]).catch(() => null);

      // Chaque logo une seule fois (il peut servir à plusieurs marquages).
      const logos: { fichier: File; marquage: number }[] = [];
      config.marquages.forEach((m, i) => {
        if (m.logo && !logos.some((l) => l.fichier === m.logo!.fichier)) logos.push({ fichier: m.logo.fichier, marquage: i + 1 });
      });
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
        decalage_x_cm: m.dxCm,
        decalage_y_cm: m.dyCm,
        rotation_deg: m.rotation,
      }));

      const article: Omit<ArticlePanier, "id" | "ajouteLe"> = {
        modeleId: modele.id,
        slug: slugModele(modele),
        nom: modele.nom,
        resume: {
          couleur,
          couleurHex,
          grammage,
          quantite: total,
          marquages: marquagesDetail.map(({ m, emplacement, dimensions }) => `${emplacement} · ${dimensions} · ${getTechnique(m.technique).label}`),
        },
        config: versStocke(config),
        etape: 2,
        envoi: {
          modele_id: modele.id,
          couleur_id: config.couleurId || null,
          couleurs_zones: config.couleursZones,
          textile_id: config.grammageId,
          quantite: total,
          repartition: config.repartition ? Object.fromEntries(Object.entries(config.repartition).map(([k, v]) => [k, Number.parseInt(v, 10) || 0])) : null,
          marquages,
        },
        logos,
        maquette: pdf,
        apercu,
      };
      if (!(await ajouterAuPanier(article))) {
        return setEtat({ kind: "erreur", message: "Votre navigateur ne permet pas de conserver le panier (navigation privée ?). Téléchargez votre maquette et joignez-la à une demande de devis." });
      }
      await effacerBrouillon(modele.id);
      if (valider) return router.push("/e-shop/panier");
      setEtat({ kind: "ajoute" });
    } catch {
      setEtat({ kind: "erreur", message: "L'article n'a pas pu être ajouté. Réessayez : votre composition est conservée." });
    }
  }

  const occupe = etat.kind === "ajout";

  return (
    <div className="space-y-8">
      <div>
        <Titre>Ma maquette</Titre>
        <p className="mt-1 text-muted">
          Votre composition, zone par zone, avec notre analyse de votre logo. Téléchargez-la si vous le souhaitez, puis envoyez-la à Seritex. Aucun
          engagement : vous recevrez un devis.
        </p>
      </div>

      <div className={`grid gap-3 ${aDos ? "grid-cols-2" : "max-w-xs grid-cols-1"}`}>
        <figure className="border-2 border-ink bg-ecru p-2">
          <Apercu ref={face} vue="face" couleurHex={couleurHex} forme={forme} marquages={sansCadre} mockup={mockupPour(modele, "face")} couleursZones={couleursZonesHex} />
          <figcaption className="font-mono text-xs tracking-wider uppercase">Avant</figcaption>
        </figure>
        {aDos ? (
          <figure className="border-2 border-ink bg-ecru p-2">
            <Apercu ref={dos} vue="dos" couleurHex={couleurHex} forme={forme} marquages={sansCadre} mockup={mockupPour(modele, "dos")} couleursZones={couleursZonesHex} />
            <figcaption className="font-mono text-xs tracking-wider uppercase">Dos</figcaption>
          </figure>
        ) : null}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-2 border-ink bg-ecru p-4 text-sm">
        <dt className="font-mono text-xs tracking-wider uppercase">Article</dt>
        <dd className="font-semibold">{modele.nom}</dd>
        <dt className="font-mono text-xs tracking-wider uppercase">Couleur</dt>
        <dd>{couleur}</dd>
        {couleursParZone ? (
          <>
            <dt className="font-mono text-xs tracking-wider uppercase">Par zone</dt>
            <dd>{couleursParZone}</dd>
          </>
        ) : null}
        {grammage ? (
          <>
            <dt className="font-mono text-xs tracking-wider uppercase">Tissu</dt>
            <dd>{grammage}</dd>
          </>
        ) : null}
        <dt className="font-mono text-xs tracking-wider uppercase">Quantité</dt>
        <dd>{total} pièce{total > 1 ? "s" : ""}</dd>
      </dl>

      {marquagesDetail.map(({ m, i, emplacement, dimensions, rapport }, k) => (
        <section key={m.id} className="border-2 border-ink bg-paper shadow-hard-sm">
          <header className="flex flex-wrap items-baseline gap-3 border-b-2 border-ink bg-ecru px-4 py-3">
            <span className="bg-indigo px-2 py-1 font-mono text-xs tracking-wider text-white uppercase">Marquage {i + 1}</span>
            <h3 className="font-display text-xl font-black">{emplacement}</h3>
            <span className="font-mono text-xs text-muted">
              {dimensions} · {getTechnique(m.technique).label}
            </span>
          </header>
          <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <figure>
              <div className="border-2 border-ink bg-ecru">{grosPlans()[k]}</div>
              <figcaption className="mt-2 space-y-0.5 text-xs text-muted">
                <span className="block">Gros plan coté · {m.logo ? m.logo.nom : "logo à transmettre"}</span>
                {decrirePosition(m.dxCm, m.dyCm, m.rotation) ? <span className="block">{decrirePosition(m.dxCm, m.dyCm, m.rotation)}</span> : null}
                {m.consigne ? <span className="block">« {m.consigne} »</span> : null}
              </figcaption>
            </figure>
            <div className="space-y-4 text-sm leading-relaxed">
              <p className="font-mono text-xs tracking-widest text-rouge uppercase">Notre analyse</p>
              {!rapport ? (
                <p>Pas de logo déposé pour ce marquage : votre conseiller vous le demandera.</p>
              ) : (
                <>
                  <p>{rapport.constat}</p>
                  {rapport.couleurs.length ? (
                    <div>
                      <p className="font-display font-bold">{rapport.degrade ? "Teintes principales du dégradé" : `Couleurs détectées : ${rapport.couleurs.length}`}</p>
                      <p className="mt-2 flex flex-wrap gap-3">
                        {rapport.couleurs.map((h) => (
                          <span key={h} className="flex flex-col items-center gap-1">
                            <span className="size-7 rounded-full border-2 border-ink" style={{ background: h }} />
                            <span className="font-mono text-[10px] text-muted">{h}</span>
                          </span>
                        ))}
                      </p>
                    </div>
                  ) : null}
                  {/* La technique choisie par le client, appliquée à son logo. */}
                  <div className={`border-2 border-ink p-4 ${rapport.choix.id === rapport.conseil.id ? "bg-orange/15" : "bg-ecru"}`}>
                    <p className="flex flex-wrap items-center gap-2 font-display text-lg font-black">
                      <Check aria-hidden size={20} className="text-indigo" /> Votre choix : {rapport.choix.label}
                      {rapport.choix.id === rapport.conseil.id ? (
                        <span className="bg-orange px-2 py-0.5 font-mono text-[10px] tracking-wider text-ink uppercase">aussi notre conseil</span>
                      ) : null}
                    </p>
                    <p className="mt-1">{rapport.choix.realisation}</p>
                    {rapport.choix.id === rapport.conseil.id ? (
                      <p className="mt-2">{rapport.conseil.pourquoi}</p>
                    ) : rapport.choix.atouts.length ? (
                      <ul className="mt-2 list-disc space-y-0.5 pl-5">
                        {rapport.choix.atouts.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    ) : null}
                    {rapport.choix.limites.length ? (
                      <div className="mt-2">
                        <p className="font-display font-bold text-rouge">Ses limites avec ce logo</p>
                        <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                          {rapport.choix.limites.map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  {rapport.choix.id !== rapport.conseil.id ? (
                    <div className="border-2 border-ink bg-orange/15 p-4">
                      <p className="flex items-center gap-2 font-display text-lg font-black">
                        <Lightbulb aria-hidden size={20} className="text-orange" /> Notre conseil : {rapport.conseil.label}
                      </p>
                      <p className="mt-1">{rapport.conseil.pourquoi}</p>
                      {rapport.remarqueChoix ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3 border-t-2 border-dashed border-ink pt-3">
                          <p className="flex-1 text-indigo">{rapport.remarqueChoix}</p>
                          <button
                            type="button"
                            onClick={() => setMarquages(config.marquages.map((x) => (x.id === m.id ? { ...x, technique: rapport.conseil.id } : x)))}
                            className="min-h-11 border-2 border-ink bg-paper px-4 font-display text-sm font-bold"
                          >
                            Retenir {techniqueAvecArticle(rapport.conseil.id)}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {rapport.alternatives.length ? (
                    <div>
                      <p className="font-display font-bold">Et les autres techniques ?</p>
                      <ul className="mt-1 space-y-1 text-muted">
                        {rapport.alternatives.map((alt) => (
                          <li key={alt.id}>
                            <strong className="font-semibold text-ink">{alt.label}</strong> — {alt.avis}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {rapport.aVerifier.length ? (
                    <div>
                      <p className="flex items-center gap-2 font-display font-bold text-rouge">
                        <AlertTriangle aria-hidden size={16} /> À vérifier avec votre conseiller
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {rapport.aVerifier.map((v) => (
                          <li key={v}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>
      ))}

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

      {!compte.charge ? (
        <p className="border-t-2 border-dashed border-ink pt-6 text-muted" role="status">
          <Loader2 aria-hidden className="mr-2 inline animate-spin" size={16} /> Vérification de votre identification…
        </p>
      ) : !profil ? (
        compte.disponible ? (
          <Identification retour={typeof window === "undefined" ? "/e-shop" : window.location.pathname} onConnecte={compte.connecte} />
        ) : (
          <div role="alert" className="border-2 border-ink bg-orange/15 p-5">
            <p className="font-display text-lg font-bold">L&apos;envoi en ligne est momentanément indisponible.</p>
            <p className="mt-2 text-sm text-muted">Téléchargez votre maquette et joignez-la à votre demande de devis.</p>
            <Link href="/devis" className="mt-4 inline-flex min-h-12 items-center border-2 border-ink bg-orange px-5 font-display font-bold">
              Demander un devis
            </Link>
          </div>
        )
      ) : etat.kind === "ajoute" ? (
        <div role="status" className="space-y-4 border-2 border-ink bg-orange/15 p-5">
          <CheckCircle2 aria-hidden className="text-indigo" size={40} />
          <h3 className="font-display text-2xl font-black">Article ajouté à votre panier.</h3>
          <p>Vous pouvez en ajouter d&apos;autres : toute votre sélection partira dans une seule demande de devis.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/e-shop" className="inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-paper px-5 font-display font-bold">
              <PlusCircle aria-hidden size={18} /> Ajouter un autre article
            </Link>
            <Link href="/e-shop/panier" className="btn-presse inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-orange px-5 font-display font-bold text-ink">
              <ShoppingBag aria-hidden size={18} /> Voir mon panier et valider
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 border-t-2 border-dashed border-ink pt-6">
          <p className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>
              Connecté : <strong>{profil.email}</strong>
            </span>
            <button type="button" onClick={() => void compte.deconnecter()} className="inline-flex min-h-9 items-center gap-1 border-2 border-ink bg-paper px-3 font-display text-xs font-bold">
              <LogOut aria-hidden size={14} /> Changer de compte
            </button>
          </p>
          {etat.kind === "erreur" ? (
            <p role="alert" className="font-medium text-rouge">
              {etat.message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={occupe || !!prepa}
              onClick={() => void ajouter(false)}
              className="inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-paper px-6 font-display text-lg font-bold disabled:opacity-60"
            >
              {occupe ? <Loader2 aria-hidden className="animate-spin" /> : <PlusCircle aria-hidden size={18} />}
              {occupe ? etat.etape : "Ajouter au panier"}
            </button>
            <button
              type="button"
              disabled={occupe || !!prepa}
              onClick={() => void ajouter(true)}
              className="btn-presse inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-orange px-6 font-display text-lg font-bold text-ink disabled:opacity-60"
            >
              <ShoppingBag aria-hidden size={18} /> Valider ma demande
            </button>
          </div>
          <p className="text-sm text-muted">
            Ajoutez autant d&apos;articles que vous voulez : une seule demande, un seul devis. Aucun engagement, le BAT vous est soumis avant toute production.
          </p>
        </div>
      )}
    </div>
  );
}
