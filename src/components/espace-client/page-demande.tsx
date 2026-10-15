"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatDateFr, formatMontant, STATUT_DEMANDE, STATUT_DEVIS, type DemandeDetail } from "@/lib/espace-client-types";
import { Chargement, Ecran, Message, Pastille } from "./ecran";
import { EcrireMessage } from "./ecrire-message";
import { useDonnees } from "./use-donnees";

const bloc = "border-2 border-ink bg-paper p-5 shadow-hard-sm";

function Detail({ id, messageInitial }: { id: string; messageInitial: string }) {
  const r = useDonnees<{ demande: DemandeDetail }>(`/api/espace-client/demandes/${id}`);
  if (r.statut === "charge") return <Chargement />;
  if (r.statut === "introuvable") return <Message>Cette demande est introuvable.</Message>;
  if (r.statut === "deconnecte") return <Message alerte>Votre session a expiré. Rechargez la page pour vous reconnecter.</Message>;
  if (!r.donnees) return <Message alerte>Impossible de charger cette demande pour le moment.</Message>;
  const d = r.donnees.demande;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-display text-2xl font-black">{d.reference}</p>
        <Pastille statut={d.statut} libelles={STATUT_DEMANDE} />
        <span className="text-sm text-muted">Envoyée le {formatDateFr(d.date)}</span>
      </div>

      <section className={bloc} aria-labelledby="articles">
        <h2 id="articles" className="font-display text-xl font-black">{d.articles.length > 1 ? `Vos ${d.articles.length} articles` : "Votre demande"}</h2>
        {d.articles.length > 0 ? (
          <ol className="mt-3 space-y-4">
            {d.articles.map((a, i) => (
              <li key={i} className="border-t-2 border-ink pt-3 first:border-t-0 first:pt-0">
                <p className="font-bold">
                  {d.articles.length > 1 ? `${i + 1}. ` : ""}
                  {a.modele}
                  {a.couleur ? ` · ${a.couleur}` : ""}
                  {a.grammage ? ` · ${a.grammage} g/m²` : ""} — {a.quantite} pièce{a.quantite > 1 ? "s" : ""}
                </p>
                {a.marquages.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted">
                    {a.marquages.map((m, j) => (
                      <li key={j}>
                        {m.technique}
                        {m.largeur_cm ? ` · ${m.largeur_cm} cm` : ""}
                        {m.nb_couleurs ? ` · ${m.nb_couleurs} couleur${m.nb_couleurs > 1 ? "s" : ""}` : ""}
                        {m.consigne ? ` · « ${m.consigne} »` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 whitespace-pre-line">{d.description}</p>
        )}
      </section>

      <section className={bloc} aria-labelledby="devis">
        <h2 id="devis" className="font-display text-xl font-black">Devis</h2>
        {d.devis.length === 0 ? (
          <p className="mt-2 text-muted">Aucun devis pour le moment : notre équipe prépare votre proposition.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {d.devis.map((q) => (
              <li key={q.id}>
                <Link href={`/espace-client/devis/${q.id}`} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink p-3">
                  <span className="font-bold">{q.reference}</span>
                  <span>{formatMontant(q.total, q.devise)}</span>
                  <Pastille statut={q.statut} libelles={STATUT_DEVIS} />
                  <ArrowRight aria-hidden size={16} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={bloc} aria-labelledby="echanges">
        <h2 id="echanges" className="font-display text-xl font-black">Échanges</h2>
        {d.echanges.length === 0 ? (
          <p className="mt-2 text-muted">Aucun message pour le moment.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {d.echanges.map((m) => (
              <li key={m.id} className={`max-w-xl border-2 border-ink p-3 ${m.auteur === "vous" ? "ml-auto bg-ecru" : "bg-paper"}`}>
                <p className="font-mono text-xs tracking-wide text-muted uppercase">
                  {m.auteur === "vous" ? "Vous" : "Seritex"} · {formatDateFr(m.date)}
                </p>
                <p className="mt-1 whitespace-pre-line">{m.texte}</p>
              </li>
            ))}
          </ul>
        )}
        <EcrireMessage demandeId={d.id} apres={r.recharger} texteInitial={messageInitial} />
      </section>
    </div>
  );
}

export function PageDemande({ id, messageInitial = "" }: { id: string; messageInitial?: string }) {
  return (
    <Ecran titre="Ma demande" retour={`/espace-client/demandes/${id}`}>
      {() => (
        <div className="space-y-6">
          <Link href="/espace-client/demandes" className="inline-flex items-center gap-1 font-display text-sm font-bold underline">
            <ArrowLeft aria-hidden size={14} /> Toutes mes demandes
          </Link>
          <Detail id={id} messageInitial={messageInitial} />
        </div>
      )}
    </Ecran>
  );
}
