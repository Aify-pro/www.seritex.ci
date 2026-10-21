import { listerEchantillons, nonRattache, refuser, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return nonRattache();
  const interdit = refuser(s, "echantillons_voir");
  if (interdit) return interdit;
  const echantillons = await listerEchantillons(s.jeton);
  if (!echantillons) return Response.json({ connecte: true, erreur: true }, { status: 502 });
  return Response.json({ connecte: true, rattache: true, echantillons });
}
