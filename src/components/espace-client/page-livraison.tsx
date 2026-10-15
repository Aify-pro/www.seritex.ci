"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDateFr, ETAT_LIVRAISON, type LivraisonDetail } from "@/lib/espace-client-types";
import { Chargement, Ecran, Message, Pastille } from "./ecran";
import { useDonnees } from "./use-donnees";

const bloc = "border-2 border-ink bg-paper p-5 shadow-hard-sm";

function Detail({ id }: { id: string }) {
  const r = useDonnees<{ livraison: LivraisonDetail }>(`/api/espace-client/livraisons/${id}`);
  if (r.statut === "charge") return <Chargement />;
  if (r.statut === "introuvable") return <Message>Cette livraison est introuvable.</Message>;
  if (r.statut === "deconnecte") return <Message alerte>Votre session a expiré. Rechargez la page pour vous reconnecter.</Message>;
  if (!r.donnees) return <Message alerte>Impossible de charger cette livraison pour le moment.</Message>;
  const l = r.donnees.livraison;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-display text-2xl font-black">{l.reference ?? "Bon de livraison en préparation"}</p>
        <Pastille statut={l.etat} libelles={ETAT_LIVRAISON} />
      </div>
      <p className="text-muted">
        {l.commande ? `Commande ${l.commande}. ` : ""}
        {l.mode === "retrait" ? "Retrait sur place. " : l.lieu ? `Livraison : ${l.lieu}. ` : ""}
        {l.date ? `Date : ${formatDateFr(l.date)}.` : ""}
      </p>

      <section className={`${bloc} overflow-x-auto`} aria-labelledby="contenu">
        <h2 id="contenu" className="font-display text-xl font-black">Contenu ({l.quantite} pièce{l.quantite > 1 ? "s" : ""})</h2>
        {l.lignes.length === 0 ? (
          <p className="mt-3 text-muted">Le détail sera disponible une fois la livraison préparée.</p>
        ) : (
          <table className="mt-3 w-full min-w-[24rem] text-left text-sm">
            <thead>
              <tr className="border-b-2 border-ink font-mono text-xs tracking-wide uppercase">
                <th className="py-2 pr-3">Article</th>
                <th className="py-2 pr-3">Taille</th>
                <th className="py-2 pr-3 text-right">Quantité</th>
                <th className="py-2 text-right">Livrée</th>
              </tr>
            </thead>
            <tbody>
              {l.lignes.map((x, i) => (
                <tr key={i} className="border-b border-ink/20">
                  <td className="py-2 pr-3">{x.designation}</td>
                  <td className="py-2 pr-3">{x.taille ?? "—"}</td>
                  <td className="py-2 pr-3 text-right">{x.quantite}</td>
                  <td className="py-2 text-right">{x.livree ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {l.suivi.length > 0 && (
        <section className={bloc} aria-labelledby="suivi">
          <h2 id="suivi" className="font-display text-xl font-black">Suivi</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {l.suivi.map((e, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3">
                <Pastille statut={e.etat} libelles={ETAT_LIVRAISON} />
                <span className="text-muted">{formatDateFr(e.date)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <p className="text-sm text-muted">Pour un bon de livraison papier ou une question, écrivez à votre conseiller depuis la demande concernée ou à info@seritex.ci.</p>
      <Link href="/espace-client/livraisons" className="inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-paper px-4 font-display font-bold">
        <ArrowLeft aria-hidden size={16} /> Toutes mes livraisons
      </Link>
    </div>
  );
}

export function PageLivraison({ id }: { id: string }) {
  return (
    <Ecran titre="Ma livraison" retour={`/espace-client/livraisons/${id}`}>
      {() => <Detail id={id} />}
    </Ecran>
  );
}
