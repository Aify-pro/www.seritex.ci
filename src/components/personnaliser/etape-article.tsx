"use client";

import type { RefObject } from "react";
import { couleursProposees, grammagesProposes, MENTION_INDISPONIBLE, type ModeleCatalogue } from "@/lib/catalogue-plateforme";
import type { Configuration } from "./etat";
import { quantiteTotale } from "./etat";
import { Pastille, Puce, Titre } from "./ui";

/** Étape 1 de la fiche article : couleur, qualité du tissu, quantité. */
export function EtapeArticle({
  modele,
  config,
  modifier,
  zoneActive,
  choisirZone,
  paletteRef,
  apresCouleur,
}: {
  modele: ModeleCatalogue;
  config: Configuration;
  modifier: (patch: Partial<Configuration>) => void;
  /** Zone dont la palette est ouverte (onglet actif) ; partagée avec l'aperçu (clic sur une zone du dessin). */
  zoneActive: string | null;
  choisirZone: (cle: string | null) => void;
  /** Palette de la zone ouverte : cible du double appui sur l'aperçu (mobile). */
  paletteRef: RefObject<HTMLDivElement | null>;
  /** Appelé après le choix d'une couleur (mobile : retour à l'aperçu). */
  apresCouleur: () => void;
}) {
  const couleurs = couleursProposees(modele);
  const indisponibles = modele.couleurs.filter((c) => c.statut === "indisponible");
  const grammages = config.couleurId ? grammagesProposes(modele, config.couleurId) : modele.grammages;
  const total = quantiteTotale(config);
  const parZone = modele.zonesCouleur.length > 1 && couleurs.length > 0;

  /** Couleur principale : garde la qualité de tissu si elle existe dans cette couleur. */
  const couleurPrincipale = (id: string) => {
    const g = grammagesProposes(modele, id);
    return { couleurId: id, grammageId: g.some((x) => x.id === config.grammageId) ? config.grammageId : (g[0]?.id ?? null) };
  };

  return (
    <div className="space-y-8">
      <div>
        <Titre>Couleur du textile</Titre>
        {couleurs.length === 0 ? (
          <p className="mt-2 text-rouge">{MENTION_INDISPONIBLE}</p>
        ) : config.couleursZones ? null : (
          // Couleur unie : masquée dès que le client choisit ses couleurs zone par zone.
          <ul className="mt-3 flex flex-wrap gap-2 sm:gap-3">
            {couleurs.map((c) => (
              <li key={c.id}>
                <Pastille
                  hex={c.hex}
                  nom={c.nom}
                  choisie={c.id === config.couleurId}
                  onClick={() => {
                    modifier(couleurPrincipale(c.id));
                    apresCouleur();
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        {indisponibles.length > 0 ? (
          <p className="mt-3 text-sm text-muted">
            Indisponible actuellement : {indisponibles.map((c) => c.nom).join(", ")} — contactez notre service commercial.
          </p>
        ) : null}
      </div>

      {parZone ? (
        <div className="-mt-4">
          <label className="flex min-h-11 items-center gap-3 font-display font-semibold">
            <input
              type="checkbox"
              className="size-5 accent-indigo"
              checked={!!config.couleursZones}
              onChange={(e) => {
                modifier({
                  couleursZones: e.target.checked ? Object.fromEntries(modele.zonesCouleur.map((z) => [z.cle, config.couleurId])) : null,
                });
                choisirZone(e.target.checked ? modele.zonesCouleur[0].cle : null);
              }}
            />
            Personnaliser les couleurs par zone
          </label>
          {config.couleursZones ? (
            <div className="mt-3 border-2 border-ink bg-ecru">
              {/* Onglets : une zone à la fois ; la pastille montre sa couleur actuelle. */}
              <div role="tablist" aria-label="Zones du vêtement" className="flex flex-wrap gap-1 border-b-2 border-ink p-2">
                {modele.zonesCouleur.map((z) => {
                  const c = couleurs.find((x) => x.id === (config.couleursZones?.[z.cle] ?? config.couleurId));
                  const actif = z.cle === zoneActive;
                  return (
                    <button
                      key={z.cle}
                      type="button"
                      role="tab"
                      aria-selected={actif}
                      onClick={() => choisirZone(actif ? null : z.cle)}
                      className={`inline-flex min-h-10 items-center gap-2 border-2 px-3 font-display text-sm font-semibold ${
                        actif ? "border-ink bg-ink text-ecru" : "border-transparent hover:border-ink"
                      }`}
                    >
                      <span className="size-4 shrink-0 rounded-full border border-current" style={{ background: c?.hex ?? "#ccc" }} />
                      {z.libelle}
                    </button>
                  );
                })}
              </div>
              {zoneActive && modele.zonesCouleur.some((z) => z.cle === zoneActive) ? (
                <div ref={paletteRef} role="tabpanel" className="scroll-mt-24 p-3">
                  <p className="text-sm text-muted">
                    Couleur du {modele.zonesCouleur.find((z) => z.cle === zoneActive)?.libelle.toLowerCase()} :
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2 sm:gap-3">
                    {couleurs.map((c) => (
                      <li key={c.id}>
                        <Pastille
                          hex={c.hex}
                          nom={c.nom}
                          choisie={c.id === (config.couleursZones?.[zoneActive] ?? config.couleurId)}
                          onClick={() => {
                            // La première zone (le corps) donne la couleur principale de la demande.
                            const principale = zoneActive === modele.zonesCouleur[0].cle ? couleurPrincipale(c.id) : {};
                            modifier({ couleursZones: { ...config.couleursZones, [zoneActive]: c.id }, ...principale });
                            apresCouleur();
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="p-3 text-sm text-muted">Choisissez une zone ci-dessus, ou cliquez directement sur le vêtement dans l&apos;aperçu.</p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted">
              Par défaut, tout le vêtement est dans la couleur choisie ci-dessus. Astuce : cliquez sur une zone du vêtement dans l&apos;aperçu
              pour changer sa couleur.
            </p>
          )}
        </div>
      ) : null}

      {grammages.length > 0 ? (
        <div>
          <Titre>Qualité du tissu</Titre>
          <div className="mt-3 flex flex-wrap gap-2">
            {grammages.map((g) => (
              <Puce key={g.id} choisie={g.id === config.grammageId} onClick={() => modifier({ grammageId: g.id })}>
                {g.grammage ? `${g.grammage} g/m²` : g.nom}
                {g.composition ? <span className="font-normal opacity-75"> · {g.composition}</span> : null}
              </Puce>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <Titre>Quantité</Titre>
        {config.repartition ? (
          <div className="mt-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {modele.tailles.map((t) => (
                <label key={t.id} className="block">
                  <span className="font-mono text-xs tracking-wider uppercase">{t.libelle}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={config.repartition?.[t.cle] ?? ""}
                    onChange={(e) => modifier({ repartition: { ...config.repartition, [t.cle]: e.target.value } })}
                    className="mt-1 block min-h-11 w-full border-2 border-ink bg-paper px-2 py-2 text-center"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">
              {total} pièce{total > 1 ? "s" : ""} au total.{" "}
              <button type="button" className="font-semibold text-indigo underline" onClick={() => modifier({ repartition: null, quantite: total ? String(total) : config.quantite })}>
                Indiquer seulement le total
              </button>
            </p>
          </div>
        ) : (
          <div className="mt-3">
            <input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Ex. 50"
              aria-label="Nombre de pièces"
              value={config.quantite}
              onChange={(e) => modifier({ quantite: e.target.value })}
              className="block min-h-12 w-40 border-2 border-ink bg-paper px-4 py-3 text-lg"
            />
            <p className="mt-2 text-sm text-muted">
              Seritex vous proposera la répartition par taille avec le devis.
              {modele.tailles.length > 0 ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="font-semibold text-indigo underline"
                    onClick={() => modifier({ repartition: Object.fromEntries(modele.tailles.map((t) => [t.cle, ""])) })}
                  >
                    Je connais déjà la répartition par taille
                  </button>
                </>
              ) : null}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
