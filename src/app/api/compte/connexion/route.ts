import { comptesDisponibles, connecter, emailValide, poserSession, profilDe } from "@/lib/compte";

/** Connexion par e-mail et mot de passe ; ouvre la session (cookies httpOnly). */
export async function POST(request: Request) {
  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });
  }
  if (typeof b.site_web === "string" && b.site_web) return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });
  if (!comptesDisponibles()) return Response.json({ ok: false, message: "La connexion est momentanément indisponible." }, { status: 503 });

  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  const motDePasse = String(b.mot_de_passe ?? "");
  if (!emailValide(email) || !motDePasse) return Response.json({ ok: false, message: "Indiquez votre e-mail et votre mot de passe." }, { status: 422 });

  const r = await connecter(email, motDePasse);
  if (!r.ok) {
    if (r.erreur.code === "email_not_confirmed") {
      return Response.json({ ok: false, code: "non_confirme", message: "Votre adresse n'est pas encore confirmée : cliquez sur le lien reçu par e-mail." }, { status: 403 });
    }
    if (r.erreur.status === 429) return Response.json({ ok: false, message: "Trop de tentatives. Patientez quelques minutes." }, { status: 429 });
    if (r.erreur.status >= 500 || r.erreur.status === 0) return Response.json({ ok: false, message: "Connexion impossible pour le moment. Réessayez." }, { status: 502 });
    return Response.json({ ok: false, message: "E-mail ou mot de passe incorrect." }, { status: 401 });
  }

  const profil = await profilDe(r.data.user, r.data.access_token);
  if (!profil) return Response.json({ ok: false, message: "Ce compte n'a pas pu être ouvert. Écrivez-nous à info@seritex.ci." }, { status: 403 });
  await poserSession(r.data);
  return Response.json({ ok: true, profil });
}
