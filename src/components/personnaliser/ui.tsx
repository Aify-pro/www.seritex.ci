"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function Titre({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-2xl font-black tracking-tight">{children}</h2>;
}

/** Bouton de choix (emplacement, format, technique…). */
export function Puce({
  choisie,
  onClick,
  disabled,
  children,
}: {
  choisie: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={choisie}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 border-2 border-ink px-4 py-2 font-display text-sm font-semibold transition ${
        choisie ? "bg-ink text-ecru" : "bg-paper hover:bg-ecru-dark"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

/** Pastille de couleur avec son nom (même principe que la plateforme). */
export function Pastille({ hex, nom, choisie, onClick }: { hex: string | null; nom: string; choisie: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={choisie} className="flex w-20 flex-col items-center gap-1 text-center">
      <span
        className={`relative grid size-11 place-items-center rounded-full border-2 ${choisie ? "border-orange ring-2 ring-ink" : "border-ink"}`}
        style={{ background: hex ?? "#ccc" }}
      >
        {choisie ? <Check aria-hidden size={18} className="text-white mix-blend-difference" /> : null}
      </span>
      <span className="text-xs leading-tight">{nom}</span>
    </button>
  );
}
