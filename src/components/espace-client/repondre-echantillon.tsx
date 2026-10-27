"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { COMMENTAIRE_ECHANTILLON_MAX } from "@/lib/espace-client-types";
import type { EchantillonListe } from "@/lib/espace-client-types";

type Choix = "valide" | "a_ajuster" | "refuse";

/**
 * Réponse du client sur un échantillon reçu : il le valide, demande un ajustement ou le refuse. Valider engage la suite
 * (la fabrication ne peut démarrer qu'avec cette validation), d'où une confirmation explicite ; un ajustement ou un refus
 * exige un message, que l'atelier lira. La direction Seritex pose sa propre validation de son côté.
 */
export function RepondreEchantillon({ echantillon, apres }: { echantillon: EchantillonListe; apres: () => void }) {
  const [choix, setChoix] = useState<Choix | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [confirme, setConfirme] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    if (!choix || occupe) return;
    if (choix === "valide" && !confirme) return;
    if (choix !== "valide" && commentaire.trim().length < 3) {
      setErreur("Dites-nous en quelques mots ce qu'il faut ajuster.");
      return;
    }
    setOccupe(true);
    setErreur(null);
    try {
      const r = await fetch(`/api/espace-client/echantillons/${echantillon.id}/repondre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reponse: choix, commentaire }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (r.ok && j.ok) return apres();
      setErreur(j.message ?? "Votre réponse n'a pas pu être enregistrée. Réessayez ou contactez-nous.");
      // Déjà traité ailleurs : on recharge pour afficher le vrai statut.
      if (r.status === 409) apres();
    } catch {
      setErreur("Connexion impossible. Rien n'a été enregistré : réessayez.");
    } finally {
      setOccupe(false);
    }
  }

  if (!choix) {
    return (
      <div className="mt-3 space-y-3 border-t-2 border-ink/20 pt-3">
        <p className="font-bold">Cet échantillon vous convient-il ?</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setChoix("valide")} className="inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-indigo px-4 font-display font-bold text-white shadow-hard-sm">
            <CheckCircle2 aria-hidden size={18} /> Valider l&apos;échantillon
          </button>
          <button type="button" onClick={() => setChoix("a_ajuster")} className="inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-paper px-4 font-display font-bold shadow-hard-sm">
            <TriangleAlert aria-hidden size={18} /> À ajuster
          </button>
          <button type="button" onClick={() => setChoix("refuse")} className="min-h-11 px-3 font-bold underline">
            Refuser
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-2 border-ink bg-orange/15 p-4 shadow-hard-sm">
      {choix === "valide" ? (
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={confirme} onChange={(e) => setConfirme(e.target.checked)} className="mt-1 size-5 shrink-0 accent-indigo" />
          <span>
            Je valide l&apos;échantillon <strong>{echantillon.reference}</strong>. Je comprends que la fabrication de ma commande se fera conformément à cet échantillon.
          </span>
        </label>
      ) : null}
      <div>
        <label htmlFor={`echantillon-${echantillon.id}`} className="block font-bold">
          {choix === "valide" ? "Un commentaire ? (facultatif)" : choix === "a_ajuster" ? "Que faut-il ajuster ?" : "Pourquoi refusez-vous cet échantillon ?"}
        </label>
        <textarea
          id={`echantillon-${echantillon.id}`}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          maxLength={COMMENTAIRE_ECHANTILLON_MAX}
          rows={4}
          placeholder={choix === "valide" ? "" : "Ex. : le logo est trop bas de 2 cm, la couleur du col est trop claire…"}
          className="mt-1 w-full border-2 border-ink bg-paper p-3"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void envoyer()}
          disabled={occupe || (choix === "valide" && !confirme)}
          className="inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-indigo px-5 font-display font-bold text-white shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {occupe && <Loader2 aria-hidden className="animate-spin" size={18} />} {choix === "valide" ? "Confirmer la validation" : "Envoyer ma réponse"}
        </button>
        <button type="button" onClick={() => { setChoix(null); setErreur(null); setConfirme(false); }} disabled={occupe} className="min-h-11 px-3 font-bold underline">
          Retour
        </button>
      </div>
      {erreur && (
        <p role="alert" className="border-2 border-ink bg-paper p-3 text-rouge">
          {erreur}
        </p>
      )}
    </div>
  );
}
