import { ecrireMessage, idValide, memeOrigine, sessionClient } from "@/lib/espace-client";

export const dynamic = "force-dynamic";

/** Écrire à Seritex dans le fil d'une demande. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!memeOrigine(req) || !req.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ ok: false, message: "Requête refusée." }, { status: 403 });
  }
  const s = await sessionClient();
  if (s instanceof Response) return s;
  if (!s.profil.rattache) return Response.json({ ok: false, message: "Votre compte n'est pas encore rattaché." }, { status: 403 });
  if (!idValide(id)) return Response.json({ ok: false, message: "Cette demande est introuvable." }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { texte?: unknown };
  const r = await ecrireMessage(s.jeton, s.profil.id, id, typeof b.texte === "string" ? b.texte : "");
  if (r.ok) return Response.json({ ok: true });
  return Response.json({ ok: false, message: r.message }, { status: r.code === "invalide" ? 422 : r.code === "introuvable" ? 404 : 502 });
}
