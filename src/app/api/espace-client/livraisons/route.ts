import { listerLivraisons, nonRattache, refuser, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return nonRattache();
  const interdit = refuser(s, "livraisons_voir");
  if (interdit) return interdit;
  const livraisons = await listerLivraisons(s.jeton);
  if (!livraisons) return Response.json({ connecte: true, erreur: true }, { status: 502 });
  return Response.json({ connecte: true, rattache: true, livraisons });
}
