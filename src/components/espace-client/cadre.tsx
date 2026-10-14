"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import type { Profil } from "@/lib/compte";

const LIENS = [
  { href: "/espace-client", label: "Mon espace" },
  { href: "/espace-client/demandes", label: "Mes demandes" },
  { href: "/espace-client/devis", label: "Mes devis" },
  { href: "/espace-client/compte", label: "Mon compte" },
] as const;

/** Cadre commun des pages de l'espace client une fois connecté : titre, navigation, déconnexion. */
export function CadreEspace({ profil, titre, deconnecter, children }: { profil: Profil; titre: string; deconnecter: () => void; children: React.ReactNode }) {
  const chemin = usePathname();
  const actif = (href: string) => (href === "/espace-client" ? chemin === href : chemin === href || chemin.startsWith(`${href}/`));
  return (
    <div>
      <p className="font-mono text-xs tracking-widest text-rouge uppercase">Espace client</p>
      <h1 className="mt-2 font-display text-4xl leading-[0.95] font-black tracking-tighter sm:text-5xl">{titre}</h1>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y-2 border-ink py-3">
        <nav aria-label="Espace client" className="flex flex-wrap gap-2">
          {LIENS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={actif(l.href) ? "page" : undefined}
              className={`inline-flex min-h-11 items-center border-2 border-ink px-4 font-display text-sm font-bold ${actif(l.href) ? "bg-indigo text-white shadow-hard-sm" : "bg-paper"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link href="/e-shop" className="inline-flex min-h-11 items-center border-2 border-ink bg-paper px-4 font-display text-sm font-bold">
            E-shop
          </Link>
        </nav>
        <p className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted">{profil.email}</span>
          <button type="button" onClick={deconnecter} className="inline-flex min-h-9 items-center gap-1 border-2 border-ink bg-paper px-3 font-display text-xs font-bold">
            <LogOut aria-hidden size={14} /> Se déconnecter
          </button>
        </p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
