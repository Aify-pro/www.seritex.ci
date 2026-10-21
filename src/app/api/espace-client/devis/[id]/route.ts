import { autorise } from "@/lib/droits";
import { detailDevis, idValide, nonRattache, refuser, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return nonRattache();
  const interdit = refuser(s, "devis_voir");
  if (interdit) return interdit;
  if (!idValide(id)) return Response.json({ connecte: true, introuvable: true }, { status: 404 });
  const devis = await detailDevis(s.jeton, id);
  if (!devis) return Response.json({ connecte: true, introuvable: true }, { status: 404 });
  const acceptationRetiree = !autorise(s.profil.droits, "devis_accepter");
  return Response.json({
    connecte: true,
    rattache: true,
    devis: acceptationRetiree ? { ...devis, acceptation_retiree: devis.peut_accepter, peut_accepter: false } : devis,
  });
}
