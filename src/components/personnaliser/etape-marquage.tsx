"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileImage, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { chargerLogo, FORMATS_ACCEPTES, TAILLE_MAX_OCTETS } from "@/lib/analyse-logo";
import type { ModeleCatalogue } from "@/lib/catalogue-plateforme";
import { FORMATS, formatCm, placementPour, TECHNIQUES } from "@/lib/marquage";
import { nouveauMarquage, type Marquage } from "./etat";
import { Puce, Titre } from "./ui";

export function libelleEmplacement(m: ModeleCatalogue, emplacementId: string) {
  return m.emplacements.find((e) => e.id === emplacementId)?.libelle ?? "Emplacement";
}

export function EtapeMarquage({
  modele,
  marquages,
  actifId,
  setActif,
  setMarquages,
}: {
  modele: ModeleCatalogue;
  marquages: Marquage[];
  actifId: string;
  setActif: (id: string) => void;
  setMarquages: (m: Marquage[]) => void;
}) {
  const actif = marquages.find((m) => m.id === actifId) ?? marquages[0];
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [survol, setSurvol] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  if (!actif) {
    return <p className="text-muted">Ce modèle n&apos;a pas encore d&apos;emplacement de marquage : décrivez votre besoin à votre conseiller.</p>;
  }

  const zone = modele.emplacements.find((e) => e.id === actif.emplacementId);
  const placement = placementPour(zone?.cle ?? "", zone?.libelle ?? "");
  const pris = new Set(marquages.filter((m) => m.id !== actif.id).map((m) => m.emplacementId));
  const libres = modele.emplacements.filter((e) => !marquages.some((m) => m.emplacementId === e.id));
  const autresLogos = marquages.filter((m) => m.id !== actif.id && m.logo && m.logo !== actif.logo);

  const maj = (patch: Partial<Marquage>) => setMarquages(marquages.map((m) => (m.id === actif.id ? { ...m, ...patch } : m)));

  async function deposer(fichier: File | undefined) {
    if (!fichier) return;
    setErreur(null);
    if (fichier.size > TAILLE_MAX_OCTETS) {
      setErreur("Fichier trop lourd (15 Mo maximum).");
      return;
    }
    setChargement(true);
    try {
      maj({ logo: await chargerLogo(fichier) });
    } catch {
      setErreur("Ce fichier n'a pas pu être lu. Essayez un PNG, un JPG ou un SVG.");
    } finally {
      setChargement(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setSurvol(false);
    void deposer(e.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-8">
      {/* Onglets des marquages */}
      <div className="flex flex-wrap items-center gap-2">
        {marquages.map((m, i) => (
          <Puce key={m.id} choisie={m.id === actif.id} onClick={() => setActif(m.id)}>
            {i + 1} · {libelleEmplacement(modele, m.emplacementId)}
          </Puce>
        ))}
        {libres.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              const n = { ...nouveauMarquage(modele, libres[0].id), logo: actif.logo, technique: actif.technique };
              setMarquages([...marquages, n]);
              setActif(n.id);
            }}
            className="inline-flex min-h-11 items-center gap-1 px-3 font-display text-sm font-bold text-indigo underline decoration-2 underline-offset-4"
          >
            <Plus aria-hidden size={16} /> Ajouter un marquage
          </button>
        ) : null}
      </div>

      <div>
        <Titre>Votre logo</Titre>
        <p className="mt-1 text-muted">PNG, JPG ou SVG. Un JPG suffit pour l&apos;aperçu ; pour la production, Seritex vous demandera le fichier source.</p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={onDrop}
          className={`mt-3 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ink p-6 text-center transition ${survol ? "bg-orange/20" : "bg-paper"}`}
        >
          {chargement ? (
            <Loader2 aria-hidden className="animate-spin text-indigo" />
          ) : actif.logo ? (
            <div className="flex w-full items-center gap-4 text-left">
              <span className="grid size-20 shrink-0 place-items-center border-2 border-ink bg-[repeating-conic-gradient(#ebe3d1_0_25%,#fffdf8_0_50%)] bg-[length:16px_16px]">
                {actif.logo.apercuUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={actif.logo.apercuUrl} alt="Votre logo" className="max-h-16 max-w-16 object-contain" />
                ) : (
                  <FileImage aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display font-bold">{actif.logo.nom}</span>
                <span className="block text-sm text-muted">
                  {actif.logo.analyse.analysable
                    ? `${actif.logo.analyse.vectoriel ? "Vectoriel" : "Image"} · ${actif.logo.analyse.couleurs.length} couleur(s) détectée(s)`
                    : "Fichier transmis à votre conseiller"}
                </span>
              </span>
              <button type="button" onClick={() => input.current?.click()} className="min-h-11 shrink-0 font-display text-sm font-bold text-indigo underline">
                Changer
              </button>
            </div>
          ) : (
            <>
              <Upload aria-hidden className="text-indigo" />
              <button type="button" onClick={() => input.current?.click()} className="font-display font-bold underline decoration-2 underline-offset-4">
                Déposez votre logo ici ou choisissez un fichier
              </button>
            </>
          )}
          <input
            ref={input}
            type="file"
            accept={FORMATS_ACCEPTES}
            className="sr-only"
            aria-label="Choisir un fichier logo"
            onChange={(e) => {
              void deposer(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {erreur ? (
          <p role="alert" className="mt-2 text-sm font-medium text-rouge">
            {erreur}
          </p>
        ) : null}
        {autresLogos.length > 0 ? (
          <p className="mt-2 text-sm">
            Réutiliser :{" "}
            {autresLogos.map((m) => (
              <button key={m.id} type="button" onClick={() => maj({ logo: m.logo })} className="mr-2 font-semibold text-indigo underline">
                {m.logo!.nom}
              </button>
            ))}
          </p>
        ) : null}
      </div>

      <div>
        <Titre>Emplacement</Titre>
        <div className="mt-3 flex flex-wrap gap-2">
          {modele.emplacements.map((e) => (
            <Puce
              key={e.id}
              choisie={e.id === actif.emplacementId}
              disabled={pris.has(e.id)}
              onClick={() => {
                const p = placementPour(e.cle, e.libelle);
                maj({ emplacementId: e.id, largeurCm: p.defautCm });
              }}
            >
              {e.libelle} · {placementPour(e.cle, e.libelle).vue}
            </Puce>
          ))}
        </div>
      </div>

      <div>
        <Titre>Taille du marquage</Titre>
        <div className="mt-3 flex flex-wrap gap-2">
          {FORMATS.filter((f) => f.cm <= placement.maxCm).map((f) => (
            <Puce key={f.id} choisie={actif.largeurCm === f.cm} onClick={() => maj({ largeurCm: f.cm })}>
              {f.label} · {formatCm(f.cm)}
            </Puce>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-4">
          <span className="font-mono text-xs tracking-wider uppercase">Largeur</span>
          <input
            type="range"
            min={3}
            max={placement.maxCm}
            step={0.5}
            value={actif.largeurCm}
            onChange={(e) => maj({ largeurCm: Number(e.target.value) })}
            className="flex-1 accent-indigo"
          />
          <span className="w-20 text-right font-mono text-sm">{formatCm(actif.largeurCm)}</span>
        </label>
        <p className="mt-1 text-sm text-muted">Jusqu&apos;à {formatCm(placement.maxCm)} sur cet emplacement.</p>
      </div>

      <div>
        <Titre>Technique</Titre>
        <div className="mt-3 flex flex-wrap gap-2">
          {TECHNIQUES.map((t) => (
            <Puce key={t.id} choisie={actif.technique === t.id} onClick={() => maj({ technique: t.id })}>
              {t.label}
            </Puce>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">{TECHNIQUES.find((t) => t.id === actif.technique)?.resume}</p>
      </div>

      <div>
        <label htmlFor={`consigne-${actif.id}`} className="font-display text-lg font-bold">
          Une précision ? <span className="font-normal text-muted">(facultatif)</span>
        </label>
        <textarea
          id={`consigne-${actif.id}`}
          rows={3}
          maxLength={600}
          value={actif.consigne}
          onChange={(e) => maj({ consigne: e.target.value })}
          placeholder="Ex. : logo assez discret ; ajouter le texte « Équipe terrain » sous le logo."
          className="mt-2 block w-full border-2 border-ink bg-paper px-4 py-3"
        />
      </div>

      {marquages.length > 1 ? (
        <button
          type="button"
          onClick={() => {
            const reste = marquages.filter((m) => m.id !== actif.id);
            setMarquages(reste);
            setActif(reste[0].id);
          }}
          className="inline-flex min-h-11 items-center gap-2 font-display text-sm font-bold text-rouge"
        >
          <Trash2 aria-hidden size={16} /> Retirer ce marquage
        </button>
      ) : null}
    </div>
  );
}
