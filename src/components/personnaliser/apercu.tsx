"use client";

import { forwardRef, useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { MockupCatalogue } from "@/lib/catalogue-plateforme";
import { VIEWBOX_STANDARD, viewBoxDe } from "@/lib/gabarit";
import { bornerDecalage, echelleDe, formatCm, normaliserAngle, TAILLE_MAX_CM, TAILLE_MIN_CM, type Forme, type Placement, type Vue } from "@/lib/marquage";
import { scoperSvg } from "@/lib/mockup-scope";

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
  /** Calque verrouillé : ni sélection ni déplacement sur l'aperçu. */
  verrouille: boolean;
};

export type ModificationMarquage = Partial<{ dxCm: number; dyCm: number; largeurCm: number; rotation: number }>;

export { formePour, type Forme } from "@/lib/marquage";

/**
 * Cadrage « gros plan » autour d'un marquage (viewBox), aux proportions de
 * l'aperçu complet (400 × 440), avec la place des cotes.
 */
export function cadragePour(m: MarquageApercu, vb: [number, number, number, number] = VIEWBOX_STANDARD): [number, number, number, number] {
  const u = echelleDe(m.placement);
  const s = vb[2] / 400; // tailles minimales exprimées pour une vue de 400 de large
  const w = m.largeurCm * u;
  const h = w * m.ratio;
  const a = (m.rotation * Math.PI) / 180;
  const demiL = (Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a))) / 2;
  const demiH = (Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))) / 2;
  const cx = m.placement.x + m.dxCm * u;
  const cy = m.placement.y + m.dyCm * u;
  // Assez large pour garder le vêtement autour du marquage (épaules, col, manche).
  const largeur = Math.min(vb[2], Math.max(170 * s, demiL * 2 * 2.4 + 50 * s, ((demiH * 2 * 2.4 + 50 * s) * 400) / 440));
  const hauteur = (largeur * 440) / 400;
  const x = Math.min(Math.max(cx - largeur / 2, vb[0]), vb[0] + vb[2] - largeur);
  const y = Math.min(Math.max(cy - hauteur / 2, vb[1]), vb[1] + Math.max(vb[3], hauteur) - hauteur);
  return [x, y, largeur, hauteur];
}
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
    /** Gros plan : viewBox [x, y, largeur, hauteur] (voir cadragePour). */
    cadrage?: [number, number, number, number];
    /** Affiche les cotes (largeur × hauteur en cm) des marquages visibles. */
    cotes?: boolean;
    /** Mockup SVG de la plateforme pour cette vue (sinon silhouette standard). */
    mockup?: MockupCatalogue | null;
    /** Couleur (hex) de chaque zone du mockup. */
    couleursZones?: Record<string, string>;
  }
