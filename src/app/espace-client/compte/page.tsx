import { PageCompte } from "@/components/espace-client/page-compte";

export const metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default function ComptePage() {
  return <PageCompte />;
}
