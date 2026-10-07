"use client";

import { forwardRef, useId } from "react";
import { formatCm, UNITES_PAR_CM, type Placement, type Vue } from "@/lib/marquage";

/** Un marquage à dessiner sur la silhouette. */
export type MarquageApercu = {
  id: string;
  placement: Placement;
  largeurCm: number;
  ratio: number;
  apercuUrl: string | null;
  actif: boolean;
};

export type Forme = "tshirt" | "polo";

/** Silhouette d'après le nom du modèle (polo reconnu, t-shirt sinon). */
export const formePour = (nom: string, famille: string | null): Forme =>
  /polo|piqu/i.test(`${nom} ${famille ?? ""}`) ? "polo" : "tshirt";

const CORPS =
  "M140,40 L70,62 L5,150 L60,185 L100,150 L100,420 L300,420 L300,150 L340,185 L395,150 L330,62 L260,40";
const COL_FACE = "Q200,78 140,40";
const COL_DOS = "Q200,56 140,40";

const clair = (hex: string) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

export const Apercu = forwardRef<
  SVGSVGElement,
  { vue: Vue; couleurHex: string; forme: Forme; marquages: MarquageApercu[] }
>(function Apercu({ vue, couleurHex, forme, marquages }, ref) {
  const gid = `volume-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const trait = clair(couleurHex) ? "rgb(21 22 58 / 0.35)" : "rgb(255 255 255 / 0.25)";
  const visibles = marquages.filter((m) => m.placement.vue === vue);

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" role="img" aria-label={`Aperçu ${vue === "face" ? "de face" : "de dos"}`} className="h-auto w-full">
      <defs>
        <linearGradient id={gid} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.14" />
          <stop offset="0.25" stopColor="#000" stopOpacity="0" />
          <stop offset="0.75" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.14" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="428" rx="130" ry="8" fill="rgb(21 22 58 / 0.12)" />
      <path d={`${CORPS} ${vue === "face" ? COL_FACE : COL_DOS} Z`} fill={couleurHex} stroke={trait} strokeWidth="2" strokeLinejoin="round" />
      <path d={`${CORPS} ${vue === "face" ? COL_FACE : COL_DOS} Z`} fill={`url(#${gid})`} />
      {/* Coutures : épaules, bas de manches, ourlet */}
      <g fill="none" stroke={trait} strokeWidth="1.5" strokeDasharray="4 4">
        <path d="M100,150 L70,62 M300,150 L330,62" opacity="0.6" />
        <path d="M12,140 L64,176 M388,140 L336,176" />
        <path d="M100,408 L300,408" />
        {vue === "face" ? <path d="M146,46 Q200,86 254,46" /> : <path d="M146,46 Q200,64 254,46" />}
      </g>
      {forme === "polo" && vue === "face" ? (
        <g stroke={trait} strokeWidth="2" fill={couleurHex}>
          <path d="M140,40 L178,92 L200,66 L222,92 L260,40 Q200,58 140,40 Z" />
          <path d="M193,70 L193,140 L207,140 L207,70" fill="none" />
          <circle cx="200" cy="90" r="2.5" fill={trait} />
          <circle cx="200" cy="115" r="2.5" fill={trait} />
        </g>
      ) : null}

      {visibles.map((m) => {
        const w = m.largeurCm * UNITES_PAR_CM;
        const h = w * m.ratio;
        const x = m.placement.x - w / 2;
        const y = m.placement.y - h / 2;
        return (
          <g key={m.id}>
            {m.apercuUrl ? (
              <image href={m.apercuUrl} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
            ) : (
              <rect x={x} y={y} width={w} height={h} fill="rgb(255 255 255 / 0.35)" stroke="#15163a" strokeDasharray="3 3" />
            )}
            {m.actif ? (
              <g>
                <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} fill="none" stroke="#f28c1b" strokeWidth="1.5" strokeDasharray="5 3" />
                <text x={m.placement.x} y={y - 8} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono-jb), monospace" fill="#15163a" stroke="#fffdf8" strokeWidth="3" paintOrder="stroke">
                  {formatCm(m.largeurCm)}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
});
