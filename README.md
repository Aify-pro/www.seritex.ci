# Site vitrine Seritex

Site public de Seritex (Next.js 16, Tailwind 4), relié à l'application Seritex :

- **Espace client** → lien vers `NEXT_PUBLIC_APP_URL/login` (app.seritex.ci).
- **Demande de devis** (`/devis`) → `POST /api/demande` → fonction `create_site_request` de l'application (migration 0094, PR Aify-pro/Seritex#126) : la demande apparaît dans **Demandes**. Client reconnu par son e-mail → rattachée à sa fiche ; sinon « Client à rattacher » : le commercial crée le client dans Sage puis rattache la demande.

Textes et photos repris de l'ancien site SPIP (`seritex-site-migration-clean-2026-08-30`).

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis renseigner les valeurs
npm run dev                  # http://localhost:3000
```

Vérifications avant chaque mise en ligne : `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Direction artistique — « Atelier Signal »

Générée avec le skill *ui-ux-pro-max* (motif *Trust & Authority + Conversion*, style Bauhaus / éditorial), puis adaptée à la marque :

| Jeton | Valeur | Origine |
|---|---|---|
| `indigo` | `#2a2d7c` | bleu du logo |
| `orange` | `#f28c1b` | orange du logo |
| `rouge` | `#e2162d` | « i » rouge du logo |
| `ecru` | `#f6f1e6` | fond « toile écrue » |
| `ink` | `#15163a` | texte |

- Typo : **Outfit** 900 (titres), **Inter** (texte), **JetBrains Mono** (étiquettes, comme nos étiquettes de production).
- Animations : couture qui se coud dans la marge au fil du défilement (aiguille en tête ; ligne de couture sous l'en-tête sur mobile), titre qui monte mot à mot, photos en parallaxe, compteurs, pastille tournante, pellicule de réalisations qui glisse, coutures qui se tracent sous les titres. Tout est coupé si l'utilisateur a demandé « réduire les animations ».
- Signatures : fil rouge qui « se coud » dans le hero, pointillés de couture, étiquettes textiles à encoche, boutons « presse » à ombre décalée, chaîne « Du fil au colis » (mêmes étapes que l'application, BAT en orange).
- Accessibilité : contrastes ≥ 4,5:1 sur le texte courant, focus visible, `prefers-reduced-motion` respecté, bandeau de logos avec bouton pause, formulaire avec libellés visibles et erreurs sous chaque champ.

## Arborescence

```
src/
  app/            pages (accueil, savoir-faire, techniques/[slug], produits,
                  realisations, commander, devis, mentions-legales) + api/demande
  components/     header, footer, bandeau clients, « Du fil au colis », formulaire
  content/        TOUS les textes : site.ts (coordonnées), techniques.ts, catalogue.ts
  lib/demande.ts  validation du formulaire + conseil de technique indicatif
public/images/    photos de l'ancien site converties en WebP (3 Mo)
```

## Brancher le formulaire à l'application

1. Fusionner la PR Aify-pro/Seritex#126 et appliquer sa migration 0094 (`supabase db push`).
2. Sur Vercel (projet du site) : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement), `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`.

Sans ces variables, le formulaire répond poliment « indisponible, écrivez à info@seritex.ci » (pas d'erreur cassante).

## À vérifier avant la mise en ligne

- [ ] **Téléphones** (`src/content/site.ts`) : les anciens numéros datent d'avant la renumérotation 2021 ; j'ai ajouté `27` (fixe) et `07` (WhatsApp) par hypothèse.
- [ ] **Mentions légales** : raison sociale, RCCM, n° contribuable, directeur de publication (déjà vides sur l'ancien site).
- [ ] **« Plus de 25 ans »** (page Savoir-faire) : l'ancien site disait « depuis 25 ans », sans date.
- [ ] **Logos et photos de clients** : s'assurer que l'usage en référence est accepté par les marques citées.
- [ ] **Espace client** : le portail n'a pas encore de comptes clients ; masquer le lien ou ouvrir le portail avant le lancement.
- [ ] Lien Facebook dans `site.ts`.
- [ ] Le seuil de 50 pièces du « conseil indicatif » (`lib/demande.ts`) est une hypothèse à valider par les commerciaux.
- [ ] CGV et politique de retour de l'ancien site non reprises : elles citaient le droit français et étaient incomplètes.
