import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Reveal } from "./reveal";

type Variant = "primary" | "orange" | "ghost" | "paper";

const variants: Record<Variant, string> = {
  primary: "bg-indigo text-white border-ink hover:bg-indigo-deep",
  orange: "bg-orange text-ink border-ink",
  paper: "bg-paper text-ink border-ink",
  ghost: "bg-transparent text-current border-current shadow-none!",
};

export function ButtonLink({
  variant = "primary",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return (
    <Link
      {...props}
      className={`btn-presse inline-flex min-h-12 items-center justify-center gap-2 border-2 px-6 py-3 font-display text-base font-bold tracking-tight ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

/** Petite étiquette mono, comme une étiquette de production. */
export function Etiquette({
  children,
  tone = "ink",
  className = "",
}: {
  children: ReactNode;
  tone?: "ink" | "orange" | "rouge" | "indigo" | "paper";
  className?: string;
}) {
  const tones = {
    ink: "bg-ink text-ecru",
    orange: "bg-orange text-ink",
    rouge: "bg-rouge text-white",
    indigo: "bg-indigo text-white",
    paper: "bg-paper text-ink",
  };
  return (
    <span
      className={`etiquette inline-flex items-center py-1 pr-3 pl-5 font-mono text-xs font-medium tracking-wider uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  label,
  title,
  intro,
  className = "",
}: {
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={`max-w-3xl ${className}`}>
      <Etiquette>{label}</Etiquette>
      <h2 className="mt-5 font-display text-4xl leading-[0.95] font-black tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      <span aria-hidden className="couture couture-trace mt-5 block w-40 text-rouge" />
      {intro ? <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{intro}</p> : null}
    </Reveal>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

/** En-tête de page intérieure. */
export function PageHero({
  label,
  title,
  intro,
  tone = "indigo",
}: {
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: "indigo" | "ink" | "orange";
}) {
  const bg = { indigo: "bg-indigo text-white", ink: "bg-ink text-ecru", orange: "bg-orange text-ink" }[tone];
  return (
    <section className={`relative overflow-hidden border-b-2 border-ink ${bg}`}>
      <Container className="relative py-16 sm:py-24">
        <Etiquette tone={tone === "orange" ? "ink" : "orange"}>{label}</Etiquette>
        <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[0.9] font-black tracking-tighter text-balance sm:text-7xl">
          {title}
        </h1>
        {intro ? <p className="mt-6 max-w-2xl text-lg leading-relaxed opacity-90">{intro}</p> : null}
      </Container>
      <div aria-hidden className="couture absolute inset-x-0 bottom-3 opacity-40" />
    </section>
  );
}
