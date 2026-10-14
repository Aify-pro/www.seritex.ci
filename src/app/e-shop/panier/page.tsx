import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FermetureEshop } from "@/components/eshop/fermeture";
import { PagePanier } from "@/components/eshop/page-panier";
import { Container } from "@/components/ui";
import { getReglages } from "@/lib/reglages-site";

export const metadata: Metadata = { title: "Mon panier", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Panier de l'e-shop : les articles composés, puis UNE demande de devis pour tous. */
export default async function PanierPage() {
  const reglages = await getReglages();
  if (!reglages.eshop || !reglages.personnaliser) return <FermetureEshop message={reglages.message} />;
  return (
    <section className="bg-toile py-10 sm:py-14">
      <Container>
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 font-mono text-xs tracking-wider uppercase">
          <Link href="/e-shop" className="hover:text-rouge">
            E-shop
          </Link>
          <ChevronRight aria-hidden size={14} />
          <span aria-current="page">Mon panier</span>
        </nav>
        <h1 className="mt-4 font-display text-5xl leading-[0.9] font-black tracking-tighter sm:text-6xl">Mon panier</h1>
        <div className="mt-8">
          <PagePanier />
        </div>
      </Container>
    </section>
  );
}
