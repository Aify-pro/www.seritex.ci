import type { Rapport } from "./marquage";

/**
 * Maquette de la composition, générée dans le navigateur, au style du site
 * (« Atelier Signal » : fond écru, logo, titres Outfit, étiquettes mono,
 * cartes à bordure franche et ombre décalée, couture rouge) :
 *   - page de synthèse : vues avant / dos, récapitulatif, liste des marquages ;
 *   - une page par marquage : gros plan coté de la zone (avant, dos, manche…)
 *     et rapport rédigé (couleurs détectées, technique conseillée et pourquoi).
 * C'est un aperçu, pas un BAT : le BAT est émis par Seritex après le devis.
 */

export type LigneMaquette = { libelle: string; valeur: string };

export type MarquageMaquette = {
  numero: number;
  emplacement: string;
  zoom: SVGSVGElement | null;
  fichier: string | null;
  dimensions: string;
  technique: string;
  position: string | null;
  consigne: string | null;
  rapport: Rapport | null;
};

export type ContenuMaquette = {
  vues: { titre: string; svg: SVGSVGElement }[];
  article: LigneMaquette[];
  couleurTextile: { nom: string; hex: string | null };
  marquages: MarquageMaquette[];
  client?: string;
  reference?: string | null;
};

const LARGEUR_VUE = 900;

/** Rend un SVG de l'aperçu en image (data URL) : PNG pour l'image téléchargée, JPEG pour alléger le PDF. */
export async function svgEnPng(svg: SVGSVGElement, largeur = 800, format: "png" | "jpeg" = "png"): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(largeur));
  clone.setAttribute("height", String(Math.round((largeur * 440) / 400)));
  const source = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("rendu de l'aperçu impossible"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  });
  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = Math.round((largeur * 440) / 400);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f6f1e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return format === "jpeg" ? canvas.toDataURL("image/jpeg", 0.88) : canvas.toDataURL("image/png");
}

/** Image unique (avant et dos côte à côte) pour « Télécharger l'image ». */
export async function imageMaquette(vues: SVGSVGElement[]): Promise<Blob> {
  const pngs = await Promise.all(vues.map((v) => svgEnPng(v, 800)));
  const canvas = document.createElement("canvas");
  canvas.width = 800 * pngs.length + 40 * (pngs.length + 1);
  canvas.height = 880 + 80;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f6f1e6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const [i, src] of pngs.entries()) {
    const img = new Image();
    await new Promise<void>((r) => {
      img.onload = () => r();
      img.src = src;
    });
    ctx.drawImage(img, 40 + i * 840, 40, 800, 880);
  }
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
}

/* ------------------------------------------------------------------------ */

type RGB = [number, number, number];
const C: Record<"ink" | "indigo" | "orange" | "rouge" | "ecru" | "paper" | "muted" | "orangePale", RGB> = {
  ink: [21, 22, 58],
  indigo: [42, 45, 124],
  orange: [242, 140, 27],
  rouge: [226, 22, 45],
  ecru: [246, 241, 230],
  paper: [255, 253, 248],
  muted: [76, 77, 107],
  orangePale: [253, 235, 214],
};
const BLANC: RGB = [255, 255, 255];

