"use client";

import Link from "next/link";
import { Clock, Loader2 } from "lucide-react";
import { Identification } from "@/components/compte/identification";
import { useCompte } from "@/components/compte/use-compte";
import type { Profil } from "@/lib/compte";
import { MESSAGE_INTERDIT } from "@/lib/droits";
import { CadreEspace } from "./cadre";

export function Chargement() {
  return (
    <p role="status" className="text-muted">
      <Loader2 aria-hidden className="mr-2 inline animate-spin" size={16} /> Chargement…
    </p>
  );
}

/** Droit retiré par Seritex pour ce compte (403 des routes /api/espace-client). */
export function Interdit() {
  return <Message>{MESSAGE_INTERDIT}</Message>;
}

export function Message({ children, alerte = false }: { children: React.ReactNode; alerte?: boolean }) {
  return (
    <p role={alerte ? "alert" : "status"} className="max-w-2xl border-2 border-ink bg-orange/15 p-5">
      {children}
    </p>
  );
}

/**
 * Écran de l'espace client : demande de connexion si besoin, attente de rattachement,
 * sinon le contenu (rendu seulement pour un compte connecté ET rattaché).
 */
export function Ecran({ titre, retour, children }: { titre: string; retour: string; children: (profil: Profil) => React.ReactNode }) {
  const compte = useCompte();
  const profil = compte.profil;
  if (!compte.charge) return <Chargement />;
  if (!compte.disponible) return <Message alerte>L&apos;espace client est momentanément indisponible.</Message>;
  if (!profil) {
    return (
      <div className="max-w-2xl border-2 border-ink bg-paper p-5 shadow-hard sm:p-8">
        <Identification retour={retour} onConnecte={compte.connecte} />
      </div>
    );
  }
  return (
    <CadreEspace profil={profil} titre={titre} deconnecter={() => void compte.deconnecter()}>
      {profil.rattache ? (
        children(profil)
      ) : (
        <div role="status" className="max-w-2xl space-y-3 border-2 border-ink bg-orange/15 p-6">
          <Clock aria-hidden className="text-indigo" size={36} />
          <h2 className="font-display text-2xl font-black">Votre compte est en cours de rattachement.</h2>
          <p>Vos demandes et vos devis apparaîtront ici dès que notre équipe aura rattaché votre compte à votre fiche client.</p>
          <Link href="/e-shop" className="inline-flex min-h-11 items-center border-2 border-ink bg-orange px-4 font-display font-bold">
            Composer un article
          </Link>
        </div>
      )}
    </CadreEspace>
  );
}

const TONS: Record<string, string> = {
  acceptee: "bg-indigo text-white",
  accepte: "bg-indigo text-white",
  refusee: "bg-rouge text-white",
  refuse: "bg-rouge text-white",
  expire: "bg-rouge text-white",
  devis_envoye: "bg-orange",
  envoye: "bg-orange",
  infos_manquantes: "bg-orange",
};

export function Pastille({ statut, libelles }: { statut: string; libelles: Record<string, string> }) {
  return (
    <span className={`inline-flex items-center border-2 border-ink px-2 py-0.5 font-mono text-xs font-bold tracking-wide uppercase ${TONS[statut] ?? "bg-paper"}`}>
      {libelles[statut] ?? statut}
    </span>
  );
}
