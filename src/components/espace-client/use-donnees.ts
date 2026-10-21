"use client";

import { useCallback, useEffect, useState } from "react";

type Etat<T> = { statut: "charge" | "ok" | "introuvable" | "erreur" | "deconnecte" | "interdit"; donnees: T | null; recharger: () => void };

/** Lit une route /api/espace-client/* ; la clé d'état évite d'afficher l'ancienne réponse pendant un changement d'adresse. */
export function useDonnees<T>(url: string): Etat<T> {
  const [version, setVersion] = useState(0);
  const recharger = useCallback(() => setVersion((v) => v + 1), []);
  const [etat, setEtat] = useState<Omit<Etat<T>, "recharger"> & { url: string }>({ url, statut: "charge", donnees: null });
  useEffect(() => {
    let actif = true;
    fetch(url, { cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as T;
        const statut = r.status === 401 ? "deconnecte" : r.status === 403 ? "interdit" : r.status === 404 ? "introuvable" : r.ok ? "ok" : "erreur";
        if (actif) setEtat({ url, statut, donnees: statut === "ok" ? j : null });
      })
      .catch(() => actif && setEtat({ url, statut: "erreur", donnees: null }));
    return () => {
      actif = false;
    };
  }, [url, version]);
  return etat.url === url ? { ...etat, recharger } : { statut: "charge", donnees: null, recharger };
}
