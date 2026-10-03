import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { DevisForm } from "@/components/devis-form";
import { Container, Etiquette } from "@/components/ui";
import { produits } from "@/lib/demande";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Demander un devis",
  description: "Décrivez votre projet de vêtements personnalisés : un conseiller Seritex vous recontacte pour établir votre devis.",
};

export default async function DevisPage(props: PageProps<"/devis">) {
  const { produit } = await props.searchParams;
  const initial = typeof produit === "string" && produits.some((p) => p.value === produit) ? produit : "";

  return (
    <section className="bg-toile py-14 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Etiquette tone="rouge">Demande de devis</Etiquette>
          <h1 className="mt-6 font-display text-5xl leading-[0.9] font-black tracking-tighter sm:text-6xl">
            Parlez-nous de votre projet.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            Votre demande arrive directement chez nos conseillers commerciaux, dans l&apos;application Seritex. Ils vous
            recontactent pour affiner le devis et préparer le BAT.
          </p>

          <div className="mt-10 space-y-4 border-t-2 border-ink pt-8">
            <p className="font-mono text-xs tracking-widest uppercase">Vous préférez nous écrire ?</p>
            <a href={site.contact.whatsappHref} className="flex min-h-11 items-center gap-3 font-display font-semibold hover:text-indigo">
              <MessageCircle aria-hidden className="text-rouge" /> WhatsApp {site.contact.whatsapp}
            </a>
            <a href={site.contact.phoneHref} className="flex min-h-11 items-center gap-3 font-display font-semibold hover:text-indigo">
              <Phone aria-hidden className="text-rouge" /> {site.contact.phone}
            </a>
            <a href={`mailto:${site.contact.email}`} className="flex min-h-11 items-center gap-3 font-display font-semibold hover:text-indigo">
              <Mail aria-hidden className="text-rouge" /> {site.contact.email}
            </a>
          </div>
        </div>
        <div className="lg:col-span-8">
          <DevisForm key={initial} defaultProduit={initial} />
        </div>
      </Container>
    </section>
  );
}
