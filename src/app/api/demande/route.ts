import { produits, techniquesChoix, validateDemande } from "@/lib/demande";

/**
 * Reçoit une demande de devis du site et la crée dans la plateforme Seritex
 * (fonction SQL `create_site_request`, migration 0094 de l'application) :
 *   - client reconnu par son e-mail → demande rattachée à sa fiche ;
 *   - sinon → demande « Client à rattacher » pour les commerciaux.
 * La clé « service role » ne quitte jamais le serveur.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Requête invalide." }, { status: 400 });
  }

  // Champ piège : invisible pour un humain, rempli par les robots.
  if (typeof body.site_web === "string" && body.site_web.length > 0) {
    return Response.json({ ok: true });
  }

  const { data, errors } = validateDemande(body);
  if (!data) {
    return Response.json({ ok: false, errors }, { status: 422 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[demande] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant");
    return Response.json(
      { ok: false, message: "Le formulaire est momentanément indisponible. Écrivez-nous à info@seritex.ci." },
      { status: 503 },
    );
  }

  const res = await fetch(`${url}/rest/v1/rpc/create_site_request`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p: {
        nom: data.nom,
        entreprise: data.entreprise,
        email: data.email,
        telephone: data.telephone,
        produit_libelle: produits.find((p) => p.value === data.produit)?.label ?? data.produit,
        technique_libelle: techniquesChoix.find((t) => t.value === data.technique)?.label ?? data.technique,
        quantite: String(data.quantite),
        date_souhaitee: data.delai,
        message: data.message,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[demande] création échouée", res.status, detail);
    if (detail.includes("trop de demandes")) {
      return Response.json(
        { ok: false, message: "Vous avez déjà envoyé plusieurs demandes. Nous revenons vers vous rapidement." },
        { status: 429 },
      );
    }
    return Response.json(
      { ok: false, message: "Envoi impossible pour le moment. Réessayez ou écrivez-nous à info@seritex.ci." },
      { status: 502 },
    );
  }

  const created = (await res.json()) as { reference?: string };
  return Response.json({ ok: true, reference: created.reference ?? null });
}
