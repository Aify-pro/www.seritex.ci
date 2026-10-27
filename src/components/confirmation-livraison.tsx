"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { COMMENTAIRE_MAX } from "@/lib/confirmation-livraison";

type Etat = "choix" | "probleme" | "confirme" | "signale";

/**
 * Deux choix, comme dans l'e-mail : « tout est conforme » (un clic) ou « j'ai un problème » (un message
 * obligatoire). La réponse est définitive : le lien ne sert qu'une fois.
 */
export function ConfirmationLivraison({ jeton }: { jeton: string }) {
  const [etat, setEtat] = useState<Etat>("choix");
  const [commentaire, setCommentaire] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer(reponse: "confirme" | "probleme") {
    if (occupe) return;
    if (reponse === "probleme" && commentaire.trim().length < 3) {
      setErreur("Décrivez en quelques mots le problème rencontré.");
      return;
    }
    setOccupe(true);
    setErreur(null);
    try {
      const r = await fetch("/api/confirmation-livraison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jeton, reponse, commentaire }),
      });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (r.ok && j.ok) return setEtat(reponse === "confirme" ? "confirme" : "signale");
      setErreur(j.message ?? "Votre réponse n'a pas pu être enregistrée. Réessayez, ou contactez-nous.");
    } catch {
      setErreur("Connexion impossible. Rien n'a été enregistré : réessayez.");
    } finally {
      setOccupe(false);
    }
  }

  if (etat === "confirme" || etat === "signale") {
    return (
      <div role="status" className="space-y-3 border-2 border-ink bg-paper p-5 shadow-hard-sm">
        <CheckCircle2 aria-hidden className="text-indigo" size={36} />
        <h2 className="font-display text-xl font-black">{etat === "confirme" ? "Merci, réception confirmée." : "Merci, votre signalement est transmis."}</h2>
        <p className="text-muted">
          {etat === "confirme"
            ? "Nous avons bien noté que votre commande est arrivée en bon état. Nous restons à votre disposition pour vos prochains projets."
            : "Notre service livraison a été alerté et reviendra vers vous très rapidement pour trouver une solution."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {etat === "choix" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void envoyer("confirme")}
            disabled={occupe}
            className="inline-flex min-h-14 items-center justify-center gap-2 border-2 border-ink bg-indigo px-5 font-display font-bold text-white shadow-hard-sm disabled:opacity-50"
          >
            {occupe ? <Loader2 aria-hidden className="animate-spin" size={18} /> : <CheckCircle2 aria-hidden size={18} />} Tout est conforme
          </button>
          <button
            type="button"
            onClick={() => setEtat("probleme")}
            disabled={occupe}
            className="inline-flex min-h-14 items-center justify-center gap-2 border-2 border-ink bg-paper px-5 font-display font-bold text-ink shadow-hard-sm"
          >
            <TriangleAlert aria-hidden size={18} /> J&apos;ai un problème
          </button>
        </div>
      ) : (
        <div className="space-y-3 border-2 border-ink bg-orange/15 p-5 shadow-hard-sm">
          <label htmlFor="probleme" className="block font-display text-lg font-black">
            Quel problème avez-vous rencontré ?
          </label>
          <textarea
            id="probleme"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            maxLength={COMMENTAIRE_MAX}
            rows={5}
            placeholder="Ex. : 12 pièces manquantes en taille L, 3 articles tachés…"
            className="w-full border-2 border-ink bg-paper p-3"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void envoyer("probleme")}
              disabled={occupe}
              className="inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-indigo px-5 font-display font-bold text-white shadow-hard-sm disabled:opacity-50"
            >
              {occupe && <Loader2 aria-hidden className="animate-spin" size={18} />} Envoyer mon signalement
            </button>
            <button type="button" onClick={() => setEtat("choix")} disabled={occupe} className="min-h-12 px-3 font-bold underline">
              Retour
            </button>
          </div>
        </div>
      )}
      {erreur && (
        <p role="alert" className="border-2 border-ink bg-paper p-3 text-rouge">
          {erreur}
        </p>
      )}
    </div>
  );
}
