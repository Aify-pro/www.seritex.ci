"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";

const MAX = 4000;

/** Écrire à Seritex dans le fil d'une demande. */
export function EcrireMessage({ demandeId, apres }: { demandeId: string; apres: () => void }) {
  const [texte, setTexte] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [retour, setRetour] = useState<{ ok: boolean; message: string } | null>(null);

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (occupe || !texte.trim()) return;
    setOccupe(true);
    setRetour(null);
    try {
      const r = await fetch(`/api/espace-client/demandes/${demandeId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texte }) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (r.ok && j.ok) {
        setTexte("");
        setRetour({ ok: true, message: "Message envoyé." });
        apres();
      } else {
        setRetour({ ok: false, message: j.message ?? "Votre message n'a pas pu être envoyé. Réessayez." });
      }
    } catch {
      setRetour({ ok: false, message: "Connexion impossible. Votre message n'est pas parti : réessayez." });
    } finally {
      setOccupe(false);
    }
  }

  return (
    <form onSubmit={envoyer} className="mt-5 space-y-3">
      <label htmlFor="nouveau-message" className="font-display text-sm font-bold">
        Écrire à Seritex
      </label>
      <textarea
        id="nouveau-message"
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        maxLength={MAX}
        rows={4}
        className="block w-full border-2 border-ink bg-paper px-4 py-3 text-base text-ink focus:border-indigo focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={occupe || !texte.trim()} className="inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-orange px-5 font-display font-bold shadow-hard-sm disabled:cursor-not-allowed disabled:opacity-50">
          {occupe ? <Loader2 aria-hidden className="animate-spin" size={16} /> : <Send aria-hidden size={16} />} Envoyer
        </button>
        <span className="text-xs text-muted">{texte.length} / {MAX}</span>
        {retour && (
          <p role={retour.ok ? "status" : "alert"} className={retour.ok ? "text-sm text-indigo" : "text-sm text-rouge"}>
            {retour.message}
          </p>
        )}
      </div>
    </form>
  );
}
