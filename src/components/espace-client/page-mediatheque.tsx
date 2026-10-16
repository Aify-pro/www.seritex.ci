"use client";

import { Download } from "lucide-react";
import { CATEGORIE_FICHIER, formatDateFr, formatTaille, TAILLE_MAX_TELECHARGEMENT, type FichierListe } from "@/lib/espace-client-types";
import { Chargement, Ecran, Message } from "./ecran";
import { useDonnees } from "./use-donnees";

const ORDRE = ["visuel", "image_de_marque", "fiche_technique", "nuancier", "autre"];

function Liste() {
  const r = useDonnees<{ fichiers: FichierListe[] }>("/api/espace-client/mediatheque");
  if (r.statut === "charge") return <Chargement />;
  if (r.statut === "deconnecte") return <Message alerte>Votre session a expiré. Rechargez la page pour vous reconnecter.</Message>;
  if (!r.donnees) return <Message alerte>Impossible de charger votre médiathèque pour le moment. Réessayez dans un instant.</Message>;
  const fichiers = r.donnees.fichiers;
  if (fichiers.length === 0) return <Message>Aucun fichier pour le moment. Vos visuels, votre image de marque et vos fiches techniques apparaissent ici.</Message>;
  const groupes = ORDRE.map((c) => ({ c, items: fichiers.filter((f) => (CATEGORIE_FICHIER[f.categorie] ? f.categorie : "autre") === c) })).filter((g) => g.items.length > 0);
  return (
    <div className="space-y-8">
      {groupes.map((g) => (
        <section key={g.c} aria-labelledby={`cat-${g.c}`}>
          <h2 id={`cat-${g.c}`} className="font-display text-xl font-black">{CATEGORIE_FICHIER[g.c]}</h2>
          <ul className="mt-3 space-y-2">
            {g.items.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-ink bg-paper p-3 shadow-hard-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-bold break-words">{f.nom}</p>
                  <p className="text-sm text-muted">
                    Ajouté le {formatDateFr(f.date)}
                    {f.taille != null ? ` · ${formatTaille(f.taille)}` : ""}
                  </p>
                </div>
                {f.taille != null && f.taille > TAILLE_MAX_TELECHARGEMENT ? (
                  <p className="max-w-xs text-sm text-muted">Fichier volumineux : demandez-le à votre conseiller (info@seritex.ci).</p>
                ) : (
                  <a href={`/api/espace-client/mediatheque/${f.id}/telecharger`} download className="inline-flex min-h-11 items-center gap-2 border-2 border-ink bg-orange px-4 font-display text-sm font-bold">
                    <Download aria-hidden size={16} /> Télécharger
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm text-muted">Pour ajouter ou remplacer un fichier, envoyez-le à votre conseiller ou à info@seritex.ci.</p>
    </div>
  );
}

export function PageMediatheque() {
  return (
    <Ecran titre="Ma médiathèque" retour="/espace-client/mediatheque">
      {() => <Liste />}
    </Ecran>
  );
}
