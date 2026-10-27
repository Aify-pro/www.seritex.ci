import { COMMENTAIRE_MAX, repondreConfirmation } from "@/lib/confirmation-livraison";
import { memeOrigine } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

/** Réponse du client depuis le lien de confirmation de réception (« tout est conforme » ou « j'ai un problème »). */
export async function POST(req: Request) {
  if (!memeOrigine(req) || !req.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ ok: false, message: "Requête refusée." }, { status: 403 });
  }
  const b = (await req.json().catch(() => ({}))) as { jeton?: unknown; reponse?: unknown; commentaire?: unknown };
  if (typeof b.jeton !== "string" || (b.reponse !== "confirme" && b.reponse !== "probleme")) {
    return Response.json({ ok: false, message: "Demande incomplète." }, { status: 400 });
  }
  const commentaire = typeof b.commentaire === "string" ? b.commentaire.slice(0, COMMENTAIRE_MAX) : "";
  const r = await repondreConfirmation(b.jeton, b.reponse, commentaire);
  if (r.ok) return Response.json({ ok: true });
  return Response.json({ ok: false, message: r.message }, { status: r.status });
}
