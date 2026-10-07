"use client";

import { AlertTriangle, CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import type { ModeleCatalogue } from "@/lib/catalogue-plateforme";
import { controler, getTechnique, techniqueConseillee, type Statut } from "@/lib/marquage";
import type { Marquage } from "./etat";
import { libelleEmplacement } from "./etape-marquage";
import { Titre } from "./ui";

const ICONES: Record<Statut, { icone: typeof CheckCircle2; cls: string; label: string }> = {
  ok: { icone: CheckCircle2, cls: "text-indigo", label: "Conforme" },
  attention: { icone: AlertTriangle, cls: "text-orange", label: "À vérifier" },
  inadapte: { icone: XCircle, cls: "text-rouge", label: "Non adapté" },
};

export function EtapeControles({
  modele,
  marquages,
  couleurHex,
  quantite,
  setMarquages,
}: {
  modele: ModeleCatalogue;
  marquages: Marquage[];
  couleurHex: string | null;
  quantite: number;
  setMarquages: (m: Marquage[]) => void;
}) {
  return (
    <div className="space-y-10">
      <div>
        <Titre>Contrôles de marquage</Titre>
        <p className="mt-1 text-muted">
          Calculés sur votre fichier, à la taille choisie. Ils sont indicatifs : votre conseiller Seritex confirme tout au devis, puis au BAT.
        </p>
      </div>

      {marquages.map((m, i) => {
        const titre = `${i + 1} · ${libelleEmplacement(modele, m.emplacementId)}`;
        if (!m.logo) {
          return (
            <section key={m.id}>
              <h3 className="font-display text-lg font-bold">{titre}</h3>
              <p className="mt-2 text-muted">Pas de logo déposé : votre conseiller vous le demandera.</p>
            </section>
          );
        }
        const controles = controler(m.logo.analyse, m.technique, m.largeurCm, couleurHex);
        const conseil = techniqueConseillee(m.logo.analyse, quantite);
        return (
          <section key={m.id}>
            <h3 className="font-display text-lg font-bold">
              {titre} <span className="font-normal text-muted">· {getTechnique(m.technique).label}</span>
            </h3>
            <ul className="mt-3 divide-y-2 divide-dashed divide-ink/20 border-2 border-ink bg-paper">
              {controles.map((c) => {
                const { icone: Icone, cls, label } = ICONES[c.statut];
                return (
                  <li key={c.id} className="flex gap-3 p-4">
                    <Icone aria-hidden className={`mt-0.5 shrink-0 ${cls}`} />
                    <div>
                      <p className="font-display font-bold">
                        <span className="sr-only">{label} : </span>
                        {c.titre}
                      </p>
                      <p className="text-sm text-muted">{c.detail}</p>
                      {c.id === "couleurs" && m.logo!.analyse.couleurs.length > 0 ? (
                        <p className="mt-2 flex flex-wrap gap-1">
                          {m.logo!.analyse.couleurs.map((h) => (
                            <span key={h} title={h} className="size-5 rounded-full border border-ink" style={{ background: h }} />
                          ))}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-3 border-2 border-ink bg-orange/15 p-4">
              <Lightbulb aria-hidden className="shrink-0 text-orange" />
              <p className="flex-1 text-sm">
                <strong className="font-display">Conseil : {getTechnique(conseil.id).label}.</strong> {conseil.raison}
              </p>
              {conseil.id !== m.technique ? (
                <button
                  type="button"
                  onClick={() => setMarquages(marquages.map((x) => (x.id === m.id ? { ...x, technique: conseil.id } : x)))}
                  className="min-h-11 border-2 border-ink bg-paper px-4 font-display text-sm font-bold"
                >
                  Choisir cette technique
                </button>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
