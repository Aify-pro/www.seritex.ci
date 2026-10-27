import { autorise, MESSAGE_INTERDIT } from "@/lib/droits";
import { COMMENTAIRE_ECHANTILLON_MAX } from "@/lib/espace-client-types";
import { idValide, memeOrigine, repondreEchantillon, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

/** Réponse du client sur un échantillon : valider, demander un ajustement ou refuser. Action engageante : même garde que l'acceptation d'un devis. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!memeOrigine(req) || !req.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ ok: false, message: "Requête refusée." }, { status: 403 });
  }
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return Response.json({ ok: false, message: "Votre compte n'est pas encore rattaché." }, { status: 403 });
  if (!autorise(s.profil.droits, "echantillons_voir")) return Response.json({ ok: false, message: MESSAGE_INTERDIT }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { reponse?: unknown; commentaire?: unknown };
  if (b.reponse !== "valide" && b.reponse !== "a_ajuster" && b.reponse !== "refuse") {
    return Response.json({ ok: false, message: "Demande incomplète." }, { status: 400 });
  }
  if (!idValide(id)) return Response.json({ ok: false, message: "Cet échantillon est introuvable." }, { status: 404 });
  const commentaire = typeof b.commentaire === "string" ? b.commentaire.slice(0, COMMENTAIRE_ECHANTILLON_MAX) : "";
  const r = await repondreEchantillon(s.jeton, id, b.reponse, commentaire);
  if (r.ok) return Response.json({ ok: true });
  const status = r.code === "introuvable" ? 404 : r.code === "indisponible" ? 409 : r.code === "invalide" ? 422 : 502;
  return Response.json({ ok: false, message: r.message }, { status });
}
