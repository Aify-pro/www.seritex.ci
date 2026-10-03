import type { Metadata } from "next";
import Image from "next/image";
import { ClientsMarquee } from "@/components/clients-marquee";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { Container, Etiquette, PageHero, SectionTitle } from "@/components/ui";
import { evenements, realisations } from "@/content/catalogue";

export const metadata: Metadata = {
  title: "Réalisations",
  description: "Campagnes, uniformes, événements : quelques vêtements personnalisés réalisés par Seritex pour les marques de Côte d'Ivoire.",
};

export default function RealisationsPage() {
  return (
    <>
      <PageHero
        label="Ils nous font confiance"
        title={
          <>
            Des milliers de pièces, <span className="text-orange">portées partout.</span>
          </>
        }
        intro="Nous accompagnons les plus grandes marques dans leur communication par le vêtement."
      />

      <ClientsMarquee />

      <section className="py-20 sm:py-28">
        <Container>
          <SectionTitle label="Gros plans" title="Le détail qui fait la marque." />
          <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {realisations.map((r, i) => (
              <Reveal as="li" key={r.src} delay={(i % 4) * 70} className="group relative overflow-hidden border-2 border-ink bg-paper">
                <Image src={r.src} alt={`${r.produit} personnalisé pour ${r.client}`} width={350} height={280} sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-[5/4] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <Etiquette tone="paper" className="absolute bottom-3 left-0">
                  {r.client}
                </Etiquette>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t-2 border-ink bg-ink py-20 text-ecru sm:py-28">
        <Container>
          <Etiquette tone="orange">Sur le terrain</Etiquette>
          <h2 className="mt-5 font-display text-4xl font-black sm:text-6xl">Campagnes &amp; événements</h2>
          <ul className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {evenements.map((p, i) => (
              <Reveal as="li" key={p.src} delay={(i % 3) * 80} className="mb-4 break-inside-avoid border-2 border-ecru">
                <Image src={p.src} alt={p.alt} width={1200} height={800} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="w-full" />
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
