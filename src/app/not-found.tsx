import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="bg-toile py-24 sm:py-32">
      <Container>
        <p className="font-mono text-sm tracking-widest text-rouge uppercase">Erreur 404</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] font-black tracking-tighter sm:text-8xl">
          Ce fil-là
          <br />
          s&apos;est cassé.
        </h1>
        <p className="mt-6 max-w-lg text-lg text-muted">La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
        <ButtonLink href="/" variant="orange" className="mt-10">
          Retour à l&apos;accueil
        </ButtonLink>
      </Container>
    </section>
  );
}
