import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui";
import { retourSur } from "@/lib/compte";

export const metadata: Metadata = { title: "Adresse confirmée", robots: { index: false, follow: false } };

/**
 * Arrivée depuis le lien de confirmation envoyé par e-mail. Les jetons que
 * l'authentification ajoute à l'adresse ne sont ni lus ni conservés : la
 * personne se connecte avec son mot de passe, et retrouve sa composition
 * (gardée dans ce navigateur).
 */
export default async function ConfirmePage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { retour } = await props.searchParams;
  const cible = retourSur(Array.isArray(retour) ? retour[0] : retour);
  return (
    <section className="bg-toile py-16">
      <Container>
        <div role="status" className="max-w-xl space-y-4 border-2 border-ink bg-paper p-6 shadow-hard sm:p-8">
          <CheckCircle2 aria-hidden className="text-indigo" size={44} />
          <h1 className="font-display text-3xl font-black">Votre adresse est confirmée.</h1>
          <p className="text-lg text-muted">Connectez-vous pour valider votre demande. Si vous aviez commencé une maquette sur cet appareil, elle vous attend.</p>
          <Link href={cible} className="btn-presse inline-flex min-h-12 items-center border-2 border-ink bg-orange px-6 font-display font-bold text-ink">
            Retrouver ma composition
          </Link>
        </div>
      </Container>
    </section>
  );
}
