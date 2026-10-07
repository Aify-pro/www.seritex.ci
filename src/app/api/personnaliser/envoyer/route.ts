import { nettoyerEnvoi } from "@/lib/envoi-personnalisation";
import { getReglages, MESSAGE_FERMETURE } from "@/lib/reglages-site";

/**
 * Étape 2 de l'envoi « Personnaliser » : crée la demande dans la plateforme
 * (create_site_personnalisation, migration 0110). La base refait tous les
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
  const envoi = nettoyerEnvoi(raw);
  if (!envoi) return Response.json({ ok: false, message: "Composition incomplète : vérifiez vos coordonnées et la quantité." }, { status: 422 });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({ ok: false, message: "Envoi momentanément indisponible." }, { status: 503 });

  const res = await fetch(`${url}/rest/v1/rpc/create_site_personnalisation`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      p: {
        envoi_id: envoi.envoi_id,
        ...envoi.coordonnees,
        modele_id: envoi.modele_id,
        couleur_id: envoi.couleur_id,
        textile_id: envoi.textile_id,
        quantite: String(envoi.quantite),
        repartition: envoi.repartition,
        marquages: envoi.marquages,
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
