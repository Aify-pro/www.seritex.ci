import { changerMotDePasse, comptesDisponibles, MOT_DE_PASSE_MIN, poserSession, verifierRecuperation } from "@/lib/compte";

/**
 * Choix du nouveau mot de passe après le lien reçu par e-mail : le jeton (à usage
 * unique) est consommé ICI, par l'envoi du formulaire, puis la session s'ouvre.
 */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!comptesDisponibles()) return Response.json({ ok: false, message: "Service momentanément indisponible." }, { status: 503 });
  const jeton = String(b.token_hash ?? "").slice(0, 200);
  const motDePasse = String(b.mot_de_passe ?? "");
  if (!jeton) return Response.json({ ok: false, lien: true, message: "Ce lien n'est plus valide." }, { status: 400 });
  if (motDePasse.length < MOT_DE_PASSE_MIN) return Response.json({ ok: false, message: `Au moins ${MOT_DE_PASSE_MIN} caractères.` }, { status: 422 });

  const v = await verifierRecuperation(jeton);
  if (!v.ok) return Response.json({ ok: false, lien: true, message: "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau." }, { status: 400 });

  const m = await changerMotDePasse(v.data.access_token, motDePasse);
  if (!m.ok) {
    if (m.erreur.code === "weak_password") return Response.json({ ok: false, message: "Mot de passe trop faible : ajoutez des chiffres ou des lettres variées." }, { status: 422 });
    if (m.erreur.code === "same_password") return Response.json({ ok: false, message: "Choisissez un mot de passe différent de l'ancien." }, { status: 422 });
    console.error("[compte] changement de mot de passe", m.erreur);
    return Response.json({ ok: false, message: "Changement impossible pour le moment. Demandez un nouveau lien." }, { status: 502 });
  }
  await poserSession(v.data);
  return Response.json({ ok: true });
}
