import { PageDemande } from "@/components/espace-client/page-demande";

export const metadata = { title: "Ma demande" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageDemande id={id} />;
}
