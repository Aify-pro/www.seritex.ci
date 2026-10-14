import { comptesDisponibles, creerProfil, emailValide, inscrire, MOT_DE_PASSE_MIN, poserSession, retourSur } from "@/lib/compte";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.seritex.ci";

/**
 * Création d'un compte depuis l'e-shop. Un lien de confirmation est envoyé par
 * e-mail ; la réponse est la même que l'adresse soit déjà connue ou non (on ne
 * révèle pas qui a un compte). Le profil « client » est créé côté plateforme
 * (create_site_account, migration 0125) : Seritex le rattachera ensuite à une
 * fiche client.
 */
export async function POST(request: Request) {
  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });
  }
  // Champ piège : rempli par les robots seulement.
  if (typeof b.site_web === "string" && b.site_web) return Response.json({ ok: true, confirmation: true });
  if (!comptesDisponibles()) return Response.json({ ok: false, message: "La création de compte est momentanément indisponible." }, { status: 503 });

  const s = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
  const email = s(b.email, 160).toLowerCase();
  const nom = s(b.nom, 120);
  const telephone = s(b.telephone, 40);
  const entreprise = s(b.entreprise, 160);
  const motDePasse = String(b.mot_de_passe ?? "");
  const erreurs: Record<string, string> = {};
  if (nom.length < 2) erreurs.nom = "Indiquez votre nom.";
  if (!emailValide(email)) erreurs.email = "Adresse e-mail invalide.";
  if (telephone.replace(/\D/g, "").length < 8) erreurs.telephone = "Indiquez un numéro joignable (8 chiffres minimum).";
  if (motDePasse.length < MOT_DE_PASSE_MIN) erreurs.mot_de_passe = `Au moins ${MOT_DE_PASSE_MIN} caractères.`;
  if (Object.keys(erreurs).length) return Response.json({ ok: false, erreurs }, { status: 422 });

  const r = await inscrire(email, motDePasse, { nom, telephone, entreprise }, `${SITE}/compte/confirme?retour=${encodeURIComponent(retourSur(b.retour))}`);
  if (!r.ok) {
    if (r.erreur.code === "weak_password") return Response.json({ ok: false, erreurs: { mot_de_passe: "Mot de passe trop faible : ajoutez des chiffres ou des lettres variées." } }, { status: 422 });
    if (r.erreur.status === 429 || r.erreur.code === "over_email_send_rate_limit") {
      return Response.json({ ok: false, message: "Trop de tentatives. Patientez quelques minutes avant de réessayer." }, { status: 429 });
    }
    console.error("[compte] inscription refusée", r.erreur);
    return Response.json({ ok: false, message: "Création du compte impossible pour le moment. Réessayez dans un instant." }, { status: 502 });
  }

  const u = r.data;
  // Adresse déjà inscrite : l'authentification renvoie un utilisateur sans identité (leurre) ; on ne crée rien.
  const nouveau = !Array.isArray(u.identities) || u.identities.length > 0;
  if (nouveau && u.id) await creerProfil({ id: u.id, email, nom, telephone, entreprise });

  // Confirmation par e-mail désactivée côté Supabase : la session est déjà ouverte.
  if (nouveau && u.access_token && u.refresh_token) {
    await poserSession({ access_token: u.access_token, refresh_token: u.refresh_token, expires_in: u.expires_in });
    return Response.json({ ok: true, connecte: true });
  }
  return Response.json({ ok: true, confirmation: true });
}
