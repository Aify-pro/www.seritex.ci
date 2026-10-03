import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ClientsMarquee } from "@/components/clients-marquee";
import { CtaBand } from "@/components/cta-band";
import { FilAuColis } from "@/components/fil-au-colis";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container, Etiquette, SectionTitle } from "@/components/ui";
import { evenements, gammes, realisations } from "@/content/catalogue";
import { techniques } from "@/content/techniques";

const chiffres = [
  { valeur: "1\u00a0700", unite: "vues", texte: "au minimum pour un t-shirt porté : une publicité qui se déplace." },
  { valeur: "5", unite: "ans", texte: "de durée de vie moyenne pour un vêtement publicitaire." },
  { valeur: "100", unite: "%", texte: "maîtrisé : tricotage, teinture, confection et marquage chez nous." },
];

const forces = [
  { titre: "Capacité de production", texte: "Un équipement de pointe et des équipes dimensionnées pour les très grosses quantités." },
  { titre: "Personnalisation totale", texte: "Nous fabriquons de A à Z : coupe, couleur, impression, même pour des modèles complexes." },
  { titre: "Un conseiller dédié", texte: "Un commercial vous suit du devis jusqu'à la livraison, pour un produit conforme." },
  { titre: "Délais maîtrisés", texte: "Nous adaptons nos délais à l'urgence de votre commande." },
  { titre: "Tarifs dégressifs", texte: "Un prix juste selon les quantités, et des accords annuels pour les besoins réguliers." },
];

const valeurs = ["L'écoute", "Le conseil", "La proximité", "La réactivité", "La productivité"];

