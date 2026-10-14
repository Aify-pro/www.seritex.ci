"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { compterPanier, EVENEMENT_PANIER } from "@/components/personnaliser/panier";

/** Lien « Panier (n) » de l'en-tête : n'apparaît que lorsque le panier contient des articles. */
export function LienPanier({ className = "" }: { className?: string }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let actif = true;
    const maj = () => void compterPanier().then((c) => actif && setN(c));
    maj();
    window.addEventListener(EVENEMENT_PANIER, maj);
    return () => {
      actif = false;
      window.removeEventListener(EVENEMENT_PANIER, maj);
    };
  }, []);

  if (n < 1) return null;
  return (
    <Link href="/e-shop/panier" className={`inline-flex min-h-11 items-center gap-2 font-display text-sm font-semibold whitespace-nowrap hover:text-indigo ${className}`}>
      <ShoppingBag aria-hidden size={18} />
      Panier
      <span className="grid min-w-6 place-items-center rounded-full bg-rouge px-1.5 font-mono text-xs text-white">{n}</span>
    </Link>
  );
}