const hexEnRgb = (hex: string | null): RGB => {
  const n = Number.parseInt((hex ?? "#cccccc").replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const propre = (s: string) => s.replace(/[  ]/g, " ");

async function enBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`police introuvable : ${url}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function enDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function pdfMaquette(c: ContenuMaquette): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const W = 297;
  const H = 210;

  // Polices du site (licence OFL, public/fonts/pdf) ; repli sur Helvetica / Courier.
  let titre = "helvetica";
  let texte = "helvetica";
  let mono = "courier";
  try {
    const [black, regular, jb] = await Promise.all(
      ["/fonts/pdf/Outfit-Black.ttf", "/fonts/pdf/Outfit-Regular.ttf", "/fonts/pdf/JetBrainsMono-Regular.ttf"].map(enBase64),
    );
    doc.addFileToVFS("Outfit-Black.ttf", black);
    doc.addFont("Outfit-Black.ttf", "OutfitBlack", "normal");
    doc.addFileToVFS("Outfit-Regular.ttf", regular);
    doc.addFont("Outfit-Regular.ttf", "Outfit", "normal");
    doc.addFileToVFS("JetBrainsMono-Regular.ttf", jb);
    doc.addFont("JetBrainsMono-Regular.ttf", "JBMono", "normal");
    titre = "OutfitBlack";
    texte = "Outfit";
    mono = "JBMono";
  } catch {
    // polices standard de jsPDF
  }
  const logo = await enDataUrl("/images/brand/logo-seritex.png");

  const remplir = (rgb: RGB) => doc.setFillColor(...rgb);
  const tracer = (rgb: RGB) => doc.setDrawColor(...rgb);
  const police = (famille: string, taille: number, rgb: RGB = C.ink) => {
    doc.setFont(famille, "normal");
    doc.setFontSize(taille);
    doc.setTextColor(...rgb);
  };

  /** Étiquette mono (comme les étiquettes de production du site). */
  const etiquette = (txt: string, x: number, y: number, fond: RGB = C.ink, encre: RGB = C.ecru) => {
    police(mono, 7.5, encre);
    const t = propre(txt.toUpperCase());
    remplir(fond);
    doc.rect(x, y - 4, doc.getTextWidth(t) + 6, 5.6, "F");
    doc.text(t, x + 3, y);
  };

  /** Carte : fond papier, bordure encre, ombre décalée. */
  const carte = (x: number, y: number, w: number, h: number, fond: RGB = C.paper) => {
    remplir(C.ink);
    doc.rect(x + 1.6, y + 1.6, w, h, "F");
    remplir(fond);
    tracer(C.ink);
    doc.setLineWidth(0.5);
    doc.rect(x, y, w, h, "FD");
  };

  /** Couture : pointillé rouge, comme sur le site. */
  const couture = (x1: number, x2: number, y: number) => {
    tracer(C.rouge);
    doc.setLineWidth(0.6);
    doc.setLineDashPattern([2.2, 1.6], 0);
    doc.line(x1, y, x2, y);
    doc.setLineDashPattern([], 0);
  };

  const nouvellePage = (premiere = false) => {
    if (!premiere) doc.addPage();
    remplir(C.ecru);
    doc.rect(0, 0, W, H, "F");
    if (logo) doc.addImage(logo, "PNG", 14, 9, 33, 10.8);
    else {
      police(titre, 16, C.indigo);
      doc.text("SERITEX", 14, 17);
    }
    etiquette("Maquette · aperçu non contractuel", 54, 16.5, C.rouge, BLANC);
    police(mono, 8, C.muted);
    doc.text(propre(c.reference ? `Demande ${c.reference}` : new Date().toLocaleDateString("fr-FR")), W - 14, 16.5, { align: "right" });
    tracer(C.ink);
    doc.setLineWidth(0.5);
    doc.line(14, 23, W - 14, 23);
  };

  const piedsDePage = () => {
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      couture(14, W - 14, H - 14);
      police(mono, 6.8, C.muted);
      doc.text(
        propre("Aperçu indicatif à l'échelle d'un adulte taille M · aucun prix : le devis est établi par votre conseiller · le BAT vous est soumis avant toute production"),
        14,
        H - 8,
      );
      doc.text(`www.seritex.ci · ${p}/${total}`, W - 14, H - 8, { align: "right" });
    }
  };

  /** Paragraphe ; renvoie l'ordonnée suivante. */
  const paragraphe = (txt: string, x: number, y: number, largeur: number, taille = 9.5, famille = texte, rgb: RGB = C.ink) => {
    police(famille, taille, rgb);
    const lignes = doc.splitTextToSize(propre(txt), largeur) as string[];
    doc.text(lignes, x, y);
    return y + lignes.length * taille * 0.43 + 1.2;
  };

  /* ---------------------------- Page de synthèse --------------------------- */
  nouvellePage(true);
  police(titre, 30, C.ink);
  doc.text("Votre", 14, 40);
  const decalTitre = doc.getTextWidth("Votre ");
  police(titre, 30, C.rouge);
  doc.text("maquette.", 14 + decalTitre, 40);
  couture(14, 70, 45);
  if (c.client) paragraphe(c.client, 14, 52, 160, 10, texte, C.muted);

  const vues = await Promise.all(c.vues.map((v) => svgEnPng(v.svg, LARGEUR_VUE, "jpeg")));
  vues.forEach((png, i) => {
    const x = 14 + i * 84;
    carte(x, 58, 78, 86);
    doc.addImage(png, "JPEG", x + 1, 59, 76, 83.6);
    etiquette(c.vues[i].titre, x + 3, 65);
  });

  const xr = 186;
  const lr = W - 14 - xr;
  carte(xr, 30, lr, 124);
  let y = 39;
  etiquette("Récapitulatif", xr + 5, y, C.orange, C.ink);
  y += 9;
  for (const l of c.article) {
    police(mono, 7, C.muted);
    doc.text(propre(l.libelle.toUpperCase()), xr + 5, y);
    y += 4.4;
    if (l.libelle === "Couleur") {
      remplir(hexEnRgb(c.couleurTextile.hex));
      tracer(C.ink);
      doc.setLineWidth(0.3);
      doc.circle(xr + 7, y - 1.3, 2, "FD");
      y = paragraphe(l.valeur, xr + 11, y, lr - 16, 10.5);
    } else y = paragraphe(l.valeur, xr + 5, y, lr - 10, 10.5);
    y += 1.5;
  }
  police(mono, 7, C.muted);
  doc.text("MARQUAGES", xr + 5, y);
  y += 5.5;
  for (const m of c.marquages) {
    remplir(C.orange);
    doc.circle(xr + 7.5, y - 1.3, 2.7, "F");
    police(titre, 8, C.ink);
    doc.text(String(m.numero), xr + 7.5, y - 0.2, { align: "center" });
    y = paragraphe(`${m.emplacement} · ${m.dimensions} · ${m.technique}`, xr + 12.5, y, lr - 17.5, 9.5);
    y += 1.2;
  }
  paragraphe(
    "Les pages suivantes montrent chaque zone imprimée en gros plan, avec ses dimensions, et notre analyse de votre logo : couleurs détectées, technique que nous vous conseillons et pourquoi.",
    14,
    156,
    164,
    9.5,
    texte,
    C.muted,
  );

  /* --------------------------- Une page par marquage ------------------------ */
  for (const m of c.marquages) {
    nouvellePage();
    etiquette(`Marquage ${m.numero}`, 14, 33, C.indigo, BLANC);
    police(titre, 22, C.ink);
    doc.text(propre(m.emplacement), 14, 44);
    couture(14, 60, 48);

    carte(14, 53, 92, 101);
    if (m.zoom) doc.addImage(await svgEnPng(m.zoom, LARGEUR_VUE, "jpeg"), "JPEG", 15, 54, 90, 99);
    etiquette("Gros plan coté", 17, 59.5);

    let yf = 163;
    const ligne = (lib: string, val: string) => {
      police(mono, 7, C.muted);
      doc.text(lib.toUpperCase(), 14, yf);
      yf = paragraphe(val, 40, yf, 66, 9);
    };
    ligne("Dimensions", m.dimensions);
    ligne("Technique", m.technique);
    if (m.fichier) ligne("Fichier", m.fichier);
    if (m.position) ligne("Position", m.position);
    if (m.consigne) ligne("Précision", `« ${m.consigne} »`);

    const xa = 118;
    const la = W - 14 - xa;
    let ya = 33;
    etiquette("Notre analyse", xa, ya, C.orange, C.ink);
    ya += 8;
    const place = (besoin: number) => {
      if (ya + besoin > H - 20) {
        nouvellePage();
        etiquette(`Marquage ${m.numero} · suite`, xa, 33, C.indigo, BLANC);
        ya = 41;
      }
    };
    const r = m.rapport;
    if (!r) {
      paragraphe("Pas de logo déposé pour ce marquage : votre conseiller vous le demandera.", xa, ya, la, 10);
      continue;
    }
    ya = paragraphe(r.constat, xa, ya, la, 10);

    if (r.couleurs.length) {
      place(18);
      ya += 2;
      police(titre, 11, C.ink);
      doc.text(r.degrade ? "Teintes principales du dégradé" : `Couleurs détectées : ${r.couleurs.length}`, xa, ya);
      ya += 4.5;
      r.couleurs.slice(0, 12).forEach((hex, i) => {
        const cx = xa + 4 + i * 13.5;
        remplir(hexEnRgb(hex));
        tracer(C.ink);
        doc.setLineWidth(0.3);
        doc.circle(cx, ya + 2.6, 3.2, "FD");
        police(mono, 5.5, C.muted);
        doc.text(hex, cx, ya + 9.2, { align: "center" });
      });
      ya += 15;
    }

    police(texte, 10);
    const lignesConseil = doc.splitTextToSize(propre(r.conseil.pourquoi), la - 8) as string[];
    const hConseil = 12 + lignesConseil.length * 4.3;
    place(hConseil + 4);
    carte(xa, ya, la, hConseil, C.orangePale);
    police(titre, 12, C.ink);
    doc.text(propre(`Notre conseil : ${r.conseil.label}`), xa + 4, ya + 7);
    police(texte, 10);
    doc.text(lignesConseil, xa + 4, ya + 12.5);
    ya += hConseil + 7;

    if (r.remarqueChoix) {
      place(12);
      ya = paragraphe(r.remarqueChoix, xa, ya, la, 9.5, texte, C.indigo) + 1.5;
    }

    if (r.alternatives.length) {
      place(14);
      police(titre, 11, C.ink);
      doc.text("Et les autres techniques ?", xa, ya);
      ya += 5.5;
      for (const alt of r.alternatives) {
        place(10);
        ya = paragraphe(`${alt.label} — ${alt.avis}`, xa, ya, la, 9.5, texte, C.muted) + 0.8;
      }
    }

    if (r.aVerifier.length) {
      place(14);
      ya += 1.5;
      police(titre, 11, C.rouge);
      doc.text("À vérifier avec votre conseiller", xa, ya);
      ya += 5.5;
      for (const v of r.aVerifier) {
        place(10);
        remplir(C.rouge);
        doc.rect(xa, ya - 2.4, 1.6, 1.6, "F");
        ya = paragraphe(v, xa + 4, ya, la - 4, 9.5) + 0.8;
      }
    }
  }

  piedsDePage();
  return doc.output("blob");
}

export function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
