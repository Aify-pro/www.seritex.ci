import { ArrowRight, LogIn } from "lucide-react";
import { site } from "@/content/site";
import { ButtonLink, Container } from "./ui";

export function CtaBand() {
  return (
    <section className="relative overflow-hidden border-t-2 border-ink bg-orange">
      <Container className="relative grid items-center gap-10 py-20 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="font-display text-5xl leading-[0.9] font-black tracking-tighter text-balance sm:text-7xl">
            Un projet ? Parlons-en.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-ink/80">
            Décrivez votre besoin : produit, quantités, logo. Un conseiller commercial vous accompagne jusqu&apos;à la
            livraison.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:items-start">
          <ButtonLink href="/devis" variant="primary" className="text-lg">
            Demander un devis <ArrowRight aria-hidden size={20} />
          </ButtonLink>
          <a
            href={`${site.appUrl}/login`}
            className="inline-flex min-h-12 items-center gap-2 font-display font-bold underline decoration-2 underline-offset-4 hover:text-indigo"
          >
            <LogIn aria-hidden size={18} /> Déjà client ? Suivez vos commandes
          </a>
        </div>
      </Container>
      <svg aria-hidden className="pointer-events-none absolute -right-10 -bottom-16 w-72 text-rouge opacity-90" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="currentColor" />
      </svg>
    </section>
  );
}
