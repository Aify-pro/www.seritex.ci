import { getCatalogue } from "@/lib/catalogue-plateforme";
import { getReglages } from "@/lib/reglages-site";

/**
 * Catalogue public du site (modèles publiables de la plateforme, sans prix).
 * Les couleurs indisponibles restent dans la réponse avec leur statut :
 * l'interface les retire et affiche la mention. E-shop désactivé dans la
 * plateforme : liste vide et `actif: false` (la base renvoie déjà un
 * catalogue vide de son côté).
 */
export async function GET() {
  const { eshop } = await getReglages();
  const modeles = eshop ? await getCatalogue() : [];
  return Response.json(
    { actif: eshop, modeles },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
