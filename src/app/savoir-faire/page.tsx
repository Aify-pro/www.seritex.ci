import type { Metadata } from "next";
import Image from "next/image";
import { CtaBand } from "@/components/cta-band";
import { FilAuColis } from "@/components/fil-au-colis";
import { Reveal } from "@/components/reveal";
import { Container, Etiquette, PageHero, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Savoir-faire",
  description:
    "Seritex, entreprise de confection textile personnalisée à Abidjan : tricotage, teinture, confection et marquage dans nos propres ateliers.",
};

const ateliers = [
  {
    titre: "Tricotage",
    texte: "À partir du fil de coton, nous tricotons nous-mêmes le tissu de vos vêtements.",
    image: "/images/atelier/tricotage.webp",
    w: 1220,
    h: 409,
  },
  {
    titre: "Teinture",
    texte: "Nous teignons notre tissu : vos couleurs sont portées par la matière elle-même, pas seulement par le marquage.",
    image: "/images/atelier/teinture.webp",
    w: 1220,
    h: 409,
  },
  {
    titre: "Marquage",
    texte: "Sérigraphie, broderie, flex et impression numérique : plusieurs machines et presses pour produire de grandes séries en peu de temps.",
    image: "/images/atelier/serigraphie.webp",
    w: 1800,
    h: 488,
  },
];

export default function SavoirFairePage() {
  return (
    <>
      <PageHero
        label="Qui sommes-nous ?"
        title={
          <>
            Créateurs de visibilité <span className="text-orange">depuis plus de 25 ans.</span>
          </>
        }
        intro="Seritex crée des vêtements et accessoires personnalisés. Une équipe expérimentée, tournée vers la satisfaction de ses clients, qui a à cœur d'apporter des solutions efficaces dans le choix et la réalisation de vos supports marketing."
      />

      <section className="py-20 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionTitle label="Confection textile personnalisée" title="De l'étude de vos besoins à la livraison." />
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-muted lg:col-span-7">
            <p>
              Grâce à un équipement moderne et une unité de production rodée, nous confectionnons tous types de vêtements
              et d&apos;accessoires textiles.
            </p>
            <p>
              À partir du fil de coton, nous tricotons et teignons nous-mêmes notre tissu pour confectionner des modèles
              entièrement personnalisables : coupe, couleur, impression.
            </p>
            <p>
              Seritex s&apos;engage à respecter vos exigences de qualité et de délais, même sur des volumes conséquents :
              t-shirts, polos, rugby, tenues de travail, sportswear, débardeurs, layettes, banderoles, casquettes, sacs,
              serviettes…
            </p>
          </div>
        </Container>
      </section>

      <section className="border-y-2 border-ink bg-paper py-20 sm:py-28">
        <Container>
          <SectionTitle label="La chaîne de production" title="Du fil au colis, de A à Z." />
          <div className="mt-16">
            <FilAuColis />
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container className="space-y-20">
          {ateliers.map((a, i) => (
            <Reveal key={a.titre} className={`grid items-center gap-10 lg:grid-cols-12 ${i % 2 ? "lg:[direction:rtl]" : ""}`}>
              <div className="border-2 border-ink bg-paper p-2 shadow-hard lg:col-span-7 [direction:ltr]">
                <Image src={a.image} alt={`Atelier de ${a.titre.toLowerCase()} Seritex`} width={a.w} height={a.h} className="aspect-[16/7] w-full object-cover" sizes="(min-width: 1024px) 55vw, 100vw" />
              </div>
              <div className="lg:col-span-5 [direction:ltr]">
                <Etiquette tone={i === 1 ? "orange" : i === 2 ? "rouge" : "indigo"}>{`Atelier 0${i + 1}`}</Etiquette>
                <h2 className="mt-4 font-display text-4xl font-black sm:text-5xl">{a.titre}</h2>
                <p className="mt-4 text-lg leading-relaxed text-muted">{a.texte}</p>
              </div>
            </Reveal>
          ))}
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
