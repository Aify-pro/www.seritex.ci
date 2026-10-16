import { PageMediatheque } from "@/components/espace-client/page-mediatheque";

export const metadata = { title: "Ma médiathèque" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <PageMediatheque />;
}
