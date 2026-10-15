import { PageDemande } from "@/components/espace-client/page-demande";

export const metadata = { title: "Ma demande" };
export const dynamic = "force-dynamic";

/** Référence de devis acceptée dans le lien « demander un ajustement » (jamais du texte libre : il préremplit un message). */
const REFERENCE_DEVIS = /^[A-Za-z0-9-]{3,40}$/;

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ajuster?: string }> }) {
  const { id } = await params;
  const { ajuster } = await searchParams;
  const messageInitial =
    typeof ajuster === "string" && REFERENCE_DEVIS.test(ajuster)
      ? `Bonjour, je souhaite un ajustement (répartition par taille, quantités) avant d'accepter le devis ${ajuster} : `
      : "";
  return <PageDemande id={id} messageInitial={messageInitial} />;
}
