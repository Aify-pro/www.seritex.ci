"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDateFr, ETAT_LIVRAISON, type LivraisonListe } from "@/lib/espace-client-types";
import { Chargement, Ecran, Message, Pastille } from "./ecran";
import { useDonnees } from "./use-donnees";

function Liste() {
  const r = useDonnees<{ livraisons: LivraisonListe[] }>("/api/espace-client/livraisons");
  if (r.statut === "charge") return <Chargement />;
  if (r.statut === "deconnecte") return <Message alerte>Votre session a expiré. Rechargez la page pour vous reconnecter.</Message>;
  if (!r.donnees) return <Message alerte>Impossible de charger vos livraisons pour le moment. Réessayez dans un instant.</Message>;
  if (r.donnees.livraisons.length === 0) return <Message>Aucune livraison pour le moment. Elles apparaissent ici dès que votre commande est prête à partir.</Message>;
  return (
    <ul className="space-y-3">
      {r.donnees.livraisons.map((l) => (
        <li key={l.id}>
          <Link href={`/espace-client/livraisons/${l.id}`} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-paper p-4 shadow-hard-sm transition hover:-translate-y-0.5">
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-black">{l.reference ?? "Bon de livraison en préparation"}</p>
              <p className="text-sm text-muted">
                {l.commande ? `Commande ${l.commande} · ` : ""}
                {l.quantite} pièce{l.quantite > 1 ? "s" : ""}
                {l.mode === "retrait" ? " · retrait sur place" : l.lieu ? ` · ${l.lieu}` : ""}
                {l.date ? ` · ${formatDateFr(l.date)}` : ""}
              </p>
            </div>
            <Pastille statut={l.etat} libelles={ETAT_LIVRAISON} />
            <ArrowRight aria-hidden size={18} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PageLivraisons() {
  return (
    <Ecran titre="Mes livraisons" retour="/espace-client/livraisons">
      {() => <Liste />}
    </Ecran>
  );
}
