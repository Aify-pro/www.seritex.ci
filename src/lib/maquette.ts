/**
 * Maquette de la composition, générée dans le navigateur : vues face/dos
 * (SVG de l'aperçu rendus en PNG) et PDF A4 récapitulatif. C'est un aperçu,
 * pas un BAT : le BAT est émis par Seritex après le devis.
 */

export type LigneMaquette = { libelle: string; valeur: string };
export type MarquageMaquette = { titre: string; details: string; logoUrl: string | null; alertes: string[] };

export type ContenuMaquette = {
  vues: { titre: string; svg: SVGSVGElement }[];
  article: LigneMaquette[];
  marquages: MarquageMaquette[];
  client?: string;
  reference?: string | null;
};

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
  return format === "jpeg" ? canvas.toDataURL("image/jpeg", 0.85) : canvas.toDataURL("image/png");
}

/** Image unique (face et dos côte à côte) pour « Télécharger l'image ». */
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

/** jsPDF (polices standard) : on remplace les quelques signes hors Latin-1. */
const texte = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[\u202f\u00a0]/g, " ");

export async function pdfMaquette(c: ContenuMaquette): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  const W = 297;
  const encre: [number, number, number] = [21, 22, 58];
  const indigo: [number, number, number] = [42, 45, 124];

  // Bandeau
  doc.setFillColor(...indigo);
  doc.rect(0, 0, W, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SERITEX", 12, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(texte("Maquette de personnalisation - aperçu non contractuel"), 42, 12);
  doc.text(texte(c.reference ? `Demande ${c.reference}` : new Date().toLocaleDateString("fr-FR")), W - 12, 12, { align: "right" });

  // Vues
  const pngs = await Promise.all(c.vues.map((v) => svgEnPng(v.svg, 600, "jpeg")));
  pngs.forEach((png, i) => {
    const x = 12 + i * 78;
    doc.setDrawColor(...encre);
    doc.rect(x, 26, 74, 81);
    doc.addImage(png, "JPEG", x + 1, 27, 72, 79);
    doc.setTextColor(...encre);
    doc.setFontSize(9);
    doc.text(texte(c.vues[i].titre.toUpperCase()), x + 3, 31);
  });

  // Récapitulatif
  let y = 30;
  const xr = 178;
  doc.setTextColor(...encre);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(texte("Récapitulatif"), xr, y);
  y += 7;
  doc.setFontSize(9);
  for (const l of c.article) {
    doc.setFont("helvetica", "bold");
    doc.text(texte(l.libelle), xr, y);
    doc.setFont("helvetica", "normal");
    const lignes = doc.splitTextToSize(texte(l.valeur), W - xr - 40);
    doc.text(lignes, xr + 28, y);
    y += 5 * lignes.length;
  }
  if (c.client) {
    doc.setFont("helvetica", "bold");
    doc.text("Client", xr, y);
    doc.setFont("helvetica", "normal");
    doc.text(texte(c.client), xr + 28, y);
    y += 5;
  }

  // Marquages
  y = Math.max(y + 4, 116);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Marquages", 12, y);
  y += 6;
  for (const m of c.marquages) {
    if (y > 185) {
      doc.addPage();
      y = 20;
    }
    if (m.logoUrl) {
      try {
        // Vignette dans un carré de 16 mm, proportions du logo respectées.
        const { width, height } = doc.getImageProperties(m.logoUrl);
        const k = 16 / Math.max(width, height);
        doc.addImage(m.logoUrl, "PNG", 12 + (16 - width * k) / 2, y - 3 + (16 - height * k) / 2, width * k, height * k, undefined, "FAST");
      } catch {
        // logo illisible pour le PDF : on garde le texte
      }
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(texte(m.titre), 32, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lignes = doc.splitTextToSize(texte(m.details + (m.alertes.length ? ` - A vérifier : ${m.alertes.join(" ; ")}` : "")), W - 32 - 12);
    doc.text(lignes, 32, y + 5);
    y += Math.max(18, 5 + 5 * lignes.length + 4);
  }

  // Pied
  doc.setDrawColor(...encre);
  doc.line(12, 195, W - 12, 195);
  doc.setFontSize(8);
  doc.setTextColor(76, 77, 107);
  doc.text(
    texte(
      "Aperçu indicatif à l'échelle d'un adulte taille M. Aucun prix : le devis est établi par votre conseiller Seritex. Le BAT vous est soumis avant toute production. www.seritex.ci",
    ),
    12,
    200,
  );

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
