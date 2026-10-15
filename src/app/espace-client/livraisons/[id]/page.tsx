import { PageLivraison } from "@/components/espace-client/page-livraison";

export const metadata = { title: "Ma livraison" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageLivraison id={id} />;
}
