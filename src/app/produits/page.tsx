import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container, PageHero } from "@/components/ui";
import { gammes } from "@/content/catalogue";

export const metadata: Metadata = {
  title: "Produits",
  description: "T-shirts, polos, chemises corporate, tenues de travail, chasubles, sport et goodies personnalisés par Seritex.",
};

export default function ProduitsPage() {
  return (
    <>
      <PageHero
        label="Catalogue"
        tone="orange"
        title="Tout ce qui se porte, à vos couleurs."
        intro="Chaque modèle est confectionné dans nos ateliers et entièrement personnalisable : coupe, couleur du tissu, marquage. Pour homme, femme et enfant."
      />

      <nav aria-label="Gammes" className="sticky top-18 z-40 border-b-2 border-ink bg-paper">
        <Container>
          <ul className="flex gap-2 overflow-x-auto py-3">
            {gammes.map((g) => (
              <li key={g.slug} className="shrink-0">
                <a href={`#${g.slug}`} className="inline-flex min-h-11 items-center border-2 border-ink px-4 font-display text-sm font-semibold hover:bg-orange">
                  {g.name}
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </nav>

      <div className="py-10">
        {gammes.map((g, i) => (
          <section key={g.slug} id={g.slug} className="scroll-mt-36 py-14">
            <Container>
              <Reveal className={`grid items-center gap-10 border-2 border-ink bg-paper p-6 shadow-hard sm:p-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className="flex items-center justify-center bg-ecru p-6">
                  <Image src={g.image} alt={`${g.name} personnalisés Seritex`} width={g.w} height={g.h} sizes="(min-width: 1024px) 40vw, 90vw" className="max-h-80 w-auto object-contain" />
                </div>
                <div>
                  <p className="font-mono text-xs tracking-widest text-rouge uppercase">Gamme {String(i + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 font-display text-4xl font-black sm:text-5xl">{g.name}</h2>
                  <p className="mt-4 text-lg leading-relaxed text-muted">{g.text}</p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {g.items.map((it) => (
                      <li key={it} className="border border-ink px-3 py-1 font-mono text-xs uppercase">
                        {it}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href={`/devis?produit=${g.slug}`} variant="orange" className="mt-8">
                    Demander un devis <ArrowRight aria-hidden size={18} />
                  </ButtonLink>
                </div>
              </Reveal>
            </Container>
          </section>
        ))}
      </div>

      <CtaBand />
    </>
  );
}
