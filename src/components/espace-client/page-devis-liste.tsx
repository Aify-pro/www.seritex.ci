"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDateFr, formatMontant, STATUT_DEVIS, type DevisResume } from "@/lib/espace-client-types";
import { Chargement, Ecran, Message, Pastille } from "./ecran";
import { useDonnees } from "./use-donnees";

function Liste() {
  const r = useDonnees<{ devis: DevisResume[] }>("/api/espace-client/devis");
  if (r.statut === "charge") return <Chargement />;
  if (r.statut === "deconnecte") return <Message alerte>Votre session a expiré. Rechargez la page pour vous reconnecter.</Message>;
  if (!r.donnees) return <Message alerte>Impossible de charger vos devis pour le moment. Réessayez dans un instant.</Message>;
  if (r.donnees.devis.length === 0) return <Message>Aucun devis pour le moment. Ils apparaissent ici dès que Seritex vous les envoie.</Message>;
  return (
    <ul className="space-y-3">
      {r.donnees.devis.map((q) => (
        <li key={q.id}>
          <Link href={`/espace-client/devis/${q.id}`} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-paper p-4 shadow-hard-sm transition hover:-translate-y-0.5">
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-black">{q.reference}</p>
              <p className="text-sm text-muted">Émis le {formatDateFr(q.date)}{q.valide_jusqu_au ? ` · valable jusqu'au ${formatDateFr(q.valide_jusqu_au)}` : ""}</p>
            </div>
            <span className="font-bold">{formatMontant(q.total, q.devise)}</span>
            <Pastille statut={q.statut} libelles={STATUT_DEVIS} />
            <ArrowRight aria-hidden size={18} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PageDevisListe() {
  return (
    <Ecran titre="Mes devis" retour="/espace-client/devis">
      {() => <Liste />}
    </Ecran>
  );
}
