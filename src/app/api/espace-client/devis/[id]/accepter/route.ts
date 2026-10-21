import { autorise, MESSAGE_INTERDIT } from "@/lib/droits";
import { accepterDevis, idValide, memeOrigine, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

/** Accepter un devis : action engageante (lance la fabrication). Confirmation explicite exigée dans le corps. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!memeOrigine(req) || !req.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ ok: false, message: "Requête refusée." }, { status: 403 });
  }
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return Response.json({ ok: false, message: "Votre compte n'est pas encore rattaché." }, { status: 403 });
  if (!autorise(s.profil.droits, "devis_accepter")) return Response.json({ ok: false, message: MESSAGE_INTERDIT }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { confirme?: unknown };
  if (b.confirme !== true) return Response.json({ ok: false, message: "Confirmez l'acceptation du devis." }, { status: 422 });
  if (!idValide(id)) return Response.json({ ok: false, message: "Ce devis est introuvable." }, { status: 404 });
  const r = await accepterDevis(s.jeton, id);
  if (r.ok) return Response.json({ ok: true });
  return Response.json({ ok: false, message: r.message }, { status: r.code === "introuvable" ? 404 : r.code === "indisponible" ? 409 : 502 });
}
