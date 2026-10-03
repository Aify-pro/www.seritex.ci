import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container, Etiquette } from "@/components/ui";
import { getTechnique, techniques } from "@/content/techniques";

export function generateStaticParams() {
  return techniques.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata(props: PageProps<"/techniques/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const t = getTechnique(slug);
  return t ? { title: t.name, description: t.summary } : {};
}

const heroBg = {
  indigo: "bg-indigo text-white",
  orange: "bg-orange text-ink",
  rouge: "bg-rouge text-white",
  ink: "bg-ink text-ecru",
} as const;

export default async function TechniquePage(props: PageProps<"/techniques/[slug]">) {
  const { slug } = await props.params;
  const t = getTechnique(slug);
  if (!t) notFound();

  const idx = techniques.findIndex((x) => x.slug === t.slug);
  const next = techniques[(idx + 1) % techniques.length];

  return (
    <>
      <section className={`border-b-2 border-ink ${heroBg[t.color]}`}>
        <Container className="grid gap-10 py-14 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <Link href="/techniques" className="inline-flex min-h-11 items-center gap-2 font-mono text-xs tracking-widest uppercase hover:underline">
              <ArrowLeft aria-hidden size={14} /> Toutes les techniques
            </Link>
            <p className="mt-6 font-mono text-sm tracking-widest opacity-80">{t.code}</p>
            <h1 className="mt-2 font-display text-5xl leading-[0.9] font-black tracking-tighter text-balance sm:text-7xl">{t.name}</h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed opacity-90">{t.tagline}</p>
          </div>
          <div className="lg:col-span-5">
            <div className="rotate-2 border-2 border-ink bg-paper p-2 shadow-hard">
              <Image src={t.image} alt="" width={1200} height={800} preload sizes="(min-width: 1024px) 35vw, 100vw" className="aspect-[4/3] w-full object-cover" />
            </div>
          </div>
        </Container>
      </section>

      {/* Fiche technique façon étiquette d'entretien */}
      <section className="border-b-2 border-ink bg-paper">
        <Container>
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {t.specs.map((s) => (
              <div key={s.label} className="border-ink py-6 pr-4 lg:border-r-2 lg:px-6 lg:first:pl-0 lg:last:border-r-0">
                <dt className="font-mono text-xs tracking-widest text-rouge uppercase">{s.label}</dt>
                <dd className="mt-1 font-display text-xl font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container className="grid gap-16 lg:grid-cols-12">
          <div className="space-y-5 text-lg leading-relaxed text-muted lg:col-span-7">
            {t.intro.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
          <aside className="lg:col-span-5">
            <div className="border-2 border-ink bg-paper p-6 shadow-hard">
              <Etiquette tone="orange">Pour qui ? Pour quoi ?</Etiquette>
              <ul className="mt-5 space-y-3">
                {t.forWho.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span aria-hidden className="mt-2 size-2 shrink-0 bg-rouge" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </Container>
      </section>

      <section className="border-y-2 border-ink bg-ecru-dark py-20 sm:py-24">
        <Container>
          <h2 className="font-display text-4xl font-black sm:text-5xl">Comment ça marche ?</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {t.steps.map((s, i) => (
              <Reveal as="li" key={s} delay={i * 90} className="border-2 border-ink bg-paper p-6">
                <span className="font-display text-6xl font-black text-indigo">{i + 1}</span>
                <p className="mt-4 leading-relaxed">{s}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-14">
        <Container className="flex flex-wrap items-center justify-between gap-6">
          <p className="font-display text-2xl font-bold">
            Technique suivante : <span className="text-rouge">{next.name}</span>
          </p>
          <ButtonLink href={`/techniques/${next.slug}`} variant="paper">
            Découvrir <ArrowRight aria-hidden size={18} />
          </ButtonLink>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
