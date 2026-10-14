"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDateFr, STATUT_DEMANDE, type DemandeListe } from "@/lib/espace-client-types";
import { Chargement, Ecran, Message, Pastille } from "./ecran";
import { useDonnees } from "./use-donnees";

function Liste() {
  const r = useDonnees<{ demandes: DemandeListe[] }>("/api/espace-client/demandes");
  if (r.statut === "charge") return <Chargement />;
  if (r.statut === "deconnecte") return <Message alerte>Votre session a expiré. Rechargez la page pour vous reconnecter.</Message>;
  if (!r.donnees) return <Message alerte>Impossible de charger vos demandes pour le moment. Réessayez dans un instant.</Message>;
  const { demandes } = r.donnees;
  return (
    <div className="space-y-6">
      {demandes.length === 0 ? (
        <Message>Vous n&apos;avez pas encore de demande. Composez un article sur l&apos;e-shop pour en envoyer une.</Message>
      ) : (
        <ul className="space-y-3">
          {demandes.map((d) => (
            <li key={d.id}>
              <Link href={`/espace-client/demandes/${d.id}`} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-paper p-4 shadow-hard-sm transition hover:-translate-y-0.5">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-black">{d.reference}</p>
                  <p className="truncate text-sm text-muted">
                    {d.resume}
                    {d.articles > 1 ? ` · ${d.articles} articles` : ""}
                    {d.pieces > 0 ? ` · ${d.pieces} pièces` : ""}
                  </p>
                </div>
                <span className="text-sm text-muted">{formatDateFr(d.date)}</span>
                <Pastille statut={d.statut} libelles={STATUT_DEMANDE} />
                <ArrowRight aria-hidden size={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/e-shop" className="inline-flex min-h-12 items-center border-2 border-ink bg-orange px-5 font-display font-bold shadow-hard-sm">
        Nouvelle demande
      </Link>
    </div>
  );
}

export function PageDemandes() {
  return (
    <Ecran titre="Mes demandes" retour="/espace-client/demandes">
      {() => <Liste />}
    </Ecran>
  );
}
