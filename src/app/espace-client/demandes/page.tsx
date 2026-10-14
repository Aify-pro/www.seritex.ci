import { PageDemandes } from "@/components/espace-client/page-demandes";

export const metadata = { title: "Mes demandes" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <PageDemandes />;
}
