import { listerDemandes, nonRattache, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return nonRattache();
  const demandes = await listerDemandes(s.jeton);
  if (!demandes) return Response.json({ connecte: true, erreur: true }, { status: 502 });
  return Response.json({ connecte: true, rattache: true, demandes });
}