const techColors = {
  indigo: "bg-indigo text-white",
  orange: "bg-orange text-ink",
  rouge: "bg-rouge text-white",
  ink: "bg-ink text-ecru",
} as const;

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

        <Container className="relative grid gap-12 pt-12 pb-20 lg:grid-cols-12 lg:pt-20 lg:pb-28">
          <div className="lg:col-span-7">
            <Etiquette tone="indigo">Confection textile · Abidjan</Etiquette>
            <h1 className="mt-6 font-display text-[clamp(3.4rem,9vw,8.5rem)] leading-[0.85] font-black tracking-tighter">
              Vos couleurs,
              <br />
              <span className="text-indigo">du fil</span>{" "}
              <span className="relative inline-block text-rouge">
                au colis.
                <span aria-hidden className="couture absolute inset-x-1 -bottom-2 text-orange" />
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Seritex tricote, teint, confectionne et personnalise vos t-shirts, polos, tenues de travail et goodies.
              Une seule usine, un seul interlocuteur, des volumes conséquents dans les délais.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href="/devis" variant="orange" className="text-lg">
                Demander un devis <ArrowRight aria-hidden size={20} />
              </ButtonLink>
              <ButtonLink href="/realisations" variant="paper">
                Voir nos réalisations
              </ButtonLink>
            </div>
          </div>

          {/* Collage asymétrique */}
          <div className="relative min-h-[420px] lg:col-span-5">
            <figure className="absolute top-0 right-0 w-[78%] rotate-2 border-2 border-ink bg-paper p-2 shadow-hard">
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
            <figure className="absolute bottom-0 left-0 w-[58%] -rotate-3 border-2 border-ink bg-paper p-2 shadow-hard">
              <Image
                src="/images/photos/equipe-tabliers-orange.webp"
                alt="Une brigade en tabliers orange personnalisés"
                width={1800}
                height={1200}
                sizes="(min-width: 1024px) 22vw, 60vw"
                className="aspect-[4/3] w-full object-cover"
              />
            </figure>
            <div
              aria-hidden
              className="absolute right-[6%] bottom-[8%] flex size-32 rotate-12 items-center justify-center rounded-full border-2 border-ink bg-orange text-center font-display text-sm leading-tight font-black uppercase sm:size-36"
            >
              Fabriqué
              <br />
              en Côte
              <br />
              d&apos;Ivoire
            </div>
          </div>
        </Container>
      </section>

      <ClientsMarquee />

      {/* ───────────── Chiffres ───────────── */}
      <section className="py-20 sm:py-28">
        <Container>
          <SectionTitle
            label="Pourquoi le vêtement ?"
            title={
              <>
                La publicité qu&apos;on <span className="text-rouge">porte</span>.
              </>
            }
            intro="Peu cher et ambulant, le vêtement personnalisé reste l'objet incontournable pour faire connaître une marque, une association, une école. Porté au travail, au club de sport, dans le quartier."
          />
          <dl className="mt-14 grid border-2 border-ink bg-paper sm:grid-cols-3">
            {chiffres.map((c, i) => (
              <Reveal
                key={c.unite}
                delay={i * 100}
                className="border-ink p-8 not-last:border-b-2 sm:not-last:border-r-2 sm:not-last:border-b-0"
              >
                <dt className="sr-only">{c.texte}</dt>
                <dd>
                  <span className="font-display text-7xl font-black tracking-tighter text-indigo">{c.valeur}</span>
                  <span className="ml-2 font-mono text-sm tracking-widest text-rouge uppercase">{c.unite}</span>
                  <p aria-hidden className="mt-3 text-muted">
                    {c.texte}
                  </p>
                </dd>
              </Reveal>
            ))}
          </dl>
        </Container>
      </section>

      {/* ───────────── Du fil au colis ───────────── */}
      <section className="relative border-y-2 border-ink bg-indigo py-20 text-white sm:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <Etiquette tone="orange">Notre savoir-faire</Etiquette>
              <h2 className="mt-5 font-display text-4xl leading-[0.95] font-black tracking-tight sm:text-6xl">
                Nous fabriquons
                <br />
                <span className="text-orange">le tissu</span> lui-même.
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-white/80">
              À partir du fil de coton, nous tricotons et teignons notre propre tissu. C&apos;est ce qui nous permet de
              confectionner des modèles entièrement personnalisables, et de respecter vos exigences de qualité et de
              délais, même sur de gros volumes.
            </p>
          </div>
          <div className="mt-16">
            <FilAuColis dark />
          </div>
          <div className="mt-14">
            <ButtonLink href="/savoir-faire" variant="orange">
              Découvrir l&apos;atelier <ArrowRight aria-hidden size={18} />
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* ───────────── Techniques ───────────── */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle
              label="4 techniques de marquage"
              title="Le bon marquage pour chaque projet."
              intro="Grandes séries, rendu premium, photo ou numéros de maillot : nous vous orientons vers la technique adaptée."
            />
            <ButtonLink href="/techniques" variant="paper">
              Comparer les techniques
            </ButtonLink>
          </div>

          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {techniques.map((t, i) => (
              <Reveal as="li" key={t.slug} delay={i * 90}>
                <Link
                  href={`/techniques/${t.slug}`}
                  className={`group flex h-full flex-col border-2 border-ink p-6 shadow-hard transition-transform duration-200 hover:-translate-y-1 ${techColors[t.color]}`}
                >
                  <span className="font-mono text-xs tracking-widest opacity-80">{t.code}</span>
                  <h3 className="mt-10 font-display text-3xl leading-none font-black">{t.name}</h3>
                  <p className="mt-4 flex-1 text-[15px] leading-relaxed opacity-90">{t.summary}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-display font-bold">
                    En savoir plus
                    <ArrowUpRight aria-hidden size={18} className="transition-transform group-hover:rotate-45" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* ───────────── Gammes ───────────── */}
      <section className="border-y-2 border-ink bg-ecru-dark py-20 sm:py-28">
        <Container>
          <SectionTitle
            label="Nos produits"
            title={
              <>
                Pour homme, femme <span className="text-orange">&</span> enfant.
              </>
            }
          />
          <ul className="mt-14 grid auto-rows-[minmax(260px,auto)] gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {gammes.map((g, i) => (
              <Reveal
                as="li"
                key={g.slug}
                delay={(i % 4) * 80}
                className={i === 0 ? "sm:col-span-2 sm:row-span-2" : i === 3 || i === 6 ? "lg:col-span-2" : ""}
              >
                <Link
                  href={`/produits#${g.slug}`}
                  className="group relative flex h-full flex-col justify-between overflow-hidden border-2 border-ink bg-paper p-6 transition-colors hover:bg-white"
                >
                  <h3 className="relative z-10 font-display text-2xl font-black sm:text-3xl">{g.name}</h3>
                  <Image
                    src={g.image}
                    alt=""
                    width={g.w}
                    height={g.h}
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className={`mx-auto mt-4 w-auto object-contain transition-transform duration-500 group-hover:scale-105 ${
                      i === 0 ? "max-h-[420px]" : "max-h-44"
                    }`}
                  />
                  <span className="relative z-10 mt-4 inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase">
                    Voir la gamme <ArrowRight aria-hidden size={14} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* ───────────── Réalisations ───────────── */}
      <section className="py-20 sm:py-28">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle
              label="Nos réalisations"
              title="Les plus grandes marques portent nos vêtements."
              intro="Nous accompagnons les marques dans leur communication par le vêtement : lancements, campagnes, uniformes, événements sportifs."
            />
            <ButtonLink href="/realisations" variant="paper">
              Toute la galerie
            </ButtonLink>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
            {evenements.slice(0, 3).map((p, i) => (
              <Reveal
                key={p.src}
                delay={i * 80}
                className={`overflow-hidden border-2 border-ink ${i === 0 ? "col-span-2 row-span-2" : ""}`}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={1200}
                  height={800}
                  sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </Reveal>
            ))}
            {realisations.slice(0, 2).map((r, i) => (
              <Reveal key={r.src} delay={(i + 3) * 80} className="relative overflow-hidden border-2 border-ink">
                <Image
                  src={r.src}
                  alt={`Marquage réalisé pour ${r.client}`}
                  width={350}
                  height={280}
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="h-full w-full object-cover"
                />
                <Etiquette tone="paper" className="absolute bottom-3 left-0">
                  {r.client}
                </Etiquette>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ───────────── Forces & valeurs ───────────── */}
      <section className="border-t-2 border-ink bg-ink py-20 text-ecru sm:py-28">
        <Container className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Etiquette tone="orange">Nos forces</Etiquette>
            <h2 className="mt-5 font-display text-4xl leading-[0.95] font-black tracking-tight sm:text-6xl">
              Une usine, un interlocuteur.
            </h2>
            <ul className="mt-10 flex flex-wrap gap-3" aria-label="Nos valeurs">
              {valeurs.map((v, i) => (
                <li
                  key={v}
                  className={`border-2 border-ecru px-4 py-2 font-mono text-sm uppercase ${
                    i % 2 === 0 ? "-rotate-2" : "rotate-1"
                  }`}
                >
                  {v}
                </li>
              ))}
            </ul>
          </div>
          <ol className="lg:col-span-7">
            {forces.map((f, i) => (
              <Reveal as="li" key={f.titre} delay={i * 70} className="flex gap-6 border-b border-ecru/20 py-6 first:pt-0">
                <span className="font-mono text-sm text-orange">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-2xl font-bold">{f.titre}</h3>
                  <p className="mt-1 text-ecru/75">{f.texte}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
