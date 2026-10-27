import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { ConfirmationLivraison } from "@/components/confirmation-livraison";
import { infoConfirmation } from "@/lib/confirmation-livraison";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Confirmer la réception de ma livraison", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const date = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Abidjan" }).format(new Date(iso));

/**
 * Page ouverte depuis l'e-mail « livraison effectuée » — sans compte : le lien personnel fait office d'identité.
 * Elle remplace l'ancienne page de la plateforme (app.seritex.ci), qui redirige désormais ici.
 */
export default async function ConfirmationLivraisonPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = await infoConfirmation(token);

  return (
    <section className="bg-toile py-12 sm:py-16">
      <Container>
        <div className="max-w-2xl space-y-6">
          {!info ? (
            <div role="alert" className="space-y-3 border-2 border-ink bg-paper p-6 shadow-hard">
              <h1 className="font-display text-3xl font-black">Ce lien n&apos;est pas valide.</h1>
              <p className="text-lg text-muted">
                Il est peut-être incomplet. Rouvrez le message reçu par e-mail, ou écrivez-nous à{" "}
                <a className="font-bold underline" href={`mailto:${site.contact.email}`}>
                  {site.contact.email}
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="font-mono text-sm uppercase tracking-wider text-muted">Confirmation de réception</p>
                <h1 className="font-display text-3xl font-black sm:text-4xl">Livraison {info.reference}</h1>
                <p className="mt-2 text-lg text-muted">
                  {[info.client_nom, `${info.pieces} pièce${info.pieces > 1 ? "s" : ""}`, info.livree_at ? `remise le ${date(info.livree_at)}` : null].filter(Boolean).join(" · ")}
                </p>
              </div>
              {info.reponse ? (
                <p role="status" className="border-2 border-ink bg-paper p-5 shadow-hard-sm">
                  Merci : votre réponse a bien été enregistrée.
                </p>
              ) : info.expire ? (
                <p role="alert" className="border-2 border-ink bg-orange/15 p-5 shadow-hard-sm">
                  Ce lien a expiré. Contactez-nous à{" "}
                  <a className="font-bold underline" href={`mailto:${site.contact.email}`}>
                    {site.contact.email}
                  </a>{" "}
                  si besoin.
                </p>
              ) : (
                <>
                  <p className="text-lg">Votre commande est-elle bien arrivée, complète et en bon état ? Votre retour nous aide à clore la livraison dans de bonnes conditions.</p>
                  <ConfirmationLivraison jeton={token} />
                </>
              )}
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
