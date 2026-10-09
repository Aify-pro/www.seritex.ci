"use client";

import { forwardRef, useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { bornerDecalage, formatCm, normaliserAngle, UNITES_PAR_CM, type Forme, type Placement, type Vue } from "@/lib/marquage";

/** Un marquage à dessiner sur la silhouette. */
export type MarquageApercu = {
  id: string;
  placement: Placement;
  largeurCm: number;
  ratio: number;
  apercuUrl: string | null;
  actif: boolean;
  /** Décalage du centre (cm) par rapport à la position type, et inclinaison (degrés). */
  dxCm: number;
  dyCm: number;
  rotation: number;
};

export type ModificationMarquage = Partial<{ dxCm: number; dyCm: number; largeurCm: number; rotation: number }>;

export { formePour, type Forme } from "@/lib/marquage";
const CORPS =
  "M140,40 L70,62 L5,150 L60,185 L100,150 L100,420 L300,420 L300,150 L340,185 L395,150 L330,62 L260,40";
const COL_FACE = "Q200,78 140,40";
const COL_DOS = "Q200,56 140,40";

const clair = (hex: string) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
};

type Geste = {
  mode: "deplacer" | "taille" | "rotation";
  id: string;
  depart: { x: number; y: number };
  dxCm: number;
  dyCm: number;
};

/** Angles « aimantés » pendant la rotation (à 4° près). */
const AIMANTS = [0, 45, -45, 90, -90, 180, -180];

/**
 * Aperçu du vêtement. Avec `onModifier`, le marquage actif se manipule
 * directement : glisser pour le déplacer (dans la zone de l'emplacement),
 * poignée de coin pour la taille, poignée du haut pour l'inclinaison (Maj :
 * par pas de 15°). Au clavier : flèches (Maj : 2 cm), + / −, [ / ].
 */
export const Apercu = forwardRef<
  SVGSVGElement,
  {
    vue: Vue;
    couleurHex: string;
    forme: Forme;
    marquages: MarquageApercu[];
    onModifier?: (id: string, patch: ModificationMarquage) => void;
    onSelectionner?: (id: string) => void;
  }
