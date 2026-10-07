import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { FermetureEshop } from "@/components/eshop/fermeture";
import { Configurateur } from "@/components/personnaliser/configurateur";
import { Container } from "@/components/ui";
import { couleursProposees, MENTION_INDISPONIBLE, trouverModele } from "@/lib/catalogue-plateforme";
import { getReglages } from "@/lib/reglages-site";

export async function generateMetadata(props: PageProps<"/e-shop/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const [{ eshop }, modele] = await Promise.all([getReglages(), trouverModele(slug)]);
  if (!eshop || !modele) return { title: "E-shop", robots: { index: false, follow: false } };
  return {
    title: `${modele.nom} personnalisé`,
    description: modele.texteCommercial ?? `${modele.nom} confectionné par Seritex, personnalisable avec votre logo.`,
  };
}

export const dynamic = "force-dynamic";

/**
 * Fiche article de l'e-shop : présentation, puis le parcours de
 * personnalisation (couleur et quantité, logo et emplacement, contrôles,
 * maquette et envoi) — ou, si la personnalisation est désactivée dans la
 * plateforme, une demande de devis pour cet article.
 */
export default async function FicheArticlePage(props: PageProps<"/e-shop/[slug]">) {
  const { slug } = await props.params;
  const reglages = await getReglages();
  if (!reglages.eshop) return <FermetureEshop message={reglages.message} />;

  const modele = await trouverModele(slug);
  if (!modele) notFound();

  const couleurs = couleursProposees(modele);
  const indispo = modele.statut === "indisponible" || couleurs.length === 0;

  return (
    <section className="bg-toile py-10 sm:py-14">
      <Container>
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 font-mono text-xs tracking-wider uppercase">
          <Link href="/e-shop" className="hover:text-rouge">
            E-shop
          </Link>
          <ChevronRight aria-hidden size={14} />
          <span aria-current="page">{modele.nom}</span>
        </nav>
        <h1 className="mt-4 font-display text-5xl leading-[0.9] font-black tracking-tighter sm:text-6xl">{modele.nom}</h1>
        <p className="mt-3 flex flex-wrap gap-2 text-sm">
          {[modele.sousFamille ?? modele.famille, ...modele.grammages.map((g) => (g.grammage ? `${g.grammage} g/m²` : g.nom))]
            .filter(Boolean)
            .map((t) => (
              <span key={t} className="border border-ink bg-paper px-2 py-1">
                {t}
              </span>
            ))}
        </p>
        {modele.texteCommercial ? <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">{modele.texteCommercial}</p> : null}

        <div className="mt-10">
          {indispo ? (
            <AppelDevis titre={MENTION_INDISPONIBLE} />
          ) : reglages.personnaliser ? (
            <Configurateur modele={modele} />
          ) : (
            <div className="space-y-6">
              <div>
                <p className="font-display text-lg font-bold">Couleurs disponibles</p>
                <ul className="mt-3 flex flex-wrap gap-3">
                  {couleurs.map((c) => (
                    <li key={c.id} className="flex w-20 flex-col items-center gap-1 text-center text-xs">
                      <span className="size-10 rounded-full border-2 border-ink" style={{ background: c.hex ?? "#ccc" }} />
                      {c.nom}
                    </li>
                  ))}
                </ul>
              </div>
              <AppelDevis titre="Intéressé par cet article ?" />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function AppelDevis({ titre }: { titre: string }) {
  return (
    <div className="max-w-2xl border-2 border-ink bg-paper p-8 shadow-hard">
      <h2 className="font-display text-2xl font-black">{titre}</h2>
      <p className="mt-3 text-muted">Décrivez votre projet : votre conseiller Seritex vous recontacte avec un devis.</p>
      <Link href="/devis" className="mt-6 inline-flex min-h-12 items-center border-2 border-ink bg-orange px-6 font-display font-bold">
        Demander un devis
      </Link>
    </div>
  );
}
