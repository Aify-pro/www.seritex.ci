import type { Metadata } from "next";
import { MessageCircle, Phone } from "lucide-react";
import { Configurateur } from "@/components/personnaliser/configurateur";
import { ButtonLink, Container, Etiquette } from "@/components/ui";
import { site } from "@/content/site";
import { getCatalogue } from "@/lib/catalogue-plateforme";
import { getReglages, MESSAGE_FERMETURE } from "@/lib/reglages-site";

const description =
  "Choisissez l'article, déposez votre logo, placez-le : votre maquette se construit sous vos yeux, puis votre conseiller Seritex établit le devis.";

export async function generateMetadata(): Promise<Metadata> {
  const { personnaliser } = await getReglages();
  return {
    title: "Personnaliser votre textile",
    description,
    // Indexée seulement quand l'outil est ouvert (Paramètres > Site web de la plateforme).
    robots: personnaliser ? undefined : { index: false, follow: false },
  };
}

// Catalogue et interrupteur viennent de la plateforme (mis en cache) : rendu à la demande.
export const dynamic = "force-dynamic";

export default async function PersonnaliserPage() {
  const reglages = await getReglages();
  const catalogue = reglages.personnaliser ? await getCatalogue() : [];

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
          {!reglages.personnaliser || catalogue.length === 0 ? (
            <div className="max-w-2xl border-2 border-ink bg-paper p-8 shadow-hard">
              <h2 className="font-display text-2xl font-black">
                {!reglages.personnaliser ? (reglages.message ?? MESSAGE_FERMETURE) : "Le catalogue en ligne arrive bientôt."}
              </h2>
              <p className="mt-3 text-muted">Décrivez votre projet : un conseiller vous recontacte rapidement avec un devis.</p>
              <ButtonLink href="/devis" variant="orange" className="mt-6">
                Demander un devis
              </ButtonLink>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <a href={site.contact.whatsappHref} className="inline-flex min-h-11 items-center gap-2 font-semibold hover:text-indigo">
                  <MessageCircle aria-hidden size={18} className="text-rouge" /> WhatsApp {site.contact.whatsapp}
                </a>
                <a href={site.contact.phoneHref} className="inline-flex min-h-11 items-center gap-2 font-semibold hover:text-indigo">
                  <Phone aria-hidden size={18} className="text-rouge" /> {site.contact.phone}
                </a>
              </div>
            </div>
          ) : (
            <Configurateur catalogue={catalogue} />
          )}
        </div>
      </Container>
    </section>
  );
}
