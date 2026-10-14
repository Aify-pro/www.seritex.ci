import { nettoyerDemande } from "@/lib/envoi-personnalisation";
import { sessionCourante } from "@/lib/compte";
import { getReglages, MESSAGE_FERMETURE } from "@/lib/reglages-site";

/**
 * Étape 2 de l'envoi du panier : crée la demande dans la plateforme
 * (create_site_demande, migration 0126). La base refait tous les
 * contrôles (outil activé, article publiable, couleur, grammage,
 * emplacements, fichiers réellement déposés) et applique le même anti-abus
 * que le formulaire de devis.
 */
export async function POST(request: Request) {
  const reglages = await getReglages();
  const ferme = () => Response.json({ ok: false, ferme: true, message: reglages.message ?? MESSAGE_FERMETURE }, { status: 503 });
  if (!reglages.personnaliser) return ferme();

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });
  }
  // Envoi réservé aux personnes identifiées ; l'e-mail de la demande est celui du compte
  // (c'est lui qui rattache la demande à la bonne fiche client).
  const profil = await sessionCourante();
  if (!profil) return Response.json({ ok: false, identification: true, message: "Identifiez-vous pour envoyer votre demande." }, { status: 401 });
  if (raw && typeof raw === "object") {
    const r = raw as { coordonnees?: Record<string, unknown> };
    r.coordonnees = { ...(r.coordonnees ?? {}), email: profil.email };
  }
  const envoi = nettoyerDemande(raw);
  if (!envoi) return Response.json({ ok: false, message: "Demande incomplète : vérifiez vos coordonnées et vos articles." }, { status: 422 });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ ok: false, message: "Envoi momentanément indisponible." }, { status: 503 });

  const res = await fetch(`${url}/rest/v1/rpc/create_site_demande`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      p: {
        envoi_id: envoi.envoi_id,
        ...envoi.coordonnees,
        // Facultatifs : omis plutôt qu'envoyés à null (la base lit ces champs comme des objets JSON).
        articles: envoi.articles.map((a) => ({
          modele_id: a.modele_id,
          couleur_id: a.couleur_id,
          textile_id: a.textile_id,
          quantite: String(a.quantite),
          ...(a.couleurs_zones ? { couleurs_zones: a.couleurs_zones } : {}),
          ...(a.repartition ? { repartition: a.repartition } : {}),
          marquages: a.marquages,
        })),
        fichiers: envoi.fichiers,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[personnaliser] création échouée", res.status, detail);
    if (detail.includes("personnaliser désactivé")) return ferme();
    if (detail.includes("trop de demandes")) {
      return Response.json({ ok: false, message: "Vous avez déjà envoyé plusieurs demandes. Nous revenons vers vous rapidement." }, { status: 429 });
    }
    if (/non proposé|introuvable|invalide/.test(detail)) {
      return Response.json(
        { ok: false, message: "Votre composition n'a pas pu être enregistrée (article ou fichier modifié entre-temps). Rechargez la page et réessayez." },
        { status: 422 },
      );
    }
    return Response.json({ ok: false, message: "Envoi impossible pour le moment. Réessayez ou écrivez-nous à info@seritex.ci." }, { status: 502 });
  }

  const created = (await res.json()) as { reference?: string };
  return Response.json({ ok: true, reference: created.reference ?? null });
}
