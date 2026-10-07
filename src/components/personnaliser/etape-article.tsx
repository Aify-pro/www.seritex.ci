"use client";

import { couleursProposees, grammagesProposes, MENTION_INDISPONIBLE, type ModeleCatalogue } from "@/lib/catalogue-plateforme";
import type { Configuration } from "./etat";
import { quantiteTotale } from "./etat";
import { Pastille, Puce, Titre } from "./ui";

/** Étape 1 de la fiche article : couleur, qualité du tissu, quantité. */
export function EtapeArticle({
  modele,
  config,
  modifier,
}: {
  modele: ModeleCatalogue;
  config: Configuration;
  modifier: (patch: Partial<Configuration>) => void;
}) {
  const couleurs = couleursProposees(modele);
  const indisponibles = modele.couleurs.filter((c) => c.statut === "indisponible");
  const grammages = config.couleurId ? grammagesProposes(modele, config.couleurId) : modele.grammages;
  const total = quantiteTotale(config);

  return (
    <div className="space-y-8">
      <div>
        <Titre>Couleur du textile</Titre>
        {couleurs.length === 0 ? (
          <p className="mt-2 text-rouge">{MENTION_INDISPONIBLE}</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-3">
            {couleurs.map((c) => (
              <li key={c.id}>
                <Pastille
                  hex={c.hex}
                  nom={c.nom}
                  choisie={c.id === config.couleurId}
                  onClick={() => {
                    const g = grammagesProposes(modele, c.id);
                    modifier({
                      couleurId: c.id,
                      grammageId: g.some((x) => x.id === config.grammageId) ? config.grammageId : (g[0]?.id ?? null),
                    });
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
