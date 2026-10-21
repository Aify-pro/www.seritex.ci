"use client";

import Link from "next/link";
import { Building2, Clock, FileText, FolderOpen, Loader2, Package, Receipt, Shirt, ShoppingBag, Truck, UserRound } from "lucide-react";
import { Identification } from "@/components/compte/identification";
import { useCompte } from "@/components/compte/use-compte";
import { autorise, type Droit } from "@/lib/droits";
import { CadreEspace } from "./cadre";

const carte = "block border-2 border-ink bg-paper p-5 shadow-hard-sm transition hover:-translate-y-0.5";

/** Accueil de l'espace client : connexion / création de compte, attente de rattachement, ou tableau d'accueil. */
export function AccueilEspaceClient() {
  const compte = useCompte();
  const profil = compte.profil;

  if (!compte.charge) {
    return (
      <p role="status" className="text-muted">
        <Loader2 aria-hidden className="mr-2 inline animate-spin" size={16} /> Chargement…
      </p>
    );
  }

  if (!compte.disponible) {
    return (
      <div role="alert" className="max-w-xl border-2 border-ink bg-orange/15 p-6">
        <p className="font-display text-2xl font-black">L&apos;espace client est momentanément indisponible.</p>
        <p className="mt-2 text-muted">Votre conseiller reste joignable pour toute demande.</p>
        <Link href="/devis" className="mt-4 inline-flex min-h-12 items-center border-2 border-ink bg-orange px-5 font-display font-bold">
          Demander un devis
        </Link>
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="font-mono text-xs tracking-widest text-rouge uppercase">Espace client</p>
          <h1 className="mt-2 font-display text-4xl leading-[0.95] font-black tracking-tighter sm:text-5xl">Votre espace Seritex.</h1>
          <p className="mt-4 text-lg text-muted">
            Retrouvez ici vos demandes de devis, vos devis, le suivi de vos commandes, vos livraisons et vos échantillons. Un seul compte, aussi pour commander sur l&apos;e-shop.
          </p>
        </div>
        <div className="border-2 border-ink bg-paper p-5 shadow-hard sm:p-8 lg:col-span-7">
          <Identification retour="/espace-client" onConnecte={compte.connecte} />
        </div>
      </div>
    );
  }

  const ok = (d: Droit) => autorise(profil.droits, d);
  return (
    <CadreEspace profil={profil} titre={`Bonjour ${profil.nom.split(" ")[0]}.`} deconnecter={() => void compte.deconnecter()}>
      {!profil.rattache ? (
        <div role="status" className="max-w-2xl space-y-3 border-2 border-ink bg-orange/15 p-6">
          <Clock aria-hidden className="text-indigo" size={36} />
          <h2 className="font-display text-2xl font-black">Votre compte est en cours de rattachement.</h2>
          <p>
            Votre inscription est bien enregistrée. Notre équipe la rattache à votre fiche client : vos demandes et vos devis apparaîtront ici ensuite.
            Vous pouvez déjà composer vos articles sur l&apos;e-shop et envoyer une demande.
          </p>
          <p className="text-sm text-muted">Une question ? info@seritex.ci</p>
        </div>
      ) : (
        <p className="mb-6 inline-flex items-center gap-2 border-2 border-ink bg-paper px-3 py-2 text-sm">
          <Building2 aria-hidden size={16} className="text-rouge" /> <strong>{profil.societe}</strong>
        </p>
      )}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        <li>
          <Link href="/e-shop" className={carte}>
            <ShoppingBag aria-hidden className="text-rouge" />
            <p className="mt-2 font-display text-xl font-black">Composer un article</p>
            <p className="text-sm text-muted">Choisissez, ajoutez votre logo, envoyez une demande de devis.</p>
          </Link>
        </li>
        {profil.rattache && (
          <>
            <li>
              <Link href="/espace-client/demandes" className={carte}>
                <FileText aria-hidden className="text-rouge" />
                <p className="mt-2 font-display text-xl font-black">Mes demandes</p>
                <p className="text-sm text-muted">L&apos;avancement de vos demandes et vos échanges avec Seritex.</p>
              </Link>
            </li>
            {ok("devis_voir") && (
            <li>
              <Link href="/espace-client/devis" className={carte}>
                <Receipt aria-hidden className="text-rouge" />
                <p className="mt-2 font-display text-xl font-black">Mes devis</p>
                <p className="text-sm text-muted">Vos devis, leurs lignes, leurs totaux et leurs conditions.</p>
              </Link>
            </li>
            )}
            {ok("commandes_voir") && (
            <li>
              <Link href="/espace-client/commandes" className={carte}>
                <Package aria-hidden className="text-rouge" />
                <p className="mt-2 font-display text-xl font-black">Mes commandes</p>
                <p className="text-sm text-muted">L&apos;avancement de la fabrication de vos commandes.</p>
              </Link>
            </li>
            )}
            {ok("livraisons_voir") && (
            <li>
              <Link href="/espace-client/livraisons" className={carte}>
                <Truck aria-hidden className="text-rouge" />
                <p className="mt-2 font-display text-xl font-black">Mes livraisons</p>
                <p className="text-sm text-muted">Où en est chaque livraison, et ce qu&apos;elle contient.</p>
              </Link>
            </li>
            )}
            {ok("echantillons_voir") && (
            <li>
              <Link href="/espace-client/echantillons" className={carte}>
                <Shirt aria-hidden className="text-rouge" />
                <p className="mt-2 font-display text-xl font-black">Mes échantillons</p>
                <p className="text-sm text-muted">Les échantillons préparés pour vous avant une commande.</p>
              </Link>
            </li>
            )}
            {ok("mediatheque_voir") && (
            <li>
              <Link href="/espace-client/mediatheque" className={carte}>
                <FolderOpen aria-hidden className="text-rouge" />
                <p className="mt-2 font-display text-xl font-black">Ma médiathèque</p>
                <p className="text-sm text-muted">Vos visuels, votre image de marque et vos fiches techniques.</p>
              </Link>
            </li>
            )}
          </>
        )}
        <li>
          <Link href="/espace-client/compte" className={carte}>
            <UserRound aria-hidden className="text-rouge" />
            <p className="mt-2 font-display text-xl font-black">Mon compte</p>
            <p className="text-sm text-muted">Vos coordonnées et votre mot de passe.</p>
          </Link>
        </li>
      </ul>
    </CadreEspace>
  );
}
