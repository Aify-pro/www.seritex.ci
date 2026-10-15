import { PageLivraisons } from "@/components/espace-client/page-livraisons";

export const metadata = { title: "Mes livraisons" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <PageLivraisons />;
}
