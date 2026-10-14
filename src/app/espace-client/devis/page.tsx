import { PageDevisListe } from "@/components/espace-client/page-devis-liste";

export const metadata = { title: "Mes devis" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <PageDevisListe />;
}
