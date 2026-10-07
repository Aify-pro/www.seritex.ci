import { MessageCircle, Phone } from "lucide-react";
import { ButtonLink, Container, Etiquette } from "@/components/ui";
import { site } from "@/content/site";
import { MESSAGE_FERMETURE } from "@/lib/reglages-site";

/** Page affichée quand l'e-shop (ou la personnalisation) est désactivé dans la plateforme. */
export function FermetureEshop({ message }: { message: string | null }) {
  return (
    <section className="bg-toile py-12 sm:py-16">
      <Container>
        <Etiquette tone="rouge">E-shop Seritex</Etiquette>
        <div className="mt-8 max-w-2xl border-2 border-ink bg-paper p-8 shadow-hard">
          <h1 className="font-display text-3xl font-black">{message ?? MESSAGE_FERMETURE}</h1>
          <p className="mt-3 text-muted">Décrivez votre projet : un conseiller vous recontacte rapidement avec un devis.</p>
          <ButtonLink href="/devis" variant="orange" className="mt-6">
            Demander un devis
          </ButtonLink>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href={site.contact.whatsappHref} className="inline-flex min-h-11 items-center gap-2 font-semibold hover:text-indigo">
              <MessageCircle aria-hidden size={18} className="text-rouge" /> WhatsApp {site.contact.whatsapp}
            </a>
            <a href={site.contact.phoneHref} className="inline-flex min-h-11 items-center gap-2 font-semibold hover:text-indigo">
              <Phone aria-hidden size={18} className="text-rouge" /> {site.contact.phone}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
