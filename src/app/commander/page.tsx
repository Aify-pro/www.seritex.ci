import type { Metadata } from "next";
import { CheckCircle2, LogIn } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Reveal } from "@/components/reveal";
import { ButtonLink, Container, Etiquette, PageHero } from "@/components/ui";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Comment commander",
  description: "Devis, BAT, production, livraison : comment se déroule une commande de vêtements personnalisés chez Seritex.",
};

const etapes = [
  {
    titre: "Votre demande de devis",
    texte: "Envoyez-nous votre besoin par le formulaire, par e-mail ou par téléphone. Nous vous présentons nos modèles : vous choisissez le modèle, les couleurs et les quantités par taille.",
  },
  {
    titre: "Validation du devis",
    texte: "Vous recevez votre devis par e-mail ou par un appel de votre conseiller. S'il vous convient, il vous indique la marche à suivre.",
  },
  {
    titre: "Règlement",
    texte: "Chèque, virement ou espèces : la commande est prise en compte à l'encaissement. Pour les sociétés, la totalité est demandée sauf arrangement préalable.",
  },
  {
    titre: "Le BAT (bon à tirer)",
    texte: "Nous vous envoyons un aperçu ou un échantillon pour valider l'emplacement et la taille de vos marquages. Il est modifiable sans frais jusqu'à votre accord. Pour la broderie et la sérigraphie, un test photographié vous est soumis.",
  },
  {
    titre: "Production",
    texte: "Une fois le BAT validé, nous produisons dans les délais convenus. Si la production se termine plus tôt, vous êtes prévenu.",
  },
  {
    titre: "Livraison ou retrait",
    texte: "Vous êtes livré par notre propre service de livraison, ou vous retirez votre commande à l'atelier, sur rendez-vous.",
  },
];

const checklist = [
  "Type de textile : t-shirts, polos, chemises, sweats, casquettes…",
  "Couleur des textiles (les prix diffèrent entre blanc et couleur)",
  "Quantités par taille (tarifs dégressifs)",
  "Votre logo en pièce jointe (un JPG suffit pour un aperçu)",
  "Emplacement et taille du marquage : cœur, dos, épaule · A4, A3, cœur",
  "Délai souhaité (une urgence entraîne une majoration)",
  "Livraison par nos soins ou retrait à l'atelier",
];

export default function CommanderPage() {
  return (
    <>
      <PageHero
        label="Comment passer commande ?"
        tone="ink"
        title={
          <>
            Six étapes, <span className="text-orange">zéro surprise.</span>
          </>
        }
        intro="Rien ne part en production sans votre validation : le BAT est la règle, pas l'exception."
      />

      <section className="py-20 sm:py-28">
        <Container className="grid gap-16 lg:grid-cols-12">
          <ol className="lg:col-span-7">
            {etapes.map((e, i) => (
              <Reveal as="li" key={e.titre} delay={i * 60} className="relative flex gap-6 pb-12 last:pb-0">
                {i < etapes.length - 1 ? <span aria-hidden className="couture-v absolute top-14 bottom-0 left-[27px] text-rouge" /> : null}
                <span
                  className={`relative z-10 inline-flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-xl font-black ${
                    e.titre.startsWith("Le BAT") ? "bg-orange" : "bg-paper"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="pt-2">
                  <h2 className="font-display text-2xl font-bold sm:text-3xl">{e.titre}</h2>
                  <p className="mt-2 text-lg leading-relaxed text-muted">{e.texte}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <aside className="space-y-8 lg:col-span-5">
            <div className="border-2 border-ink bg-paper p-6 shadow-hard lg:sticky lg:top-28">
              <Etiquette tone="indigo">Pour un devis rapide</Etiquette>
              <ul className="mt-5 space-y-3">
                {checklist.map((c) => (
                  <li key={c} className="flex gap-3">
                    <CheckCircle2 aria-hidden className="mt-0.5 shrink-0 text-rouge" size={20} />
                    {c}
                  </li>
                ))}
              </ul>
              <ButtonLink href="/devis" variant="orange" className="mt-8 w-full">
                Remplir le formulaire
              </ButtonLink>
              <div className="mt-8 border-t-2 border-dashed border-ink pt-6">
                <p className="font-display text-lg font-bold">Déjà client ?</p>
                <p className="mt-1 text-muted">Retrouvez vos demandes, devis et commandes dans votre espace client.</p>
                <a href={`${site.appUrl}/login`} className="mt-4 inline-flex min-h-11 items-center gap-2 font-display font-bold text-indigo underline decoration-2 underline-offset-4">
                  <LogIn aria-hidden size={18} /> Accéder à mon espace
                </a>
              </div>
            </div>
          </aside>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
