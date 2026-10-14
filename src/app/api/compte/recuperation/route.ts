import { comptesDisponibles, demanderRecuperation, emailValide } from "@/lib/compte";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.seritex.ci";

/** Demande d'un lien de réinitialisation ; la réponse est identique que l'adresse ait un compte ou non. */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof b.site_web === "string" && b.site_web) return Response.json({ ok: true });
  if (!comptesDisponibles()) return Response.json({ ok: false, message: "Service momentanément indisponible." }, { status: 503 });
  const email = String(b.email ?? "").trim().toLowerCase().slice(0, 160);
  if (!emailValide(email)) return Response.json({ ok: false, message: "Adresse e-mail invalide." }, { status: 422 });
  try {
    await demanderRecuperation(email, `${SITE}/espace-client/reinitialiser`);
  } catch (e) {
    // Jamais de différence visible entre un échec interne et une adresse inconnue.
    console.error("[compte] récupération", e);
  }
  return Response.json({ ok: true });
}
