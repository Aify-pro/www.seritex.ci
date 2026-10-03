import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { Container, PageHero } from "@/components/ui";
import { techniques } from "@/content/techniques";

export const metadata: Metadata = {
  title: "Techniques de marquage",
  description: "Sérigraphie, broderie, flex et quadriflex, impression numérique directe : comparez les techniques de marquage textile Seritex.",
};

export default function TechniquesPage() {
  const rows = techniques[0].specs.map((s) => s.label);
  return (
    <>
      <PageHero
        label="Techniques de marquage"
        tone="ink"
        title={
          <>
            Quatre façons de <span className="text-orange">porter</span> votre marque.
          </>
        }
        intro="Chaque technique a ses forces. Nous vous recommandons la plus adaptée à votre visuel, à votre textile et à vos quantités."
      />

      <section className="py-20 sm:py-28">
        <Container>
          <ul className="grid gap-8 md:grid-cols-2">
            {techniques.map((t, i) => (
              <Reveal as="li" key={t.slug} delay={(i % 2) * 100}>
                <Link href={`/techniques/${t.slug}`} className="group block h-full border-2 border-ink bg-paper shadow-hard">
                  <div className="overflow-hidden border-b-2 border-ink">
                    <Image src={t.image} alt="" width={1200} height={600} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[2/1] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-6 sm:p-8">
                    <span className="font-mono text-xs tracking-widest text-rouge">{t.code}</span>
                    <h2 className="mt-2 flex items-center justify-between gap-4 font-display text-3xl font-black">
                      {t.name}
                      <ArrowUpRight aria-hidden className="shrink-0 transition-transform group-hover:rotate-45" />
                    </h2>
                    <p className="mt-3 text-muted">{t.tagline}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t-2 border-ink bg-paper py-20 sm:py-28">
        <Container>
          <h2 className="font-display text-4xl font-black sm:text-5xl">Comparatif rapide</h2>
          <div className="mt-10 overflow-x-auto border-2 border-ink">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <caption className="sr-only">Comparaison des techniques de marquage</caption>
              <thead>
                <tr className="bg-ink text-ecru">
                  <th scope="col" className="p-4 font-mono text-xs tracking-widest uppercase">
                    Critère
                  </th>
                  {techniques.map((t) => (
                    <th key={t.slug} scope="col" className="p-4 font-display text-lg">
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((label, r) => (
                  <tr key={label} className="border-t-2 border-ink odd:bg-ecru">
                    <th scope="row" className="p-4 font-mono text-xs tracking-widest uppercase">
                      {label}
                    </th>
                    {techniques.map((t) => (
                      <td key={t.slug} className="p-4">
                        {t.specs[r].value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
