import { BUCKET, FICHIERS_MAX, nomSur, TAILLE_MAX, TYPES_ACCEPTES, type FichierPrevu } from "@/lib/envoi-personnalisation";
import { getReglages, MESSAGE_FERMETURE } from "@/lib/reglages-site";

/**
 * Étape 1 de l'envoi « Personnaliser » : liens de dépôt signés, à usage
 * unique, pour que le navigateur dépose logos et maquette DIRECTEMENT dans
 * le stockage privé de la plateforme (un envoi par le serveur du site serait
 * limité à 4,5 Mo). Les fichiers ne sont rattachés à une demande qu'à
 * l'étape 2 (/api/personnaliser/envoyer), après contrôle par la base.
 */
export async function POST(request: Request) {
  const reglages = await getReglages();
  if (!reglages.personnaliser) {
    return Response.json({ ok: false, ferme: true, message: reglages.message ?? MESSAGE_FERMETURE }, { status: 503 });
  }

  let body: { fichiers?: FichierPrevu[]; site_web?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });
  }
  // Champ piège : rempli par les robots seulement.
  if (body.site_web) return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });

  const fichiers = Array.isArray(body.fichiers) ? body.fichiers : [];
  if (fichiers.length === 0 || fichiers.length > FICHIERS_MAX) {
    return Response.json({ ok: false, message: "Nombre de fichiers invalide." }, { status: 422 });
  }
  for (const f of fichiers) {
    if (!(Number(f.taille) > 0 && Number(f.taille) <= TAILLE_MAX)) {
      return Response.json({ ok: false, message: `« ${String(f.nom).slice(0, 60)} » dépasse 15 Mo.` }, { status: 422 });
    }
    if (!TYPES_ACCEPTES.includes(String(f.type || "application/octet-stream"))) {
      return Response.json({ ok: false, message: `Format non accepté : « ${String(f.nom).slice(0, 60)} ».` }, { status: 422 });
    }
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[personnaliser] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
    return Response.json({ ok: false, message: "Envoi momentanément indisponible." }, { status: 503 });
  }

  const envoiId = crypto.randomUUID();
  const depots: { path: string; url: string }[] = [];
  for (const [i, f] of fichiers.entries()) {
    const path = `envois/${envoiId}/${i + 1}-${nomSur(String(f.nom))}`;
    const res = await fetch(`${url}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[personnaliser] lien de dépôt refusé", res.status, await res.text());
      return Response.json({ ok: false, message: "Envoi momentanément indisponible." }, { status: 502 });
    }
    const { url: signe } = (await res.json()) as { url: string };
    depots.push({ path, url: `${url}/storage/v1${signe}` });
  }

  return Response.json({ ok: true, envoiId, depots });
}
