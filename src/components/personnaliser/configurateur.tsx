"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ModeleCatalogue } from "@/lib/catalogue-plateforme";
import { placementPour, type Vue } from "@/lib/marquage";
import { Apercu, formePour, type MarquageApercu } from "./apercu";
import { configurationInitiale, quantiteTotale, type Configuration, type Marquage } from "./etat";
import { EtapeArticle } from "./etape-article";
import { EtapeControles } from "./etape-controles";
import { EtapeEnvoi } from "./etape-envoi";
import { EtapeMarquage } from "./etape-marquage";

const ETAPES = ["Couleur & quantité", "Logo & emplacement", "Contrôles", "Ma maquette"] as const;

/** Parcours de personnalisation d'un article de l'e-shop (fiche article). */
export function Configurateur({ modele }: { modele: ModeleCatalogue }) {
  const [config, setConfig] = useState<Configuration>(() => configurationInitiale(modele));
  const [etape, setEtape] = useState(0);
  const [vue, setVue] = useState<Vue>("face");
  const [actifId, setActifId] = useState(config.marquages[0]?.id ?? "");
  const haut = useRef<HTMLDivElement>(null);

  function allerA(i: number) {
    setEtape(i);
    haut.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const couleur = modele.couleurs.find((c) => c.id === config.couleurId) ?? null;
  const grammage = modele.grammages.find((g) => g.id === config.grammageId) ?? null;
  const couleurHex = couleur?.hex ?? "#FFFFFF";
  const total = quantiteTotale(config);
  const quantiteManquante = total < 1;
  const photos = modele.medias.filter((p) => p.couleurId === null || p.couleurId === config.couleurId);

  const modifier = (patch: Partial<Configuration>) => setConfig((c) => ({ ...c, ...patch }));

  function setMarquages(marquages: Marquage[]) {
    modifier({ marquages });
    // L'aperçu suit l'emplacement du marquage en cours de modification.
    const actif =
      marquages.length > config.marquages.length ? marquages[marquages.length - 1] : (marquages.find((m) => m.id === actifId) ?? marquages[0]);
    const z = actif && modele.emplacements.find((e) => e.id === actif.emplacementId);
    if (z) setVue(placementPour(z.cle, z.libelle).vue);
  }

  function setActif(id: string) {
    setActifId(id);
    const m = config.marquages.find((x) => x.id === id);
    const z = m && modele.emplacements.find((e) => e.id === m.emplacementId);
    if (z) setVue(placementPour(z.cle, z.libelle).vue);
  }

  const apercus: MarquageApercu[] = config.marquages.flatMap((m) => {
    const z = modele.emplacements.find((e) => e.id === m.emplacementId);
    if (!z) return [];
    return [
      {
        id: m.id,
        placement: placementPour(z.cle, z.libelle),
        largeurCm: m.largeurCm,
        ratio: m.logo?.analyse.analysable ? m.logo.analyse.ratio : 0.6,
        apercuUrl: m.logo?.apercuUrl ?? null,
        actif: etape === 1 && m.id === actifId,
      },
    ];
  });


  return (
    <div ref={haut} className="scroll-mt-24">
      <ol className="flex flex-wrap gap-2" aria-label="Étapes">
        {ETAPES.map((nom, i) => (
          <li key={nom}>
            <button
              type="button"
              onClick={() => allerA(i)}
              disabled={i > 0 && quantiteManquante}
              aria-current={i === etape ? "step" : undefined}
              className={`inline-flex min-h-11 items-center gap-2 border-2 border-ink px-4 font-display text-sm font-bold ${
                i === etape ? "bg-indigo text-white shadow-hard-sm" : "bg-paper"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className={`grid size-6 place-items-center rounded-full text-xs ${i === etape ? "bg-orange text-ink" : "bg-ecru-dark"}`}>{i + 1}</span>
              {nom}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <div className="border-2 border-ink bg-paper p-5 shadow-hard sm:p-8 lg:col-span-7">
          {etape === 0 ? (
            <EtapeArticle modele={modele} config={config} modifier={modifier} />
          ) : etape === 1 ? (
            <EtapeMarquage modele={modele} marquages={config.marquages} actifId={actifId} setActif={setActif} setMarquages={setMarquages} />
          ) : etape === 2 ? (
            <EtapeControles modele={modele} marquages={config.marquages} couleurHex={couleur?.hex ?? null} quantite={total} setMarquages={setMarquages} />
          ) : (
            <EtapeEnvoi
              modele={modele}
              config={config}
              couleur={couleur?.nom ?? "—"}
              couleurHex={couleurHex}
              grammage={grammage?.grammage ? `${grammage.grammage} g/m²` : (grammage?.nom ?? null)}
              total={total}
              apercus={apercus}
            />
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink pt-6">
            {etape > 0 ? (
              <button type="button" onClick={() => allerA(etape - 1)} className="inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-paper px-5 font-display font-bold">
                <ArrowLeft aria-hidden size={18} /> {ETAPES[etape - 1]}
              </button>
            ) : (
              <span />
            )}
            {etape < ETAPES.length - 1 ? (
              <div className="text-right">
                <button
                  type="button"
                  disabled={etape === 0 && quantiteManquante}
                  onClick={() => allerA(etape + 1)}
                  className="btn-presse inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-orange px-6 font-display font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ETAPES[etape + 1]} <ArrowRight aria-hidden size={18} />
                </button>
                {etape === 0 && quantiteManquante ? <p className="mt-2 text-sm text-muted">Indiquez une quantité pour continuer.</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-24 space-y-3">
            <div className="relative border-2 border-ink bg-[radial-gradient(circle_at_50%_35%,#fffdf8,#ebe3d1)] p-4">
              <span className="absolute top-3 left-3 bg-ink px-2 py-1 font-mono text-xs tracking-wider text-ecru uppercase">{vue}</span>
              <Apercu vue={vue} couleurHex={couleurHex} forme={formePour(modele.nom, modele.sousFamille)} marquages={apercus} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["face", "dos"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vue === v}
                  onClick={() => setVue(v)}
                  className={`flex min-h-12 items-center gap-2 border-2 border-ink px-3 font-display text-sm font-bold capitalize ${vue === v ? "bg-indigo text-white" : "bg-paper"}`}
                >
                  <span className="w-8">
                    <Apercu vue={v} couleurHex={couleurHex} forme={formePour(modele.nom, modele.sousFamille)} marquages={apercus} />
                  </span>
                  {v}
                </button>
              ))}
            </div>
            <p className="flex flex-wrap gap-2 text-xs">
              {[modele.nom, couleur?.nom, grammage?.grammage ? `${grammage.grammage} g/m²` : null, total ? `${total} pièces` : null]
                .filter(Boolean)
                .map((t) => (
                  <span key={t} className="border border-ink bg-paper px-2 py-1">
                    {t}
                  </span>
                ))}
            </p>
            <p className="text-xs text-muted">Aperçu indicatif, à l&apos;échelle d&apos;un adulte taille M. Le rendu final est validé sur BAT.</p>
            {photos.length > 0 ? (
              <div>
                <p className="mt-2 font-mono text-xs tracking-wider uppercase">Photos du modèle</p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {photos.slice(0, 8).map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p.url} src={p.url} alt="" className="aspect-square w-full border border-ink object-cover" />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

