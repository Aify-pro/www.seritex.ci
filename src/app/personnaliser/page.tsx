import { redirect } from "next/navigation";

/** Ancienne adresse de l'outil : la personnalisation se fait désormais depuis la fiche article de l'e-shop. */
export default function PersonnaliserPage() {
  redirect("/e-shop");
}
