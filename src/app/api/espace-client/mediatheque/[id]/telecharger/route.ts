import { site } from "@/content/site";
import { idValide, nonRattache, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

/** Plafond des réponses d'une fonction Vercel (4,5 Mo) ; l'écran n'offre déjà pas le bouton au-delà de TAILLE_MAX_TELECHARGEMENT. */
const TAILLE_MAX = 4_200_000;

/**
 * Télécharge un fichier de la médiathèque du client. Le site ne détient pas les identifiants du NAS :
 * il transmet le jeton du client à la plateforme, qui vérifie l'accès (sa société seulement) et relaie
 * le fichier. Le fichier n'est jamais affiché dans une page du site : téléchargement forcé.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return nonRattache();
  if (!idValide(id)) return Response.json({ introuvable: true }, { status: 404 });

  let res: Response;
  try {
    res = await fetch(`${site.appUrl}/api/site/media/${id}`, { headers: { Authorization: `Bearer ${s.jeton}` }, cache: "no-store" });
  } catch {
    return Response.json({ erreur: true }, { status: 502 });
  }
  if (res.status === 404 || res.status === 403) return Response.json({ introuvable: true }, { status: 404 });
  if (!res.ok) return Response.json({ erreur: true }, { status: 502 });

  const octets = await res.arrayBuffer();
  if (octets.byteLength > TAILLE_MAX) return Response.json({ trop_gros: true }, { status: 413 });
  return new Response(octets, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": res.headers.get("content-disposition") ?? "attachment",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
