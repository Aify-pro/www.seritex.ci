import { validateDemande } from "@/lib/demande";

/**
 * Reçoit une demande de devis du site et l'enregistre dans la base Supabase
 * de l'application Seritex (table `site_leads`, voir supabase/site_leads.sql).
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

  const res = await fetch(`${url}/rest/v1/site_leads`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      contact_name: data.nom,
      company_name: data.entreprise || null,
      email: data.email,
      phone: data.telephone,
      product_family: data.produit,
      technique: data.technique,
      quantity: data.quantite,
      wanted_date: data.delai || null,
      message: data.message || null,
      source: "site",
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    }),
  });

  if (!res.ok) {
    console.error("[demande] insertion Supabase échouée", res.status, await res.text());
    return Response.json(
      { ok: false, message: "Envoi impossible pour le moment. Réessayez ou écrivez-nous à info@seritex.ci." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
