"use client";

import { useEffect, useState } from "react";

type Etat<T> = { statut: "charge" | "ok" | "introuvable" | "erreur" | "deconnecte"; donnees: T | null };

/** Lit une route /api/espace-client/* ; la clé d'état évite d'afficher l'ancienne réponse pendant un changement d'adresse. */
export function useDonnees<T>(url: string): Etat<T> {
  const [etat, setEtat] = useState<Etat<T> & { url: string }>({ url, statut: "charge", donnees: null });
  useEffect(() => {
    let actif = true;
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as T;
        const statut = r.status === 401 ? "deconnecte" : r.status === 404 ? "introuvable" : r.ok ? "ok" : "erreur";
        if (actif) setEtat({ url, statut, donnees: statut === "ok" ? j : null });
      })
      .catch(() => actif && setEtat({ url, statut: "erreur", donnees: null }));
    return () => {
      actif = false;
    };
  }, [url]);
  return etat.url === url ? etat : { statut: "charge", donnees: null };
}
