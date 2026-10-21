import { detailLivraison, idValide, nonRattache, refuser, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return nonRattache();
  const interdit = refuser(s, "livraisons_voir");
  if (interdit) return interdit;
  if (!idValide(id)) return Response.json({ connecte: true, introuvable: true }, { status: 404 });
  const livraison = await detailLivraison(s.jeton, id);
  if (!livraison) return Response.json({ connecte: true, introuvable: true }, { status: 404 });
  return Response.json({ connecte: true, rattache: true, livraison });
}
