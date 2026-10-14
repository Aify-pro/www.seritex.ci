import { detailDemande, idValide, nonRattache, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return nonRattache();
  if (!idValide(id)) return Response.json({ connecte: true, introuvable: true }, { status: 404 });
  const demande = await detailDemande(s.jeton, s.profil.id, id);
  // Hors de sa société, la base ne renvoie rien : même réponse qu'une demande qui n'existe pas.
  if (!demande) return Response.json({ connecte: true, introuvable: true }, { status: 404 });
  return Response.json({ connecte: true, rattache: true, demande });
}