>(function Apercu({ vue, couleurHex, forme, marquages, onModifier, onSelectionner }, ref) {
  const gid = `volume-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svgInterne = useRef<SVGSVGElement | null>(null);
  const geste = useRef<Geste | null>(null);
  const interactif = !!onModifier;

  function lierRef(el: SVGSVGElement | null) {
    svgInterne.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }

  function pointSvg(e: PointerEvent) {
    const svg = svgInterne.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  }

  function commencer(e: PointerEvent, m: MarquageApercu, mode: Geste["mode"]) {
    if (!interactif) return;
    e.preventDefault();
    e.stopPropagation();
    if (!m.actif) onSelectionner?.(m.id);
    svgInterne.current?.setPointerCapture(e.pointerId);
    geste.current = { mode, id: m.id, depart: pointSvg(e), dxCm: m.dxCm, dyCm: m.dyCm };
  }

  function bouger(e: PointerEvent) {
    const g = geste.current;
    const m = g && marquages.find((x) => x.id === g.id);
    if (!g || !m || !onModifier) return;
    const p = pointSvg(e);
    const cx = m.placement.x + m.dxCm * UNITES_PAR_CM;
    const cy = m.placement.y + m.dyCm * UNITES_PAR_CM;
    if (g.mode === "deplacer") {
      onModifier(m.id, bornerDecalage(m.placement, g.dxCm + (p.x - g.depart.x) / UNITES_PAR_CM, g.dyCm + (p.y - g.depart.y) / UNITES_PAR_CM));
    } else if (g.mode === "taille") {
      // Distance au centre, dans le repère du logo incliné.
      const a = (-m.rotation * Math.PI) / 180;
      const lx = (p.x - cx) * Math.cos(a) - (p.y - cy) * Math.sin(a);
      const ly = (p.x - cx) * Math.sin(a) + (p.y - cy) * Math.cos(a);
      const largeur = (2 * Math.max(Math.abs(lx), Math.abs(ly) / m.ratio) - 6) / UNITES_PAR_CM;
      onModifier(m.id, { largeurCm: Math.min(m.placement.maxCm, Math.max(3, Math.round(largeur * 2) / 2)) });
    } else {
      let angle = (Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 90;
      angle = normaliserAngle(angle);
      if (e.shiftKey) angle = Math.round(angle / 15) * 15;
      else {
        const aimant = AIMANTS.find((t) => Math.abs(t - angle) < 4);
        if (aimant !== undefined) angle = aimant;
      }
      onModifier(m.id, { rotation: normaliserAngle(angle) });
    }
  }

  function finir() {
    geste.current = null;
  }

  function clavier(e: KeyboardEvent, m: MarquageApercu) {
    if (!onModifier) return;
    const pas = e.shiftKey ? 2 : 0.5;
    const deplacer = (dx: number, dy: number) => onModifier(m.id, bornerDecalage(m.placement, m.dxCm + dx, m.dyCm + dy));
    const actions: Record<string, () => void> = {
      ArrowLeft: () => deplacer(-pas, 0),
      ArrowRight: () => deplacer(pas, 0),
      ArrowUp: () => deplacer(0, -pas),
      ArrowDown: () => deplacer(0, pas),
      "+": () => onModifier(m.id, { largeurCm: Math.min(m.placement.maxCm, m.largeurCm + 0.5) }),
      "=": () => onModifier(m.id, { largeurCm: Math.min(m.placement.maxCm, m.largeurCm + 0.5) }),
      "-": () => onModifier(m.id, { largeurCm: Math.max(3, m.largeurCm - 0.5) }),
      "[": () => onModifier(m.id, { rotation: normaliserAngle(m.rotation - (e.shiftKey ? 15 : 5)) }),
      "]": () => onModifier(m.id, { rotation: normaliserAngle(m.rotation + (e.shiftKey ? 15 : 5)) }),
    };
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  }
  const trait = clair(couleurHex) ? "rgb(21 22 58 / 0.35)" : "rgb(255 255 255 / 0.25)";
  const visibles = marquages.filter((m) => m.placement.vue === vue);

  return (
    <svg
      ref={lierRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 440"
      role="img"
      aria-label={`Aperçu ${vue === "face" ? "de face" : "de dos"}`}
      className="h-auto w-full select-none"
      style={interactif ? { touchAction: "none" } : undefined}
      onPointerMove={interactif ? bouger : undefined}
      onPointerUp={interactif ? finir : undefined}
      onPointerCancel={interactif ? finir : undefined}
    >
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
        const cx = m.placement.x + m.dxCm * UNITES_PAR_CM;
        const cy = m.placement.y + m.dyCm * UNITES_PAR_CM;
        const poignees = interactif && m.actif;
        // Demi-hauteur de l'encombrement incliné, pour placer l'étiquette au-dessus.
        const a = (m.rotation * Math.PI) / 180;
        const demiHaut = (Math.abs(h * Math.cos(a)) + Math.abs(w * Math.sin(a))) / 2;
        return (
          <g key={m.id}>
            <g
              transform={`translate(${cx} ${cy}) rotate(${m.rotation})`}
              tabIndex={interactif ? 0 : undefined}
              role={interactif ? "button" : undefined}
              aria-label={interactif ? "Logo : glisser pour déplacer ; flèches, + / − et [ / ] au clavier" : undefined}
              onKeyDown={interactif ? (e) => clavier(e, m) : undefined}
              onFocus={interactif && !m.actif ? () => onSelectionner?.(m.id) : undefined}
              onPointerDown={interactif ? (e) => commencer(e, m, "deplacer") : undefined}
              style={interactif ? { cursor: "move", outline: "none" } : undefined}
            >
              {m.apercuUrl ? (
                <image href={m.apercuUrl} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
              ) : (
                <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="rgb(255 255 255 / 0.35)" stroke="#15163a" strokeDasharray="3 3" />
              )}
              {poignees || (m.actif && !interactif) ? (
                <rect x={-w / 2 - 3} y={-h / 2 - 3} width={w + 6} height={h + 6} fill="none" stroke="#f28c1b" strokeWidth="1.5" strokeDasharray="5 3" />
              ) : null}
              {poignees ? (
                <>
                  <line x1={0} y1={-h / 2 - 3} x2={0} y2={-h / 2 - 20} stroke="#f28c1b" strokeWidth="1.5" />
                  <circle
                    cx={0}
                    cy={-h / 2 - 26}
                    r={7}
                    fill="#fffdf8"
                    stroke="#15163a"
                    strokeWidth="2"
                    style={{ cursor: "grab" }}
                    onPointerDown={(e) => commencer(e, m, "rotation")}
                  >
                    <title>Incliner (Maj : par 15°)</title>
                  </circle>
                  <rect
                    x={w / 2 - 3}
                    y={h / 2 - 3}
                    width={12}
                    height={12}
                    fill="#f28c1b"
                    stroke="#15163a"
                    strokeWidth="2"
                    style={{ cursor: "nwse-resize" }}
                    onPointerDown={(e) => commencer(e, m, "taille")}
                  >
                    <title>Agrandir ou réduire</title>
                  </rect>
                </>
              ) : null}
            </g>
            {m.actif ? (
              <text
                x={cx}
                y={cy - demiHaut - (poignees ? 36 : 8)}
                textAnchor="middle"
                fontSize="11"
                fontFamily="var(--font-mono-jb), monospace"
                fill="#15163a"
                stroke="#fffdf8"
                strokeWidth="3"
                paintOrder="stroke"
                pointerEvents="none"
              >
                {formatCm(m.largeurCm)}
                {m.rotation ? ` · ${m.rotation}°` : ""}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
});
