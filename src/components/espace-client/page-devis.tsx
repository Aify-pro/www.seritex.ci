"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDateFr, formatMontant, STATUT_DEVIS, type DevisDetail } from "@/lib/espace-client-types";
import { Chargement, Ecran, Message, Pastille } from "./ecran";
import { useDonnees } from "./use-donnees";

const bloc = "border-2 border-ink bg-paper p-5 shadow-hard-sm";

function Detail({ id }: { id: string }) {
  const r = useDonnees<{ devis: DevisDetail }>(`/api/espace-client/devis/${id}`);
  if (r.statut === "charge") return <Chargement />;
  if (r.statut === "introuvable") return <Message>Ce devis est introuvable.</Message>;
  if (r.statut === "deconnecte") return <Message alerte>Votre session a expiré. Rechargez la page pour vous reconnecter.</Message>;
  if (!r.donnees) return <Message alerte>Impossible de charger ce devis pour le moment.</Message>;
  const q = r.donnees.devis;
  const m = (v: number | null) => formatMontant(v, q.devise);
  const sommeLignes = q.lignes.reduce((n, l) => n + l.total, 0);
  const ht = q.total_ht ?? (q.tva_rate > 0 ? q.total - (q.total_tva ?? 0) : q.total);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-display text-2xl font-black">{q.reference}</p>
        <Pastille statut={q.statut} libelles={STATUT_DEVIS} />
        <span className="text-sm text-muted">Émis le {formatDateFr(q.date)}</span>
      </div>
      {(q.objet || q.reference_client || q.demande) && (
        <p className="text-muted">
          {q.objet && <>{q.objet}. </>}
          {q.reference_client && <>Votre référence : {q.reference_client}. </>}
          {q.demande && (
            <>
              Demande : <Link href={`/espace-client/demandes/${q.demande.id}`} className="font-bold underline">{q.demande.reference}</Link>.
            </>
          )}
        </p>
      )}

      <section className={`${bloc} overflow-x-auto`} aria-labelledby="lignes">
        <h2 id="lignes" className="font-display text-xl font-black">Articles</h2>
        <table className="mt-3 w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink font-mono text-xs tracking-wide uppercase">
              <th className="py-2 pr-3">Désignation</th>
              <th className="py-2 pr-3 text-right">Qté</th>
              <th className="py-2 pr-3 text-right">Prix unitaire</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {q.lignes.map((l, i) => (
              <tr key={i} className="border-b border-ink/20 align-top">
                <td className="py-2 pr-3">{l.description}{l.remise_pct > 0 ? <span className="text-muted"> (remise {l.remise_pct} %)</span> : null}</td>
                <td className="py-2 pr-3 text-right">{l.quantite}</td>
                <td className="py-2 pr-3 text-right">{m(l.prix_unitaire)}</td>
                <td className="py-2 text-right font-bold">{m(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          {q.remise_pct > 0 && (
            <div className="flex justify-between"><dt>Sous-total</dt><dd>{m(sommeLignes)}</dd></div>
          )}
          {q.remise_pct > 0 && (
            <div className="flex justify-between"><dt>Remise {q.remise_pct} %</dt><dd>− {m(sommeLignes - ht)}</dd></div>
          )}
          <div className="flex justify-between"><dt>Total HT</dt><dd>{m(ht)}</dd></div>
          {q.tva_rate > 0 ? (
            <div className="flex justify-between"><dt>TVA {q.tva_rate} %</dt><dd>{m(q.total_tva)}</dd></div>
          ) : q.exoneration ? (
            <div className="flex justify-between gap-4"><dt>TVA</dt><dd className="text-right">Exonéré : {q.exoneration}</dd></div>
          ) : null}
          <div className="flex justify-between border-t-2 border-ink pt-2 text-base font-black"><dt>Total à payer</dt><dd>{m(q.total)}</dd></div>
        </dl>
      </section>

      <section className={bloc} aria-labelledby="conditions">
        <h2 id="conditions" className="font-display text-xl font-black">Conditions</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          {q.valide_jusqu_au && (<><dt className="font-bold">Valable jusqu&apos;au</dt><dd>{formatDateFr(q.valide_jusqu_au)}</dd></>)}
          {q.delai && (<><dt className="font-bold">Délai de livraison</dt><dd>{q.delai}</dd></>)}
          {q.acompte_pct > 0 && (<><dt className="font-bold">Acompte</dt><dd>{q.acompte_pct} %</dd></>)}
          {q.mode_reglement && (<><dt className="font-bold">Mode de règlement</dt><dd>{q.mode_reglement}</dd></>)}
          {q.conditions_paiement && (<><dt className="font-bold">Conditions de paiement</dt><dd className="whitespace-pre-line">{q.conditions_paiement}</dd></>)}
        </dl>
        <p className="mt-4 text-sm text-muted">Pour accepter ce devis ou poser une question, écrivez-nous à info@seritex.ci en rappelant la référence {q.reference}.</p>
      </section>
    </div>
  );
}

export function PageDevis({ id }: { id: string }) {
  return (
    <Ecran titre="Mon devis" retour={`/espace-client/devis/${id}`}>
      {() => (
        <div className="space-y-6">
          <Link href="/espace-client/devis" className="inline-flex items-center gap-1 font-display text-sm font-bold underline">
            <ArrowLeft aria-hidden size={14} /> Tous mes devis
          </Link>
          <Detail id={id} />
        </div>
      )}
    </Ecran>
  );
}
