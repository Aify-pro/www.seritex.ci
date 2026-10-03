import type { Metadata } from "next";
import { Container, PageHero } from "@/components/ui";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

// ⚠️ Les champs « À COMPLÉTER » étaient déjà vides sur l'ancien site : à renseigner avant la mise en ligne.
const editeur = [
  { label: "Raison sociale", value: "À COMPLÉTER" },
  { label: "Siège social", value: site.contact.address },
  { label: "RCCM", value: "À COMPLÉTER" },
  { label: "N° de compte contribuable", value: "À COMPLÉTER" },
  { label: "Téléphone", value: site.contact.phone },
  { label: "E-mail", value: site.contact.email },
  { label: "Directeur de la publication", value: "À COMPLÉTER" },
  { label: "Hébergeur", value: "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis" },
];

export default function MentionsLegalesPage() {
  return (
    <>
      <PageHero label="Informations légales" tone="ink" title="Mentions légales" />
      <section className="py-16 sm:py-20">
        <Container className="max-w-3xl! space-y-10 text-lg leading-relaxed">
          <dl className="border-2 border-ink bg-paper">
            {editeur.map((e) => (
              <div key={e.label} className="grid gap-1 border-ink p-4 not-last:border-b-2 sm:grid-cols-3">
                <dt className="font-mono text-xs tracking-widest text-muted uppercase">{e.label}</dt>
                <dd className={`sm:col-span-2 ${e.value === "À COMPLÉTER" ? "font-bold text-rouge" : ""}`}>{e.value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h2 className="font-display text-2xl font-bold">Propriété intellectuelle</h2>
            <p className="mt-3 text-muted">
              Les textes, photos, logos et marques reproduits sur ce site sont protégés par le droit de la propriété
              intellectuelle. Toute reproduction, totale ou partielle, sans autorisation de Seritex est interdite. Les
              logos et marques des clients présentés restent la propriété de leurs titulaires respectifs.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Données personnelles</h2>
            <p className="mt-3 text-muted">
              Les informations transmises par le formulaire de devis servent uniquement à traiter votre demande. Seritex
              s&apos;engage à les garder confidentielles et à ne pas les transmettre à des tiers. Vous pouvez demander
              l&apos;accès, la rectification ou la suppression de vos données en écrivant à {site.contact.email}.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Responsabilité</h2>
            <p className="mt-3 text-muted">
              Seritex ne saurait être tenue responsable des difficultés d&apos;accès au site ni des contenus des sites
              tiers accessibles par des liens. Seritex peut modifier ou interrompre tout ou partie du site sans préavis.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
