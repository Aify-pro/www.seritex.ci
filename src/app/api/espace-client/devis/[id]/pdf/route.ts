import { site } from "@/content/site";
import { idValide, nonRattache, refuser, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

/** Plafond des réponses d'une fonction Vercel (4,5 Mo) : une proforma tient très largement dedans. */
const TAILLE_MAX = 4_200_000;

/**
 * Télécharge la proforma d'un devis en PDF. Le PDF est celui de la plateforme (même mise en page que celle
 * du personnel) : le site lui transmet le jeton du client, et la plateforme ne le génère que pour un devis
 * de sa société, déjà envoyé.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return nonRattache();
  const interdit = refuser(s, "devis_voir");
  if (interdit) return interdit;
  if (!idValide(id)) return Response.json({ introuvable: true }, { status: 404 });

  let res: Response;
  try {
    res = await fetch(`${site.appUrl}/api/site/devis/${id}/pdf`, { headers: { Authorization: `Bearer ${s.jeton}` }, cache: "no-store" });
  } catch {
    return Response.json({ erreur: true }, { status: 502 });
  }
  if (res.status === 404 || res.status === 403) return Response.json({ introuvable: true }, { status: 404 });
  if (!res.ok) return Response.json({ erreur: true }, { status: 502 });

  const octets = await res.arrayBuffer();
  if (octets.byteLength > TAILLE_MAX) return Response.json({ trop_gros: true }, { status: 413 });
  return new Response(octets, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": res.headers.get("content-disposition") ?? "attachment; filename=proforma.pdf",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
