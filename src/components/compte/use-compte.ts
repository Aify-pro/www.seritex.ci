"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profil } from "@/lib/compte";

type Etat = { charge: boolean; disponible: boolean; profil: Profil | null };

/** Session du site : qui est connecté (cookies httpOnly, lus par /api/compte/session). */
export function useCompte() {
  const [etat, setEtat] = useState<Etat>({ charge: false, disponible: true, profil: null });

  const actualiser = useCallback(async () => {
    try {
      const r = await fetch("/api/compte/session", { cache: "no-store" });
      const j = (await r.json()) as { disponible: boolean; profil: Profil | null };
      setEtat({ charge: true, disponible: j.disponible, profil: j.profil });
    } catch {
      setEtat((e) => ({ ...e, charge: true }));
    }
  }, []);

  // Première lecture au montage (le résultat n'arrive qu'après la réponse du serveur).
  useEffect(() => {
    let actif = true;
    fetch("/api/compte/session", { cache: "no-store" })
      .then((r) => r.json() as Promise<{ disponible: boolean; profil: Profil | null }>)
      .then((j) => actif && setEtat({ charge: true, disponible: j.disponible, profil: j.profil }))
      .catch(() => actif && setEtat((e) => ({ ...e, charge: true })));
    return () => {
      actif = false;
    };
  }, []);

  const connecte = useCallback((profil: Profil) => setEtat({ charge: true, disponible: true, profil }), []);
  const deconnecter = useCallback(async () => {
    await fetch("/api/compte/deconnexion", { method: "POST" }).catch(() => null);
    setEtat((e) => ({ ...e, profil: null }));
  }, []);

  return { ...etat, connecte, deconnecter, actualiser };
}
