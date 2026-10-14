"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { formatMontant, type DevisDetail } from "@/lib/espace-client-types";

/**
 * Acceptation d'un devis envoyé. Action engageante : lance la fabrication, ne s'annule pas depuis le site.
 * D'où la case à cocher explicite (rappel du devis et du montant) AVANT que le bouton ne devienne actif.
 */
export function AccepterDevis({ devis, apres }: { devis: DevisDetail; apres: () => void }) {
  const [confirme, setConfirme] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function accepter() {
    if (!confirme || occupe) return;
    setOccupe(true);
    setErreur(null);
    try {
      const r = await fetch(`/api/espace-client/devis/${devis.id}/accepter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirme: true }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (r.ok && j.ok) return apres();
      setErreur(j.message ?? "L'acceptation n'a pas pu être enregistrée. Réessayez ou contactez-nous.");
      // Déjà traité ailleurs : on recharge pour afficher le vrai statut.
      if (r.status === 409) apres();
    } catch {
      setErreur("Connexion impossible. Rien n'a été validé : réessayez.");
    } finally {
      setOccupe(false);
    }
  }

  return (
    <section className="border-2 border-ink bg-orange/15 p-5 shadow-hard-sm" aria-labelledby="accepter">
      <h2 id="accepter" className="font-display text-xl font-black">Ce devis attend votre décision</h2>
      <label className="mt-3 flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={confirme} onChange={(e) => setConfirme(e.target.checked)} className="mt-1 size-5 shrink-0 accent-indigo" />
        <span>
          J&apos;accepte le devis <strong>{devis.reference}</strong> d&apos;un montant de <strong>{formatMontant(devis.total, devis.devise)}</strong>. Je comprends que
          cette acceptation lance la fabrication de ma commande et qu&apos;elle ne peut pas être annulée depuis le site.
        </span>
      </label>
      <button
        type="button"
        onClick={() => void accepter()}
        disabled={!confirme || occupe}
        className="mt-4 inline-flex min-h-12 items-center gap-2 border-2 border-ink bg-indigo px-5 font-display font-bold text-white shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        {occupe ? <Loader2 aria-hidden className="animate-spin" size={18} /> : <CheckCircle2 aria-hidden size={18} />} Accepter le devis
      </button>
      {erreur && (
        <p role="alert" className="mt-3 border-2 border-ink bg-paper p-3 text-rouge">
          {erreur}
        </p>
      )}
      <p className="mt-3 text-sm text-muted">Une question avant de décider ? Écrivez-nous depuis la page de votre demande, ou à info@seritex.ci.</p>
    </section>
  );
}
