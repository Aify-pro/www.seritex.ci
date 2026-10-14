import { comptesDisponibles, sessionCourante } from "@/lib/compte";

export const dynamic = "force-dynamic";

/** Qui est connecté ? (profil ou null) — `disponible: false` si les comptes ne sont pas configurés. */
export async function GET() {
  if (!comptesDisponibles()) return Response.json({ disponible: false, profil: null });
  return Response.json({ disponible: true, profil: await sessionCourante() });
}
