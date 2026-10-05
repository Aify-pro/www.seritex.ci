import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ClientsMarquee } from "@/components/clients-marquee";
import { CtaBand } from "@/components/cta-band";
import { FilAuColis } from "@/components/fil-au-colis";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/scroll-effects";
import { ButtonLink, Container, Etiquette, SectionTitle } from "@/components/ui";
import { evenements } from "@/content/catalogue";
import { techniques } from "@/content/techniques";

const chiffres = [
  { valeur: 1700, unite: "vues", texte: "au minimum pour un t-shirt porté" },
  { valeur: 5, unite: "ans", texte: "de vie moyenne d'un vêtement publicitaire" },
  { valeur: 100, unite: "%", texte: "fabriqué chez nous, du fil au marquage" },
];

const techColors = {
  indigo: "bg-indigo text-white",
  orange: "bg-orange text-ink",
  rouge: "bg-rouge text-white",
  ink: "bg-ink text-ecru",
} as const;

/** Slogan découpé en mots pour l'animation d'entrée (le dernier mot est mis en couleur). */
const slogan = [
  { mot: "Votre", cls: "" },
  { mot: "marque", cls: "" },
  { mot: "sur", cls: "text-indigo" },
  { mot: "toutes", cls: "text-indigo" },
  { mot: "les", cls: "text-indigo" },
  { mot: "épaules.", cls: "text-rouge" },
];

