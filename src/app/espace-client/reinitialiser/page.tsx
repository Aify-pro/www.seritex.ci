import { FormulaireReinitialisation } from "@/components/espace-client/formulaires-mdp";

export const metadata = { title: "Nouveau mot de passe" };

/** Arrivée depuis le lien e-mail : le jeton est lu ici mais consommé seulement par l'envoi du formulaire. */
export default async function ReinitialiserPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token_hash, type } = await props.searchParams;
  const jeton = typeof token_hash === "string" && token_hash && type === "recovery" ? token_hash : null;
  return <FormulaireReinitialisation jeton={jeton} />;
}
