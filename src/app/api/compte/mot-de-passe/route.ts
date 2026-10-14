import { changerMotDePasse, connecter, MOT_DE_PASSE_MIN, sessionAvecJeton } from "@/lib/compte";

/** Changement de mot de passe depuis « Mon compte » : demande l'ancien pour confirmer que c'est bien la personne. */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const session = await sessionAvecJeton();
  if (!session) return Response.json({ ok: false, identification: true, message: "Identifiez-vous." }, { status: 401 });
  const actuel = String(b.actuel ?? "");
  const nouveau = String(b.nouveau ?? "");
  if (nouveau.length < MOT_DE_PASSE_MIN) return Response.json({ ok: false, message: `Au moins ${MOT_DE_PASSE_MIN} caractères.` }, { status: 422 });

  const verif = await connecter(session.profil.email, actuel);
  if (!verif.ok) return Response.json({ ok: false, message: "Le mot de passe actuel est incorrect." }, { status: 403 });

  const r = await changerMotDePasse(session.jeton, nouveau);
  if (!r.ok) {
    if (r.erreur.code === "weak_password") return Response.json({ ok: false, message: "Mot de passe trop faible : ajoutez des chiffres ou des lettres variées." }, { status: 422 });
    if (r.erreur.code === "same_password") return Response.json({ ok: false, message: "Choisissez un mot de passe différent de l'ancien." }, { status: 422 });
    return Response.json({ ok: false, message: "Changement impossible pour le moment." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
