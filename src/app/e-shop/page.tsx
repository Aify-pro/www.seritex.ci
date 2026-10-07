import type { Metadata } from "next";
import Link from "next/link";
import { CarteArticle } from "@/components/eshop/carte-article";
import { FermetureEshop } from "@/components/eshop/fermeture";
import { Container, Etiquette } from "@/components/ui";
import { getCatalogue } from "@/lib/catalogue-plateforme";
import { getReglages } from "@/lib/reglages-site";

export async function generateMetadata(): Promise<Metadata> {
  const { eshop } = await getReglages();
  return {
    title: "E-shop",
    description: "Choisissez votre article, sa couleur et sa quantité, déposez votre logo : votre maquette se construit sous vos yeux, puis Seritex vous envoie le devis.",
    robots: eshop ? undefined : { index: false, follow: false },
  };
}

// Catalogue et interrupteurs viennent de la plateforme (cache d'une minute).
export const dynamic = "force-dynamic";

export default async function EshopPage(props: PageProps<"/e-shop">) {
  const reglages = await getReglages();
  const { famille } = await props.searchParams;

  if (!reglages.eshop) {
    return <FermetureEshop message={reglages.message} />;
  }

  const catalogue = await getCatalogue();
  const familles = [...new Set(catalogue.map((m) => m.sousFamille ?? m.famille).filter((f): f is string => !!f))].sort();
  const filtre = typeof famille === "string" && familles.includes(famille) ? famille : null;
  const articles = filtre ? catalogue.filter((m) => (m.sousFamille ?? m.famille) === filtre) : catalogue;

  return (
    <section className="bg-toile py-12 sm:py-16">
      <Container>
        <Etiquette tone="rouge">E-shop Seritex</Etiquette>
        <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.9] font-black tracking-tighter text-balance sm:text-6xl">
          Votre logo, sur <span className="text-rouge">votre</span> textile.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          {reglages.personnaliser
            ? "Choisissez l'article, sa couleur et la quantité, déposez votre logo et dites où le placer : la maquette se construit sous vos yeux. Votre conseiller Seritex établit ensuite le devis, et le BAT vous est soumis avant toute production."
            : "Les articles confectionnés dans nos ateliers. Choisissez le vôtre : votre conseiller Seritex établit le devis."}
        </p>

        {familles.length > 1 ? (
          <nav aria-label="Familles d'articles" className="mt-8 flex flex-wrap gap-2">
            {[null, ...familles].map((f) => (
              <Link
                key={f ?? "tout"}
                href={f ? `/e-shop?famille=${encodeURIComponent(f)}` : "/e-shop"}
                aria-current={f === filtre ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-2 border-ink px-4 font-display text-sm font-semibold ${
                  f === filtre ? "bg-ink text-ecru" : "bg-paper hover:bg-orange"
                }`}
              >
                {f ?? "Tout"}
              </Link>
            ))}
          </nav>
        ) : null}

        {articles.length === 0 ? (
          <div className="mt-10 max-w-2xl border-2 border-ink bg-paper p-8 shadow-hard">
            <h2 className="font-display text-2xl font-black">Le catalogue en ligne arrive bientôt.</h2>
            <p className="mt-3 text-muted">En attendant, décrivez votre projet : un conseiller vous recontacte rapidement.</p>
            <Link href="/devis" className="mt-6 inline-flex min-h-12 items-center border-2 border-ink bg-orange px-6 font-display font-bold">
              Demander un devis
            </Link>
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((m) => (
              <li key={m.id}>
                <CarteArticle modele={m} personnaliser={reglages.personnaliser} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
