"use client";

import Link from "next/link";
import { formatDateFr, STATUT_ECHANTILLON, type EchantillonListe } from "@/lib/espace-client-types";
import { Chargement, Ecran, Message, Pastille, Interdit } from "./ecran";
import { useDonnees } from "./use-donnees";

function Liste() {
  const r = useDonnees<{ echantillons: EchantillonListe[] }>("/api/espace-client/echantillons");
  if (r.statut === "charge") return <Chargement />;
  if (r.statut === "deconnecte") return <Message alerte>Votre session a expiré. Rechargez la page pour vous reconnecter.</Message>;
  if (r.statut === "interdit") return <Interdit />;
  if (!r.donnees) return <Message alerte>Impossible de charger vos échantillons pour le moment. Réessayez dans un instant.</Message>;
  if (r.donnees.echantillons.length === 0) return <Message>Aucun échantillon pour le moment. Votre conseiller peut en préparer avant une commande ferme.</Message>;
  return (
    <ul className="space-y-3">
      {r.donnees.echantillons.map((e) => (
        <li key={e.id} className="border-2 border-ink bg-paper p-4 shadow-hard-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-lg font-black">{e.reference}</p>
            <Pastille statut={e.statut} libelles={STATUT_ECHANTILLON} />
          </div>
          <p className="mt-1">{e.besoin}</p>
          <p className="mt-1 text-sm text-muted">
            Demandé le {formatDateFr(e.date)}
            {e.echeance ? ` · attendu pour le ${formatDateFr(e.echeance)}` : ""}
            {e.demande ? (
              <>
                {" · demande "}
                <Link href={`/espace-client/demandes/${e.demande.id}`} className="font-bold underline">{e.demande.reference}</Link>
              </>
            ) : null}
          </p>
          {e.statut === "envoye" || e.statut === "recu_client" || e.statut === "en_validation" ? (
            <p className="mt-2 text-sm">Votre avis sur cet échantillon nous aide : écrivez à votre conseiller depuis la demande liée, ou à info@seritex.ci.</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function PageEchantillons() {
  return (
    <Ecran titre="Mes échantillons" retour="/espace-client/echantillons">
      {() => <Liste />}
    </Ecran>
  );
}
