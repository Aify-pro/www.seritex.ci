"use client";

import Link from "next/link";
import { formatDateFr, ETAT_COMMANDE, type CommandeListe } from "@/lib/espace-client-types";
import { Chargement, Ecran, Message, Pastille } from "./ecran";
import { useDonnees } from "./use-donnees";

function Liste() {
  const r = useDonnees<{ commandes: CommandeListe[] }>("/api/espace-client/commandes");
  if (r.statut === "charge") return <Chargement />;
  if (r.statut === "deconnecte") return <Message alerte>Votre session a expiré. Rechargez la page pour vous reconnecter.</Message>;
  if (!r.donnees) return <Message alerte>Impossible de charger vos commandes pour le moment. Réessayez dans un instant.</Message>;
  if (r.donnees.commandes.length === 0) return <Message>Aucune commande pour le moment. Elles apparaissent ici dès qu&apos;un devis est accepté.</Message>;
  return (
    <ul className="space-y-3">
      {r.donnees.commandes.map((c) => (
        <li key={c.id} className="border-2 border-ink bg-paper p-4 shadow-hard-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-lg font-black">{c.reference}</p>
            <Pastille statut={c.etat} libelles={ETAT_COMMANDE} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {c.quantite} pièce{c.quantite > 1 ? "s" : ""}
            {c.section ? ` · actuellement en ${c.section}` : ""}
            {c.etat !== "terminee" && c.etat !== "annulee" && c.prevue ? ` · livraison prévue le ${formatDateFr(c.prevue)}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted">
            Commandée le {formatDateFr(c.date)}
            {c.devis_reference ? ` · devis ${c.devis_reference}` : ""}
            {c.demande_id ? (
              <>
                {" · "}
                <Link href={`/espace-client/demandes/${c.demande_id}`} className="font-bold underline">voir la demande</Link>
              </>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function PageCommandes() {
  return (
    <Ecran titre="Mes commandes" retour="/espace-client/commandes">
      {() => <Liste />}
    </Ecran>
  );
}
