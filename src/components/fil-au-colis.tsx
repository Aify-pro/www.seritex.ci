import { Reveal } from "./reveal";

/**
 * « Du fil au colis » : la chaîne de production Seritex, de la maille à la
 * livraison. Ce sont les mêmes étapes que l'on suit dans l'application.
 */
const etapes = [
  { n: "01", titre: "Tricotage", texte: "À partir du fil de coton, nous tricotons nous-mêmes notre tissu." },
  { n: "02", titre: "Teinture", texte: "Le tissu est teint dans la couleur exacte de votre charte." },
  { n: "03", titre: "Coupe", texte: "Les patrons sont coupés taille par taille, selon votre modèle." },
  { n: "04", titre: "Confection", texte: "Nos ateliers assemblent chaque pièce : col, manches, finitions." },
  { n: "05", titre: "BAT", texte: "Vous validez un bon à tirer (ou un échantillon) avant toute série." },
  { n: "06", titre: "Marquage", texte: "Sérigraphie, broderie, flex ou impression numérique." },
  { n: "07", titre: "Livraison", texte: "Livrés par notre équipe ou retirés à l'atelier, sur rendez-vous." },
];

export function FilAuColis({ dark = false }: { dark?: boolean }) {
  return (
    <ol className="relative grid gap-0 md:grid-cols-7">
      <div
        aria-hidden
        className={`couture absolute top-[27px] right-0 left-0 hidden md:block ${dark ? "text-orange" : "text-rouge"}`}
      />
      {etapes.map((e, i) => (
        <Reveal as="li" key={e.n} delay={i * 80} className="relative flex gap-5 pb-10 md:block md:pr-4 md:pb-0">
          <div
            aria-hidden
            className={`couture-v absolute top-14 bottom-0 left-[27px] md:hidden ${dark ? "text-orange" : "text-rouge"}`}
          />
          <span
            className={`relative z-10 inline-flex size-14 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-medium ${
              dark ? "border-ecru bg-ink text-ecru" : "border-ink bg-paper text-ink"
            } ${e.titre === "BAT" ? "bg-orange! text-ink! border-ink!" : ""}`}
          >
            {e.n}
          </span>
          <div className="md:mt-5">
            <h3 className="font-display text-xl font-bold">{e.titre}</h3>
            <p className={`mt-1 text-[15px] leading-relaxed ${dark ? "text-ecru/75" : "text-muted"}`}>{e.texte}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
