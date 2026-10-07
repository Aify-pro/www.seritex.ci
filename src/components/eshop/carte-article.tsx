import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Apercu } from "@/components/personnaliser/apercu";
import { formePour } from "@/lib/marquage";
import { couleursProposees, MENTION_INDISPONIBLE, photoPour, slugModele, type ModeleCatalogue } from "@/lib/catalogue-plateforme";

/** Carte d'un article dans la liste de l'e-shop. Aucun prix : le prix vient du devis. */
export function CarteArticle({ modele, personnaliser }: { modele: ModeleCatalogue; personnaliser: boolean }) {
  const couleurs = couleursProposees(modele);
  const indispo = modele.statut === "indisponible" || couleurs.length === 0;
  const photo = photoPour(modele, null);

  return (
    <Link
      href={`/e-shop/${slugModele(modele)}`}
      className="group flex h-full flex-col border-2 border-ink bg-paper transition hover:-translate-y-1 hover:shadow-hard"
    >
      <span className="relative block aspect-square overflow-hidden border-b-2 border-ink bg-[radial-gradient(circle_at_50%_35%,#fffdf8,#ebe3d1)]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="block p-6">
            <Apercu vue="face" couleurHex={couleurs[0]?.hex ?? "#FFFFFF"} forme={formePour(modele.nom, modele.sousFamille)} marquages={[]} />
          </span>
        )}
        {modele.sousFamille ? (
          <span className="absolute top-3 left-3 bg-ink px-2 py-1 font-mono text-xs tracking-wider text-ecru uppercase">{modele.sousFamille}</span>
        ) : null}
      </span>
      <span className="flex flex-1 flex-col p-4">
        <span className="font-display text-xl font-black leading-tight">{modele.nom}</span>
        {indispo ? (
          <span className="mt-2 text-sm text-rouge">{MENTION_INDISPONIBLE}</span>
        ) : (
          <span className="mt-3 flex flex-wrap gap-1.5" aria-label={`${couleurs.length} couleur(s)`}>
            {couleurs.slice(0, 10).map((c) => (
              <span key={c.id} title={c.nom} className="size-5 rounded-full border border-ink" style={{ background: c.hex ?? "#ccc" }} />
            ))}
            {couleurs.length > 10 ? <span className="text-xs text-muted">+{couleurs.length - 10}</span> : null}
          </span>
        )}
        <span className="mt-auto pt-4 inline-flex items-center gap-2 font-display font-bold text-indigo group-hover:text-rouge">
          {indispo ? "Voir l'article" : personnaliser ? "Personnaliser" : "Voir l'article"} <ArrowRight aria-hidden size={18} />
        </span>
      </span>
    </Link>
  );
}
