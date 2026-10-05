"use client";

import { useEffect, useRef, useState } from "react";

/** Abscisse de la couture : une onde douce, comme un point zigzag lâche. */
const wave = (y: number) => 20 + Math.sin(y / 70) * 9 + Math.sin(y / 23) * 2;

function buildPath(h: number) {
  let d = `M ${wave(0).toFixed(1)} 0`;
  for (let y = 8; y <= h; y += 8) d += ` L ${wave(y).toFixed(1)} ${y}`;
  return d;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Couture qui suit la lecture :
 *  - grand écran : un fil rouge qui se coud le long de la marge gauche, une
 *    aiguille en tête, à mesure qu'on descend dans la page ;
 *  - mobile : une ligne de couture sous l'en-tête qui progresse.
 * Pilote aussi la parallaxe des éléments marqués `data-parallax="0.15"`
 * (vertical) ou `data-parallax-x="-0.2"` (horizontal).
 */
export function ScrollEffects() {
  const [height, setHeight] = useState(0);
  const clipRef = useRef<SVGRectElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const h = window.innerHeight;
      const y = p * h;

      clipRef.current?.setAttribute("height", String(y));
      if (needleRef.current) {
        const tilt = -Math.atan2(wave(y + 4) - wave(y - 4), 8) * (180 / Math.PI);
        needleRef.current.setAttribute("transform", `translate(${wave(y).toFixed(1)} ${y.toFixed(1)}) rotate(${tilt.toFixed(1)})`);
        needleRef.current.style.opacity = p > 0.002 && p < 0.998 ? "1" : "0";
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;

      if (reduced) return;
      document.querySelectorAll<HTMLElement>("[data-parallax],[data-parallax-x]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > h + 200) return;
        const centre = r.top + r.height / 2 - h / 2;
        const vy = Number(el.dataset.parallax ?? 0);
        const vx = Number(el.dataset.parallaxX ?? 0);
        el.style.transform = `translate3d(${(centre * vx).toFixed(1)}px, ${(centre * vy).toFixed(1)}px, 0)`;
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [height]);

  return (
    <>
      {/* Grand écran : couture verticale dans la marge */}
      {height > 0 ? (
        <svg
          aria-hidden
          className="pointer-events-none fixed top-0 left-1 z-40 hidden xl:block 2xl:left-4"
          width="44"
          height={height}
          viewBox={`0 0 44 ${height}`}
        >
          <defs>
            <clipPath id="couture-cousue">
              <rect ref={clipRef} x="0" y="0" width="44" height="0" />
            </clipPath>
          </defs>
          {/* Tracé à coudre, à peine visible */}
          <path d={buildPath(height)} fill="none" stroke="var(--ink)" strokeOpacity="0.12" strokeWidth="2" strokeDasharray="9 7" />
          {/* Fil cousu */}
          <path
            d={buildPath(height)}
            fill="none"
            stroke="var(--rouge)"
            strokeWidth="3"
            strokeDasharray="9 7"
            strokeLinecap="round"
            clipPath="url(#couture-cousue)"
          />
          {/* Aiguille */}
          <g ref={needleRef} style={{ transition: "opacity 200ms" }}>
            <path d="M0 -40 L2.2 -34 L1.4 10 L0 16 L-1.4 10 L-2.2 -34 Z" fill="var(--ink)" />
            <ellipse cx="0" cy="-32" rx="0.9" ry="3.5" fill="var(--ecru)" />
            <path d="M0 -32 C 10 -38, 12 -20, 4 -14" fill="none" stroke="var(--rouge)" strokeWidth="1.5" />
            <circle cx="0" cy="16" r="4.5" fill="var(--orange)" stroke="var(--ink)" strokeWidth="1.5" />
          </g>
        </svg>
      ) : null}

      {/* Mobile / tablette : ligne de couture sous l'en-tête */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-[74px] z-40 h-[3px] xl:hidden">
        <div ref={barRef} className="couture h-[3px] origin-left text-rouge" style={{ transform: "scaleX(0)" }} />
      </div>
    </>
  );
}

/** Compteur qui défile jusqu'à sa valeur quand il apparaît à l'écran. */
export function CountUp({ to, duration = 1400 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = fmt(to);
      return;
    }
    el.textContent = fmt(0);
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(Math.round(to * eased));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return <span ref={ref}>{fmt(to)}</span>;
}
