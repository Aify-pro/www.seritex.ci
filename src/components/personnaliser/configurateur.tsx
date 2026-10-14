"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ModeleCatalogue } from "@/lib/catalogue-plateforme";
import { type Vue } from "@/lib/marquage";
import { couleursDesZones, mockupPour, placementDe } from "@/lib/gabarit";
import { Apercu, formePour, type MarquageApercu } from "./apercu";
import { configurationInitiale, quantiteTotale, type Configuration, type Marquage } from "./etat";
import { EtapeArticle } from "./etape-article";
import { EtapeEnvoi } from "./etape-envoi";
import { EtapeMarquage } from "./etape-marquage";
import { lireBrouillon, sauverBrouillon, effacerBrouillon } from "./brouillon";

const ETAPES = ["Couleur & quantité", "Logo & emplacement", "Ma maquette"] as const;
/** Libellés courts de la barre d'étapes sur mobile. */
const ETAPES_COURTES = ["Couleur", "Logo", "Maquette"] as const;

/** Parcours de personnalisation d'un article de l'e-shop (fiche article). */
export function Configurateur({ modele }: { modele: ModeleCatalogue }) {
  const [config, setConfig] = useState<Configuration>(() => configurationInitiale(modele));
  const [etape, setEtape] = useState(0);
  const [vue, setVue] = useState<Vue>("face");
  const [actifId, setActifId] = useState(config.marquages[0]?.id ?? "");
  const haut = useRef<HTMLDivElement>(null);
  // Brouillon gardé dans le navigateur : repris au retour (après identification, confirmation d'e-mail…).
  const configDepart = useRef(config);
  const [brouillonPret, setBrouillonPret] = useState(false);
  const [repris, setRepris] = useState(false);
  // Zone de couleur dont la palette est ouverte (onglet), partagée avec l'aperçu.
  const [zoneActive, setZoneActive] = useState<string | null>(null);
  const apercuRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  // Double appui sur une zone de l'aperçu : dernière zone touchée et quand.
  const dernierAppui = useRef<{ cle: string; t: number } | null>(null);

  useEffect(() => {
    let annule = false;
    void lireBrouillon(modele).then((b) => {
      if (annule) return;
      if (b) {
        setConfig(b.config);
        setActifId(b.config.marquages[0]?.id ?? "");
        setEtape(b.etape);
        setRepris(true);
      }
      setBrouillonPret(true);
    });
    return () => {
      annule = true;
    };
  }, [modele]);

  // Sauvegarde (légèrement différée) dès que la composition a bougé.
  useEffect(() => {
    if (!brouillonPret || config === configDepart.current) return;
    const t = setTimeout(() => void sauverBrouillon(modele.id, config, etape), 600);
    return () => clearTimeout(t);
  }, [brouillonPret, config, etape, modele.id]);

  function repartirDeZero() {
    void effacerBrouillon(modele.id);
    const neuve = configurationInitiale(modele);
    configDepart.current = neuve;
    setConfig(neuve);
    setActifId(neuve.marquages[0]?.id ?? "");
    setEtape(0);
    setRepris(false);
  }

  function allerA(i: number) {
    setEtape(i);
    haut.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const couleur = modele.couleurs.find((c) => c.id === config.couleurId) ?? null;
  const grammage = modele.grammages.find((g) => g.id === config.grammageId) ?? null;
  const couleurHex = couleur?.hex ?? "#FFFFFF";
  // Couleur de chaque zone du mockup (couleur unique partout, ou choix par zone).
  const couleursZonesHex = couleursDesZones(modele, config.couleurId, config.couleursZones);
  const total = quantiteTotale(config);
  const quantiteManquante = total < 1;
  const photos = modele.medias.filter((p) => p.couleurId === null || p.couleurId === config.couleurId);

  const modifier = (patch: Partial<Configuration>) => setConfig((c) => ({ ...c, ...patch }));

  /**
   * Ouvre la palette d'une zone (onglet ou clic sur le dessin) : active au
   * besoin les couleurs par zone, et montre la face du vêtement où elle se trouve.
   */
  function choisirZone(cle: string | null) {
    setZoneActive(cle);
    if (!cle) return;
    if (!config.couleursZones) modifier({ couleursZones: Object.fromEntries(modele.zonesCouleur.map((z) => [z.cle, config.couleurId])) });
    // La vue affichée reste si la zone y figure (col, manches… souvent dessinés devant ET derrière).
    const sur = (v: Vue) => Object.values(mockupPour(modele, v)?.zones ?? {}).includes(cle);
    if (sur(vue)) return;
    const mk = modele.mockups.find((m) => Object.values(m.zones).includes(cle));
    if (mk) setVue(mk.vue === "avant" ? "face" : "dos");
  }

  /** Mobile seulement (aperçu au-dessus des options) : fait défiler la page sans gêner l'écran large. */
  const defiler = (cible: HTMLElement | null, block: ScrollLogicalPosition) => {
    if (cible && window.matchMedia("(max-width: 1023px)").matches) cible.scrollIntoView({ behavior: "smooth", block });
  };

  /** Clic sur le dessin : ouvre la zone ; double appui (ou double clic) : descend jusqu'à sa palette. */
  function toucherZone(cle: string) {
    const maintenant = Date.now();
    const double = dernierAppui.current?.cle === cle && maintenant - dernierAppui.current.t < 400;
    dernierAppui.current = double ? null : { cle, t: maintenant };
    choisirZone(cle);
    if (double) requestAnimationFrame(() => defiler(paletteRef.current, "center"));
  }

  function setMarquages(marquages: Marquage[]) {
    modifier({ marquages });
    // L'aperçu suit l'emplacement du marquage en cours de modification.
    const actif =
      marquages.length > config.marquages.length ? marquages[marquages.length - 1] : (marquages.find((m) => m.id === actifId) ?? marquages[0]);
    const z = actif && modele.emplacements.find((e) => e.id === actif.emplacementId);
    if (z) setVue(placementDe(modele, z.id).vue);
  }

  function setActif(id: string) {
    setActifId(id);
    const m = config.marquages.find((x) => x.id === id);
    const z = m && modele.emplacements.find((e) => e.id === m.emplacementId);
    if (z) setVue(placementDe(modele, z.id).vue);
  }

  const apercus: MarquageApercu[] = config.marquages.flatMap((m) => {
    const z = modele.emplacements.find((e) => e.id === m.emplacementId);
    if (!z) return [];
    return [
      {
        id: m.id,
        placement: placementDe(modele, z.id),
        largeurCm: m.largeurCm,
        ratio: m.logo?.analyse.analysable ? m.logo.analyse.ratio : 0.6,
        apercuUrl: m.logo?.apercuUrl ?? null,
        actif: etape === 1 && m.id === actifId,
        dxCm: m.dxCm,
        dyCm: m.dyCm,
        rotation: m.rotation,
        verrouille: m.verrouille,
      },
    ];
  });

  // Photos du modèle : sous l'aperçu sur écran large, après les options sur mobile.
  const galerie =
    photos.length > 0 ? (
      <div>
        <p className="mt-2 font-mono text-xs tracking-wider uppercase">Photos du modèle</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {photos.slice(0, 8).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.url} src={p.url} alt="" className="aspect-square w-full border border-ink object-cover" />
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div ref={haut} className="scroll-mt-24">
      {repris ? (
        <p role="status" className="mb-4 flex flex-wrap items-center gap-3 border-2 border-ink bg-orange/15 p-3 text-sm">
          <span className="flex-1">
            <strong className="font-display">Votre composition a été retrouvée</strong> sur cet appareil.
          </span>
          <button type="button" onClick={repartirDeZero} className="min-h-9 border-2 border-ink bg-paper px-3 font-display text-xs font-bold">
            Repartir de zéro
          </button>
        </p>
      ) : null}
      <ol className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2" aria-label="Étapes">
        {ETAPES.map((nom, i) => (
          <li key={nom}>
            <button
              type="button"
              onClick={() => allerA(i)}
              disabled={i > 0 && quantiteManquante}
              aria-current={i === etape ? "step" : undefined}
              className={`inline-flex min-h-11 w-full items-center gap-1.5 border-2 border-ink px-2 text-left font-display text-xs leading-tight font-bold sm:w-auto sm:gap-2 sm:px-4 sm:text-sm ${
                i === etape ? "bg-indigo text-white shadow-hard-sm" : "bg-paper"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${i === etape ? "bg-orange text-ink" : "bg-ecru-dark"}`}>{i + 1}</span>
              <span className="sm:hidden">{ETAPES_COURTES[i]}</span>
              <span className="hidden sm:inline">{nom}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-12 lg:gap-8">
        <div className="order-2 border-2 border-ink bg-paper p-4 shadow-hard sm:p-8 lg:order-1 lg:col-span-7">
          {etape === 0 ? (
            <EtapeArticle
              modele={modele}
              config={config}
              modifier={modifier}
              zoneActive={zoneActive}
              choisirZone={choisirZone}
              paletteRef={paletteRef}
              // Mobile : une couleur choisie, on remonte voir le résultat sur l'aperçu.
              apresCouleur={() => defiler(apercuRef.current, "start")}
            />
          ) : etape === 1 ? (
            <EtapeMarquage modele={modele} marquages={config.marquages} actifId={actifId} setActif={setActif} setMarquages={setMarquages} />
          ) : (
            <EtapeEnvoi
              modele={modele}
              config={config}
              couleur={couleur?.nom ?? "—"}
              couleurHex={couleurHex}
              grammage={grammage?.grammage ? `${grammage.grammage} g/m²` : (grammage?.nom ?? null)}
              total={total}
              apercus={apercus}
              couleursZonesHex={couleursZonesHex}
              setMarquages={setMarquages}
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

        {/* Mobile : l'aperçu en tête, les options dessous. */}
        <aside ref={apercuRef} className="order-1 scroll-mt-20 lg:order-2 lg:col-span-5">
          <div className="space-y-3 lg:sticky lg:top-24">
            <div className="relative mx-auto max-w-[19rem] border-2 border-ink lg:max-w-none bg-[radial-gradient(circle_at_50%_35%,#fffdf8,#ebe3d1)] p-4">
              <span className="absolute top-3 left-3 bg-ink px-2 py-1 font-mono text-xs tracking-wider text-ecru uppercase">{vue}</span>
              <Apercu
                vue={vue}
                couleurHex={couleurHex}
                mockup={mockupPour(modele, vue)}
                couleursZones={couleursZonesHex}
                // Étape 1 : un clic sur une zone du vêtement ouvre sa palette.
                zoneActive={etape === 0 && config.couleursZones ? zoneActive : null}
                onChoisirZone={etape === 0 && modele.zonesCouleur.length > 1 ? toucherZone : undefined}
                forme={formePour(modele.nom, modele.sousFamille)}
                marquages={apercus}
                // Étape « Logo & emplacement » : le logo se déplace, se redimensionne et s'incline directement ici.
                onModifier={
                  etape === 1
                    ? // Mise à jour fonctionnelle : les gestes rapides (glisser, touches répétées) partent toujours du dernier état.
                      (id, patch) => setConfig((c) => ({ ...c, marquages: c.marquages.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
                    : undefined
                }
                onSelectionner={etape === 1 ? setActif : undefined}
              />
            </div>
            <div className="mx-auto grid max-w-[19rem] grid-cols-2 gap-2 lg:max-w-none">
              {(["face", "dos"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vue === v}
                  onClick={() => setVue(v)}
                  className={`flex min-h-11 items-center gap-2 border-2 border-ink px-3 font-display text-sm font-bold capitalize ${vue === v ? "bg-indigo text-white" : "bg-paper"}`}
                >
                  <span className="w-6 lg:w-8">
                    <Apercu
                      vue={v}
                      couleurHex={couleurHex}
                      forme={formePour(modele.nom, modele.sousFamille)}
                      marquages={apercus}
                      mockup={mockupPour(modele, v)}
                      couleursZones={couleursZonesHex}
                    />
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
            {etape === 1 && config.marquages.length > 0 ? (
              <p className="border-2 border-dashed border-ink bg-orange/15 p-3 text-sm">
                <strong className="font-display">Ajustez votre logo ici :</strong> glissez-le pour le placer, tirez le carré orange pour la taille,
                le rond du haut pour l&apos;incliner (Maj : par 15°).
              </p>
            ) : null}
            {etape === 0 && modele.zonesCouleur.length > 1 ? (
              <p className="text-xs text-muted lg:hidden">Touchez une zone du vêtement pour la choisir, touchez-la deux fois pour aller à sa palette.</p>
            ) : null}
            <p className="text-xs text-muted">Aperçu indicatif, à l&apos;échelle d&apos;un adulte taille M. Le rendu final est validé sur BAT.</p>
            <div className="hidden lg:block">{galerie}</div>
          </div>
        </aside>
        {galerie ? <div className="order-3 lg:hidden">{galerie}</div> : null}
      </div>
    </div>
  );
}

