import Link from "next/link";
import { Mail, MapPin, Phone, MessageCircle, Clock } from "lucide-react";
import { nav, site } from "@/content/site";
import { Container } from "./ui";

export function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-ink text-ecru">
      <Container className="grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-4xl leading-none font-black tracking-tight sm:text-5xl">
            Vos couleurs,
            <br />
            <span className="text-orange">du fil</span>
            <br />
            <span className="text-rouge">au colis.</span>
          </p>
          <p className="mt-6 max-w-sm text-ecru/75">{site.slogan}. Tricotage, teinture, confection et marquage à Abidjan.</p>
        </div>

        <div className="md:col-span-3">
          <h2 className="font-mono text-xs tracking-widest text-orange uppercase">Plan du site</h2>
          <ul className="mt-4 space-y-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-orange">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/devis" className="hover:text-orange">
                Demander un devis
              </Link>
            </li>
            <li>
              <a href={`${site.appUrl}/login`} className="hover:text-orange">
                Espace client
              </a>
            </li>
          </ul>
        </div>

        <address className="space-y-3 not-italic md:col-span-4">
          <h2 className="font-mono text-xs tracking-widest text-orange uppercase">Atelier</h2>
          <p className="flex gap-3">
            <MapPin aria-hidden className="mt-0.5 shrink-0 text-orange" size={18} />
            {site.contact.address}
          </p>
          <p className="flex gap-3">
            <Phone aria-hidden className="mt-0.5 shrink-0 text-orange" size={18} />
            <a href={site.contact.phoneHref} className="hover:text-orange">
              {site.contact.phone}
            </a>
          </p>
          <p className="flex gap-3">
            <MessageCircle aria-hidden className="mt-0.5 shrink-0 text-orange" size={18} />
            <a href={site.contact.whatsappHref} className="hover:text-orange">
              WhatsApp {site.contact.whatsapp}
            </a>
          </p>
          <p className="flex gap-3">
            <Mail aria-hidden className="mt-0.5 shrink-0 text-orange" size={18} />
            <a href={`mailto:${site.contact.email}`} className="hover:text-orange">
              {site.contact.email}
            </a>
          </p>
          <p className="flex gap-3">
            <Clock aria-hidden className="mt-0.5 shrink-0 text-orange" size={18} />
            {site.contact.hours}
          </p>
        </address>
      </Container>
      <div className="border-t border-ecru/15">
        <Container className="flex flex-col gap-2 py-6 text-sm text-ecru/60 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Seritex. Tous droits réservés.</p>
          <Link href="/mentions-legales" className="hover:text-orange">
            Mentions légales
          </Link>
        </Container>
      </div>
    </footer>
  );
}
