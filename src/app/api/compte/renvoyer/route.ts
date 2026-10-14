import { comptesDisponibles, emailValide, renvoyerConfirmation, retourSur } from "@/lib/compte";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.seritex.ci";

/** Renvoie le lien de confirmation (réponse identique que l'adresse existe ou non). */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  if (!comptesDisponibles() || !emailValide(email)) return Response.json({ ok: false, message: "Adresse invalide." }, { status: 422 });
  const r = await renvoyerConfirmation(email, `${SITE}/compte/confirme?retour=${encodeURIComponent(retourSur(b.retour))}`);
  if (!r.ok && r.erreur.status === 429) return Response.json({ ok: false, message: "Un e-mail vient d'être envoyé : patientez une minute avant de recommencer." }, { status: 429 });
  return Response.json({ ok: true });
}
