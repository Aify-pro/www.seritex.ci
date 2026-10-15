import { PageEchantillons } from "@/components/espace-client/page-echantillons";

export const metadata = { title: "Mes échantillons" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <PageEchantillons />;
}
