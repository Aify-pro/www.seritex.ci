import type { AnalyseLogo } from "./marquage";

/**
 * Analyse d'un logo dans le navigateur (canvas), sans envoi à un serveur :
 * couleurs, dégradés, transparence, fond, finesse des traits, résolution.
 * Résultats indicatifs : Seritex confirme au devis et au BAT.
 */

export const FORMATS_ACCEPTES = "image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,.ai,.eps,.pdf,.svg";
export const TAILLE_MAX_OCTETS = 15 * 1024 * 1024;

export type LogoCharge = {
  nom: string;
  fichier: File;
  /** Aperçu affichable (fond retiré pour les images opaques à fond uni). */
  apercuUrl: string | null;
  analyse: AnalyseLogo;
};

const COTE_ANALYSE = 480;

function chargerImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image illisible"));
    img.src = url;
  });
}

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export async function chargerLogo(fichier: File): Promise<LogoCharge> {
  const vectoriel = fichier.type === "image/svg+xml" || /\.svg$/i.test(fichier.name);
  const image = /^image\/(png|jpeg|webp|svg\+xml)$/.test(fichier.type) || vectoriel;
  if (!image) {
    return {
      nom: fichier.name,
      fichier,
      apercuUrl: null,
      analyse: { vectoriel: /\.(ai|eps|pdf)$/i.test(fichier.name), analysable: false, largeurUtilePx: 0, ratio: 1, couleurs: [], degrade: false, transparent: true, fond: null, traitFinRatio: 1 },
    };
  }

  const url = URL.createObjectURL(fichier);
  try {
    const img = await chargerImage(url);
    const largeurOrigine = img.naturalWidth || 1000;
    const hauteurOrigine = img.naturalHeight || 1000;
    const echelle = Math.min(1, COTE_ANALYSE / Math.max(largeurOrigine, hauteurOrigine));
    const w = vectoriel ? COTE_ANALYSE : Math.max(1, Math.round(largeurOrigine * echelle));
    const h = vectoriel ? Math.round((COTE_ANALYSE * hauteurOrigine) / largeurOrigine) : Math.max(1, Math.round(hauteurOrigine * echelle));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;

    // Transparence, puis fond uni (les quatre coins de même couleur).
    let transparents = 0;
    for (let i = 3; i < px.length; i += 4) if (px[i] < 16) transparents += 1;
    const transparent = transparents / (w * h) > 0.03;
    let fond: number[] | null = null;
    if (!transparent) {
      const coin = (x: number, y: number) => {
        const i = (y * w + x) * 4;
        return [px[i], px[i + 1], px[i + 2]];
      };
      const coins = [coin(0, 0), coin(w - 1, 0), coin(0, h - 1), coin(w - 1, h - 1)];
      if (coins.every((c) => dist(c, coins[0]) < 30)) fond = coins[0];
    }

    // Masque du dessin : opaque et différent du fond.
    const masque = new Uint8Array(w * h);
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const plein = px[i + 3] >= 128 && !(fond && dist([px[i], px[i + 1], px[i + 2]], fond) < 40);
        if (plein) {
          masque[y * w + x] = 1;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) throw new Error("dessin vide");
    const lw = x1 - x0 + 1;
    const lh = y1 - y0 + 1;

    // Couleurs : histogramme quantifié, puis regroupement des teintes proches.
    const bins = new Map<number, { n: number; rgb: number[] }>();
    let pleins = 0;
    for (let p = 0; p < w * h; p++) {
      if (!masque[p]) continue;
      pleins += 1;
      const i = p * 4;
      const key = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4);
      const b = bins.get(key);
      if (b) b.n += 1;
      else bins.set(key, { n: 1, rgb: [px[i], px[i + 1], px[i + 2]] });
    }
    const tries = [...bins.values()].sort((a, b) => b.n - a.n);
    const groupes: { rgb: number[]; n: number }[] = [];
    for (const b of tries) {
      const g = groupes.find((x) => dist(x.rgb, b.rgb) < 48);
      if (g) g.n += b.n;
      else groupes.push({ rgb: b.rgb, n: b.n });
    }
    const significatifs = groupes.filter((g) => g.n / pleins >= 0.01);
    // Dégradé : à l'intérieur du dessin (bords anticrénelés et frontières entre
    // couleurs exclus), un aplat reste proche d'une de ses couleurs franches, même
    // dans un JPG bruité ; un dégradé ou une photo s'en écarte souvent.
    const rgbA = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      return [px[i], px[i + 1], px[i + 2]];
    };
    let interieurs = 0;
    let horsPalette = 0;
    for (let y = y0 + 2; y <= y1 - 2; y += 2) {
      for (let x = x0 + 2; x <= x1 - 2; x += 2) {
        if (!(masque[y * w + x] && masque[y * w + x - 2] && masque[y * w + x + 2] && masque[(y - 2) * w + x] && masque[(y + 2) * w + x])) continue;
        const c = rgbA(x, y);
        const voisins = [rgbA(x - 2, y), rgbA(x + 2, y), rgbA(x, y - 2), rgbA(x, y + 2)];
        if (voisins.some((v) => dist(v, c) > 40)) continue;
        interieurs += 1;
        if (Math.min(...significatifs.map((g) => dist(g.rgb, c))) > 18) horsPalette += 1;
      }
    }
    const degrade = (interieurs > 0 && horsPalette / interieurs > 0.12) || significatifs.length > 12;
    const couleurs = significatifs.slice(0, 16).map((g) => hex(g.rgb[0], g.rgb[1], g.rgb[2]));

    // Finesse des traits : épaisseur locale = min(course horizontale, verticale).
    const horiz = new Uint16Array(w * h);
    for (let y = y0; y <= y1; y++) {
      let x = x0;
      while (x <= x1) {
        if (!masque[y * w + x]) { x++; continue; }
        let e = x;
        while (e <= x1 && masque[y * w + e]) e++;
        for (let k = x; k < e; k++) horiz[y * w + k] = e - x;
        x = e;
      }
    }
    const epaisseurs: number[] = [];
    for (let x = x0; x <= x1; x++) {
      let y = y0;
      while (y <= y1) {
        if (!masque[y * w + x]) { y++; continue; }
        let e = y;
        while (e <= y1 && masque[e * w + x]) e++;
        for (let k = y; k < e; k++) epaisseurs.push(Math.min(e - y, horiz[k * w + x]));
        y = e;
      }
    }
    epaisseurs.sort((a, b) => a - b);
    // 5e centile, une couche d'anticrénelage retirée ; au moins 1 pixel.
    const fin = Math.max(1, epaisseurs[Math.floor(epaisseurs.length * 0.05)] ?? 1);
    const traitFinRatio = fin / lw;

    // Aperçu : le dessin recadré, fond uni rendu transparent.
    const sortie = document.createElement("canvas");
    sortie.width = lw;
    sortie.height = lh;
    const sctx = sortie.getContext("2d")!;
    const recadre = sctx.createImageData(lw, lh);
    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        const src = ((y + y0) * w + (x + x0)) * 4;
        const dst = (y * lw + x) * 4;
        recadre.data[dst] = px[src];
        recadre.data[dst + 1] = px[src + 1];
        recadre.data[dst + 2] = px[src + 2];
        recadre.data[dst + 3] = masque[(y + y0) * w + (x + x0)] ? px[src + 3] : 0;
      }
    }
    sctx.putImageData(recadre, 0, 0);

    return {
      nom: fichier.name,
      fichier,
      apercuUrl: sortie.toDataURL("image/png"),
      analyse: {
        vectoriel,
        analysable: true,
        largeurUtilePx: vectoriel ? 0 : Math.round(lw / echelle),
        ratio: lh / lw,
        couleurs,
        degrade,
        transparent,
        fond: fond ? hex(fond[0], fond[1], fond[2]) : null,
        traitFinRatio,
      },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
