import type { Metadata } from "next";
import { Configurateur } from "@/components/personnaliser/configurateur";
import { ButtonLink, Container, Etiquette } from "@/components/ui";
import { getCatalogue } from "@/lib/catalogue-plateforme";

export const metadata: Metadata = {
  title: "Personnaliser votre textile",
  description: "Choisissez l'article, déposez votre logo, placez-le : votre maquette se construit sous vos yeux, puis votre conseiller Seritex établit le devis.",
  // Page pas encore annoncée (l'envoi arrive au lot suivant).
  robots: { index: false, follow: false },
};

// Le catalogue vient de la plateforme (mis en cache 5 minutes) : rendu à la demande.
export const dynamic = "force-dynamic";

export default async function PersonnaliserPage() {
  const catalogue = await getCatalogue();

  return (
    <section className="bg-toile py-12 sm:py-16">
      <Container>
        <Etiquette tone="rouge">Personnalisation en ligne</Etiquette>
        <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.9] font-black tracking-tighter text-balance sm:text-6xl">
          Votre logo, sur <span className="text-rouge">votre</span> textile.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          Choisissez l&apos;article, déposez votre logo, dites où le placer : la maquette se construit sous vos yeux et les contrôles de marquage sont
          faits. Votre conseiller Seritex établit ensuite le devis, et le BAT vous est soumis avant toute production.
        </p>

        <div className="mt-10">
          {catalogue.length === 0 ? (
            <div className="max-w-2xl border-2 border-ink bg-paper p-8 shadow-hard">
              <h2 className="font-display text-2xl font-black">Le catalogue en ligne arrive bientôt.</h2>
              <p className="mt-3 text-muted">En attendant, décrivez votre projet : un conseiller vous recontacte rapidement.</p>
              <ButtonLink href="/devis" variant="orange" className="mt-6">
                Demander un devis
              </ButtonLink>
            </div>
          ) : (
            <Configurateur catalogue={catalogue} />
          )}
        </div>
      </Container>
    </section>
  );
}
