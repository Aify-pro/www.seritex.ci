import { listerFichiers, nonRattache, refuser, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return nonRattache();
  const interdit = refuser(s, "mediatheque_voir");
  if (interdit) return interdit;
  const fichiers = await listerFichiers(s.jeton);
  if (!fichiers) return Response.json({ connecte: true, erreur: true }, { status: 502 });
  return Response.json({ connecte: true, rattache: true, fichiers });
}
