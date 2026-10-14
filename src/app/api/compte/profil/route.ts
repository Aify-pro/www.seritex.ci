import { majTelephone, sessionCourante } from "@/lib/compte";

/** Mise à jour du téléphone du compte connecté (seule coordonnée modifiable depuis le site). */
export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const profil = await sessionCourante();
  if (!profil) return Response.json({ ok: false, identification: true, message: "Identifiez-vous." }, { status: 401 });
  const telephone = String(b.telephone ?? "").trim();
  if (telephone.replace(/\D/g, "").length < 8) return Response.json({ ok: false, message: "Indiquez un numéro joignable (8 chiffres minimum)." }, { status: 422 });
  if (!(await majTelephone(profil.id, telephone))) return Response.json({ ok: false, message: "Enregistrement impossible pour le moment." }, { status: 502 });
  return Response.json({ ok: true, telephone: telephone.slice(0, 40) });
}
