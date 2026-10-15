import { PageCommandes } from "@/components/espace-client/page-commandes";

export const metadata = { title: "Mes commandes" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <PageCommandes />;
}