export default function Home() {
  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="bg-toile relative overflow-hidden border-b-2 border-ink">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden h-full w-full text-rouge lg:block"
          viewBox="0 0 1440 800"
          preserveAspectRatio="none"
        >
          <path
            className="fil-anime"
            d="M760 -10 C 700 150, 860 300, 800 450 S 900 560, 1140 560 S 1300 500, 1460 640"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        <Container className="relative grid gap-12 pt-12 pb-14 lg:grid-cols-12 lg:pt-20">
          <div className="lg:col-span-7">
            <div className="apparait">
              <Etiquette tone="indigo">Confection textile · Abidjan</Etiquette>
            </div>
            <h1 className="mt-6 font-display text-[clamp(3.2rem,8.4vw,8rem)] leading-[0.88] font-black tracking-tighter">
              {slogan.map((s, i) => (
                <Fragment key={s.mot}>
                  <span className={`mot ${s.cls}`} style={{ "--i": i } as React.CSSProperties}>
                    {s.mot}
                  </span>{" "}
                </Fragment>
              ))}
            </h1>
            <p className="apparait mt-8 max-w-xl text-lg leading-relaxed text-muted sm:text-xl" style={{ "--d": "800ms" } as React.CSSProperties}>
              Nous tricotons, teignons, confectionnons et marquons vos t-shirts, polos et tenues de travail. Une seule
              usine, un seul interlocuteur, du fil au colis.
            </p>
            <div className="apparait mt-10 flex flex-wrap gap-4" style={{ "--d": "950ms" } as React.CSSProperties}>
              <ButtonLink href="/devis" variant="orange" className="text-lg">
                Demander un devis <ArrowRight aria-hidden size={20} />
              </ButtonLink>
              <ButtonLink href="/realisations" variant="paper">
                Voir nos réalisations
              </ButtonLink>
            </div>
          </div>

          {/* Collage asymétrique, en parallaxe */}
          <div className="apparait relative min-h-[420px] lg:col-span-5" style={{ "--d": "400ms" } as React.CSSProperties}>
            <div data-parallax="-0.12" className="absolute top-0 right-0 w-[78%]">
              <figure className="rotate-2 border-2 border-ink bg-paper p-2 shadow-hard">
                <Image
                  src="/images/photos/equipe-jaune-bras-leves.webp"
                  alt="Une équipe en t-shirts jaunes personnalisés lève les bras"
                  width={1800}
                  height={1200}
                  sizes="(min-width: 1024px) 30vw, 80vw"
                  className="aspect-[4/3] w-full object-cover"
                  preload
                />
              </figure>
            </div>
            <div data-parallax="0.1" className="absolute bottom-0 left-0 w-[58%]">
              <figure className="-rotate-3 border-2 border-ink bg-paper p-2 shadow-hard">
                <Image
                  src="/images/photos/equipe-tabliers-orange.webp"
                  alt="Une brigade en tabliers orange personnalisés"
                  width={1800}
                  height={1200}
                  sizes="(min-width: 1024px) 22vw, 60vw"
                  className="aspect-[4/3] w-full object-cover"
                />
              </figure>
            </div>
            <div aria-hidden className="absolute right-[6%] bottom-[8%] size-32 sm:size-36">
              <svg viewBox="0 0 160 160" className="tourne size-full">
                <defs>
                  <path id="cercle" d="M80 80 m -58 0 a 58 58 0 1 1 116 0 a 58 58 0 1 1 -116 0" />
                </defs>
                <circle cx="80" cy="80" r="78" fill="var(--orange)" stroke="var(--ink)" strokeWidth="3" />
                <text className="font-display" fontSize="14" fontWeight="800" fill="var(--ink)">
                  <textPath href="#cercle" textLength="356" lengthAdjust="spacing">
                    FABRIQUÉ EN CÔTE D&apos;IVOIRE ✦ SERITEX ✦
                  </textPath>
                </text>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-3xl font-black">CI</span>
            </div>
          </div>
        </Container>

        {/* Chiffres clés, intégrés au hero */}
        <Container className="relative pb-14">
          <dl className="grid border-2 border-ink bg-paper sm:grid-cols-3">
            {chiffres.map((c) => (
              <div key={c.unite} className="flex items-baseline gap-3 border-ink px-6 py-5 not-last:border-b-2 sm:not-last:border-r-2 sm:not-last:border-b-0">
                <dt className="sr-only">{c.texte}</dt>
                <dd className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display text-5xl font-black tracking-tighter text-indigo">
                    <CountUp to={c.valeur} />
                  </span>
                  <span className="font-mono text-xs tracking-widest text-rouge uppercase">{c.unite}</span>
                  <span aria-hidden className="w-full text-sm text-muted">
                    {c.texte}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <ClientsMarquee />

      {/* ───────────── Techniques ───────────── */}
      <section className="py-20 sm:py-24">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle label="4 techniques de marquage" title="Le bon marquage pour chaque projet." />
            <ButtonLink href="/techniques" variant="paper">
              Comparer les techniques
            </ButtonLink>
          </div>

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {techniques.map((t, i) => (
              <Reveal as="li" key={t.slug} delay={i * 110}>
                <Link
                  href={`/techniques/${t.slug}`}
                  className={`carte-vivante group flex h-full flex-col border-2 border-ink p-6 shadow-hard ${techColors[t.color]}`}
                >
                  <span className="font-mono text-xs tracking-widest opacity-80">{t.code}</span>
                  <h3 className="mt-8 font-display text-3xl leading-none font-black">{t.name}</h3>
                  <p className="mt-4 flex-1 text-[15px] leading-relaxed opacity-90">{t.summary}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-display font-bold">
                    En savoir plus
                    <ArrowUpRight aria-hidden size={18} className="transition-transform duration-300 group-hover:rotate-45" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* ───────────── Du fil au colis + pellicule ───────────── */}
      <section className="relative overflow-hidden border-y-2 border-ink bg-indigo pt-20 text-white sm:pt-24">
        <Container>
          <Reveal className="grid gap-8 lg:grid-cols-2 lg:items-end">
            <div>
              <Etiquette tone="orange">Notre savoir-faire</Etiquette>
              <h2 className="mt-5 font-display text-4xl leading-[0.95] font-black tracking-tight sm:text-6xl">
                Nous fabriquons <span className="text-orange">le tissu</span> lui-même.
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-white/80">
              À partir du fil de coton, nous tricotons et teignons notre tissu. Vos couleurs sont dans la matière, et nos
              délais ne dépendent de personne d&apos;autre.
            </p>
          </Reveal>
          <div className="mt-14">
            <FilAuColis dark />
          </div>
        </Container>

        {/* Pellicule de réalisations qui glisse au défilement */}
        <div className="mt-20 border-t-2 border-ink bg-ink py-8">
          <div data-parallax-x="-0.9" className="flex w-max gap-5 pl-[10vw]">
            {[...evenements, ...evenements.slice(0, 4)].map((p, i) => (
              <figure key={`${p.src}-${i}`} className={`w-72 shrink-0 border-2 border-ecru bg-ecru p-1.5 sm:w-80 ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
                <Image src={p.src} alt={p.alt} width={1200} height={800} sizes="320px" className="aspect-[4/3] w-full object-cover" />
              </figure>
            ))}
          </div>
          <Container className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="font-display text-2xl font-bold text-ecru">Des milliers de pièces, portées partout.</p>
            <ButtonLink href="/realisations" variant="orange">
              Toutes nos réalisations <ArrowRight aria-hidden size={18} />
            </ButtonLink>
          </Container>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
