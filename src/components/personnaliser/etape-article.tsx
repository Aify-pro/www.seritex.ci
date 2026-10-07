"use client";

import Image from "next/image";
import {
  couleursProposees,
  grammagesProposes,
  MENTION_INDISPONIBLE,
  photoPour,
  type ModeleCatalogue,
} from "@/lib/catalogue-plateforme";
import { Apercu, formePour } from "./apercu";
import type { Configuration } from "./etat";
import { quantiteTotale } from "./etat";
import { Pastille, Puce, Titre } from "./ui";

export function EtapeArticle({
  catalogue,
  modele,
  config,
  choisirModele,
  modifier,
}: {
  catalogue: ModeleCatalogue[];
  modele: ModeleCatalogue;
  config: Configuration;
  choisirModele: (m: ModeleCatalogue) => void;
  modifier: (patch: Partial<Configuration>) => void;
}) {
  const couleurs = couleursProposees(modele);
  const indisponibles = modele.couleurs.filter((c) => c.statut === "indisponible");
  const grammages = config.couleurId ? grammagesProposes(modele, config.couleurId) : modele.grammages;
  const total = quantiteTotale(config);

  return (
    <div className="space-y-8">
      <div>
        <Titre>Quel article ?</Titre>
        <p className="mt-1 text-muted">Les modèles du catalogue Seritex, confectionnés dans nos ateliers.</p>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {catalogue.map((m) => {
            const indispo = m.statut === "indisponible";
            const choisi = m.id === modele.id;
            const photo = photoPour(m, null);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={indispo}
                  aria-pressed={choisi}
                  onClick={() => choisirModele(m)}
                  className={`flex h-full w-full flex-col border-2 border-ink p-2 text-left transition ${
                    choisi ? "bg-indigo text-white shadow-hard-sm" : "bg-paper hover:-translate-y-0.5"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span className="relative block aspect-square w-full overflow-hidden bg-ecru">
                    {photo ? (
                      <Image src={photo} alt="" fill sizes="200px" className="object-cover" unoptimized />
                    ) : (
                      <span className="block p-3">
                        <Apercu vue="face" couleurHex="#FFFFFF" forme={formePour(m.nom, m.sousFamille)} marquages={[]} />
                      </span>
                    )}
                  </span>
                  <span className="mt-2 font-display font-bold leading-tight">{m.nom}</span>
                  <span className={`text-sm ${choisi ? "text-white/80" : "text-muted"}`}>
                    {indispo ? MENTION_INDISPONIBLE : (m.sousFamille ?? m.famille ?? "")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {modele.texteCommercial ? <p className="mt-4 text-muted">{modele.texteCommercial}</p> : null}
      </div>

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
