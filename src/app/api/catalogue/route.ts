import { getCatalogue } from "@/lib/catalogue-plateforme";

/**
 * Catalogue public du site (modèles publiables de la plateforme, sans prix),
 * pour le studio de conception côté navigateur. Les couleurs indisponibles
 * restent dans la réponse avec leur statut : l'interface les retire et
 * affiche la mention.
 */
export async function GET() {
  const modeles = await getCatalogue();
  return Response.json(
    { modeles },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
