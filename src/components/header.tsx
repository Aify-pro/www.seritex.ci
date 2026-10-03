"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { nav, site } from "@/content/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Referme le menu mobile à chaque changement de page.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-ecru/95 backdrop-blur">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-ecru"
      >
        Aller au contenu
      </a>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="shrink-0" aria-label="Seritex — accueil">
          <Image src="/images/brand/logo-seritex.png" alt="Seritex" width={146} height={48} preload />
        </Link>

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative px-3 py-2 font-display text-[15px] font-semibold transition-colors hover:text-rouge ${
                      active ? "text-rouge" : ""
                    }`}
                  >
                    {item.label}
                    {active ? <span aria-hidden className="couture absolute inset-x-3 -bottom-0.5 text-rouge" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={`${site.appUrl}/login`}
            className="inline-flex min-h-11 items-center gap-2 px-3 font-display text-sm font-semibold hover:text-indigo"
          >
            <LogIn aria-hidden size={18} />
            Espace client
          </a>
          <Link
            href="/devis"
            className="btn-presse inline-flex min-h-11 items-center border-2 border-ink bg-orange px-5 font-display text-sm font-bold"
          >
            Demander un devis
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex size-12 items-center justify-center border-2 border-ink bg-paper lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </div>

      {open ? (
        <nav id="menu-mobile" aria-label="Navigation mobile" className="border-t-2 border-ink bg-indigo text-white lg:hidden">
          <ul className="px-4 py-4">
            {nav.map((item) => (
              <li key={item.href} className="border-b border-white/20">
                <Link href={item.href} className="block py-4 font-display text-2xl font-bold">
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="border-b border-white/20">
              <a href={`${site.appUrl}/login`} className="flex items-center gap-2 py-4 font-display text-2xl font-bold">
                <LogIn aria-hidden /> Espace client
              </a>
            </li>
          </ul>
          <div className="px-4 pb-6">
            <Link
              href="/devis"
              className="flex min-h-12 items-center justify-center border-2 border-ink bg-orange font-display font-bold text-ink"
            >
              Demander un devis
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