>(function Apercu({ vue, couleurHex, forme, marquages, onModifier, onSelectionner, cadrage, cotes = false, mockup = null, couleursZones = {} }, ref) {
  const vb = viewBoxDe(mockup);
  // Échelle des traits, poignées et textes : constants à l'écran, quel que soit le dessin ou le gros plan.
  const k = (cadrage ? cadrage[2] : vb[2]) / 400;
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
    if (!interactif || m.verrouille) return;
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
    const u = echelleDe(m.placement);
    const cx = m.placement.x + m.dxCm * u;
    const cy = m.placement.y + m.dyCm * u;
    if (g.mode === "deplacer") {
      onModifier(m.id, bornerDecalage(m.placement, g.dxCm + (p.x - g.depart.x) / u, g.dyCm + (p.y - g.depart.y) / u));
    } else if (g.mode === "taille") {
      // Distance au centre, dans le repère du logo incliné.
      const a = (-m.rotation * Math.PI) / 180;
      const lx = (p.x - cx) * Math.cos(a) - (p.y - cy) * Math.sin(a);
      const ly = (p.x - cx) * Math.sin(a) + (p.y - cy) * Math.cos(a);
      const largeur = (2 * Math.max(Math.abs(lx), Math.abs(ly) / m.ratio) - 6 * k) / u;
      onModifier(m.id, { largeurCm: Math.min(TAILLE_MAX_CM, Math.max(TAILLE_MIN_CM, Math.round(largeur * 2) / 2)) });
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
    if (!onModifier || m.verrouille) return;
    const pas = e.shiftKey ? 2 : 0.5;
    const deplacer = (dx: number, dy: number) => onModifier(m.id, bornerDecalage(m.placement, m.dxCm + dx, m.dyCm + dy));
    const actions: Record<string, () => void> = {
      ArrowLeft: () => deplacer(-pas, 0),
      ArrowRight: () => deplacer(pas, 0),
      ArrowUp: () => deplacer(0, -pas),
      ArrowDown: () => deplacer(0, pas),
      "+": () => onModifier(m.id, { largeurCm: Math.min(TAILLE_MAX_CM, m.largeurCm + 0.5) }),
      "=": () => onModifier(m.id, { largeurCm: Math.min(TAILLE_MAX_CM, m.largeurCm + 0.5) }),
      "-": () => onModifier(m.id, { largeurCm: Math.max(TAILLE_MIN_CM, m.largeurCm - 0.5) }),
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

  // Mockup : deux copies isolées — l'affichage (zones peintes) et le masque
  // (tout en blanc, sauf les calques non reliés) qui découpe les visuels.
  const pm = `${gid}m`;
  const pk = `${gid}k`;
  const caler = (svg: string) =>
    svg.replace(/^<svg\b([^>]*)>/, (_m, attrs: string) => `<svg${attrs.replace(/\s(width|height|x|y)="[^"]*"/g, "")} x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}">`);
  const echap = (id: string) => id.replace(/["\\]/g, "\\$&");
  const relies = mockup ? Object.keys(mockup.zones) : [];
  const nommes = mockup ? [...mockup.svg.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]) : [];
  const styleMockup = mockup
    ? [
        ...Object.entries(mockup.zones)
          .filter(([, zk]) => zk !== "__contour" && couleursZones[zk])
          .map(([id, zk]) => `[id="${pm}-${echap(id)}"], [id="${pm}-${echap(id)}"] * { fill: ${couleursZones[zk]} !important; }`),
        `[id="${gid}-masque"] * { fill: #fff !important; stroke: #fff !important; }`,
        ...nommes
          .filter((id) => !relies.includes(id) && !/^(defs|style)/i.test(id))
          .map((id) => `[id="${pk}-${echap(id)}"] { display: none !important; }`),
      ].join("\n")
    : "";

  return (
    <svg
      ref={lierRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={(cadrage ?? vb).join(" ")}
      role="img"
      aria-label={`Aperçu ${vue === "face" ? "de face" : "de dos"}`}
      className="h-auto w-full select-none"
      style={interactif ? { touchAction: "none" } : undefined}
      onPointerMove={interactif ? bouger : undefined}
      onPointerUp={interactif ? finir : undefined}
      onPointerCancel={interactif ? finir : undefined}
    >
      {mockup ? (
        <>
          <style>{styleMockup}</style>
          <defs>
            {/* Masque : le vêtement en blanc ; ce qui dépasse n'est pas imprimé. */}
            <mask id={`${gid}-vetement-masque`} maskUnits="userSpaceOnUse" x={vb[0]} y={vb[1]} width={vb[2]} height={vb[3]}>
              <g id={`${gid}-masque`} dangerouslySetInnerHTML={{ __html: caler(scoperSvg(mockup.svg, pk)) }} />
            </mask>
          </defs>
          <g dangerouslySetInnerHTML={{ __html: caler(scoperSvg(mockup.svg, pm)) }} />
        </>
      ) : (
        <>
      <defs>
            <linearGradient id={gid} x1="0" x2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0.14" />
              <stop offset="0.25" stopColor="#000" stopOpacity="0" />
              <stop offset="0.75" stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.14" />
            </linearGradient>
            {/* Ce qui dépasse du vêtement n'est pas imprimé : les visuels sont découpés à sa silhouette. */}
            <clipPath id={`${gid}-vetement`}>
              <path d={`${CORPS} ${vue === "face" ? COL_FACE : COL_DOS} Z`} />
            </clipPath>
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
        </>
      )}

      {/* Calque 1 : les visuels, découpés au vêtement, dans l'ordre des calques. */}
      <g {...(mockup ? { mask: `url(#${gid}-vetement-masque)` } : { clipPath: `url(#${gid}-vetement)` })}>
        {visibles.map((m) => {
          const u = echelleDe(m.placement);
          const w = m.largeurCm * u;
          const h = w * m.ratio;
          const cx = m.placement.x + m.dxCm * u;
          const cy = m.placement.y + m.dyCm * u;
          return (
            <g key={m.id} transform={`translate(${cx} ${cy}) rotate(${m.rotation})`} pointerEvents="none">
              {m.apercuUrl ? (
                <image href={m.apercuUrl} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
              ) : (
                <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="rgb(255 255 255 / 0.35)" stroke="#15163a" strokeDasharray="3 3" />
              )}
            </g>
          );
        })}
      </g>

      {/* Calque 2 : zones de prise, cadres, poignées et cotes (non découpés, pour rattraper un visuel sorti du vêtement). */}
      {visibles.map((m) => {
        const u = echelleDe(m.placement);
        const w = m.largeurCm * u;
        const h = w * m.ratio;
        const cx = m.placement.x + m.dxCm * u;
        const cy = m.placement.y + m.dyCm * u;
        const manipulable = interactif && !m.verrouille;
        const poignees = manipulable && m.actif;
        // Demi-hauteur de l'encombrement incliné, pour placer l'étiquette au-dessus.
        const a = (m.rotation * Math.PI) / 180;
        const demiHaut = (Math.abs(h * Math.cos(a)) + Math.abs(w * Math.sin(a))) / 2;
        return (
          <g key={m.id}>
            <g
              transform={`translate(${cx} ${cy}) rotate(${m.rotation})`}
              tabIndex={manipulable ? 0 : undefined}
              role={manipulable ? "button" : undefined}
              aria-label={manipulable ? "Visuel : glisser pour déplacer ; flèches, + / − et [ / ] au clavier" : undefined}
              onKeyDown={manipulable ? (e) => clavier(e, m) : undefined}
              onFocus={manipulable && !m.actif ? () => onSelectionner?.(m.id) : undefined}
              onPointerDown={manipulable ? (e) => commencer(e, m, "deplacer") : undefined}
              style={manipulable ? { cursor: "move", outline: "none" } : undefined}
              pointerEvents={manipulable ? "all" : "none"}
            >
              {/* Zone de prise invisible : tout le rectangle du visuel. */}
              {manipulable ? <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="transparent" /> : null}
              {cotes ? (
                <g stroke="#e2162d" fill="#e2162d" strokeWidth={1.2 * k} fontFamily="var(--font-mono-jb), 'JetBrains Mono', Menlo, Consolas, monospace" fontSize={11 * k}>
                  <line x1={-w / 2} y1={h / 2 + 10 * k} x2={w / 2} y2={h / 2 + 10 * k} />
                  <line x1={-w / 2} y1={h / 2 + 5 * k} x2={-w / 2} y2={h / 2 + 15 * k} />
                  <line x1={w / 2} y1={h / 2 + 5 * k} x2={w / 2} y2={h / 2 + 15 * k} />
                  <text x={0} y={h / 2 + 26 * k} textAnchor="middle" stroke="#fffdf8" strokeWidth={3 * k} paintOrder="stroke">
                    {formatCm(m.largeurCm)}
                  </text>
                  <line x1={w / 2 + 10 * k} y1={-h / 2} x2={w / 2 + 10 * k} y2={h / 2} />
                  <line x1={w / 2 + 5 * k} y1={-h / 2} x2={w / 2 + 15 * k} y2={-h / 2} />
                  <line x1={w / 2 + 5 * k} y1={h / 2} x2={w / 2 + 15 * k} y2={h / 2} />
                  <text
                    x={w / 2 + 22 * k}
                    y={0}
                    textAnchor="middle"
                    transform={`rotate(-90 ${w / 2 + 22 * k} 0)`}
                    stroke="#fffdf8"
                    strokeWidth={3 * k}
                    paintOrder="stroke"
                  >
                    {formatCm(Math.round(m.largeurCm * m.ratio * 10) / 10)}
                  </text>
                </g>
              ) : null}
              {m.actif ? (
                <rect
                  x={-w / 2 - 3 * k}
                  y={-h / 2 - 3 * k}
                  width={w + 6 * k}
                  height={h + 6 * k}
                  fill="none"
                  stroke={m.verrouille ? "#4c4d6b" : "#f28c1b"}
                  strokeWidth={1.5 * k}
                  strokeDasharray={`${5 * k} ${3 * k}`}
                />
              ) : null}
              {poignees ? (
                <>
                  <line x1={0} y1={-h / 2 - 3 * k} x2={0} y2={-h / 2 - 20 * k} stroke="#f28c1b" strokeWidth={1.5 * k} />
                  <circle
                    cx={0}
                    cy={-h / 2 - 26 * k}
                    r={7 * k}
                    fill="#fffdf8"
                    stroke="#15163a"
                    strokeWidth={2 * k}
                    style={{ cursor: "grab" }}
                    onPointerDown={(e) => commencer(e, m, "rotation")}
                  >
                    <title>Incliner (Maj : par 15°)</title>
                  </circle>
                  <rect
                    x={w / 2 - 3 * k}
                    y={h / 2 - 3 * k}
                    width={12 * k}
                    height={12 * k}
                    fill="#f28c1b"
                    stroke="#15163a"
                    strokeWidth={2 * k}
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
                y={cy - demiHaut - (poignees ? 36 : 8) * k}
                textAnchor="middle"
                fontSize={11 * k}
                fontFamily="var(--font-mono-jb), 'JetBrains Mono', Menlo, Consolas, monospace"
                fill="#15163a"
                stroke="#fffdf8"
                strokeWidth={3 * k}
                paintOrder="stroke"
                pointerEvents="none"
              >
                {m.verrouille ? "🔒 " : ""}
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
