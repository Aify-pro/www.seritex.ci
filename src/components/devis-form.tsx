"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Lightbulb, Loader2 } from "lucide-react";
import { produits, suggestTechnique, techniquesChoix, type DemandeErrors } from "@/lib/demande";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; reference: string | null }
  | { kind: "error"; message: string };

const inputCls =
  "mt-2 block min-h-12 w-full border-2 border-ink bg-paper px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:border-indigo focus:outline-none aria-[invalid=true]:border-rouge";

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="font-display font-semibold">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm font-medium text-rouge" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function DevisForm({ defaultProduit = "" }: { defaultProduit?: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<DemandeErrors>({});
  const [produit, setProduit] = useState(defaultProduit);
  const [quantite, setQuantite] = useState("");

  const suggestion = suggestTechnique(produit, Number.parseInt(quantite, 10));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setStatus({ kind: "sending" });
    setErrors({});
    try {
      const res = await fetch("/api/demande", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus({ kind: "sent", reference: json.reference ?? null });
        form.reset();
        return;
      }
      if (json.errors) {
        setErrors(json.errors);
        setStatus({ kind: "error", message: "Merci de corriger les champs signalés." });
        const first = Object.keys(json.errors)[0];
        form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        return;
      }
      setStatus({ kind: "error", message: json.message ?? "Une erreur est survenue." });
    } catch {
      setStatus({ kind: "error", message: "Connexion impossible. Vérifiez votre réseau et réessayez." });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="border-2 border-ink bg-paper p-8 shadow-hard" role="status">
        <CheckCircle2 aria-hidden className="text-indigo" size={48} />
        <h2 className="mt-4 font-display text-3xl font-black">Demande bien reçue.</h2>
        {status.reference ? (
          <p className="mt-2 font-mono text-sm tracking-widest text-rouge uppercase">Référence {status.reference}</p>
        ) : null}
        <p className="mt-3 text-lg text-muted">
          Un conseiller Seritex vous recontacte pour établir votre devis. Gardez votre logo sous la main : il vous le
          demandera pour préparer le BAT.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-6 min-h-11 font-display font-bold text-indigo underline decoration-2 underline-offset-4"
        >
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  const aria = (k: keyof DemandeErrors, hint = false) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${k}-error` : hint ? `${k}-hint` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="relative border-2 border-ink bg-paper p-6 shadow-hard sm:p-10">
      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-6 font-mono text-xs tracking-widest text-rouge uppercase">01 · Vous</legend>
        <Field id="nom" label="Nom et prénom *" error={errors.nom}>
          <input id="nom" name="nom" autoComplete="name" required className={inputCls} {...aria("nom")} />
        </Field>
        <Field id="entreprise" label="Entreprise / organisation" error={errors.entreprise}>
          <input id="entreprise" name="entreprise" autoComplete="organization" className={inputCls} />
        </Field>
        <Field id="email" label="E-mail *" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required className={inputCls} {...aria("email")} />
        </Field>
        <Field id="telephone" label="Téléphone / WhatsApp *" error={errors.telephone}>
          <input id="telephone" name="telephone" type="tel" autoComplete="tel" inputMode="tel" required placeholder="+225 07 00 00 00 00" className={inputCls} {...aria("telephone")} />
        </Field>
      </fieldset>

      <fieldset className="mt-10 grid gap-6 border-t-2 border-dashed border-ink pt-8 sm:grid-cols-2">
        <legend className="sr-only">Votre projet</legend>
        <p aria-hidden className="font-mono text-xs tracking-widest text-rouge uppercase sm:col-span-2">
          02 · Votre projet
        </p>
        <Field id="produit" label="Produit *" error={errors.produit}>
          <select id="produit" name="produit" required value={produit} onChange={(e) => setProduit(e.target.value)} className={inputCls} {...aria("produit")}>
            <option value="" disabled>
              Choisir…
            </option>
            {produits.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="quantite" label="Quantité totale *" error={errors.quantite} hint="Toutes tailles confondues.">
          <input id="quantite" name="quantite" type="number" min={1} inputMode="numeric" required value={quantite} onChange={(e) => setQuantite(e.target.value)} className={inputCls} {...aria("quantite", true)} />
        </Field>
        <Field id="technique" label="Technique de marquage" error={errors.technique}>
          <select id="technique" name="technique" defaultValue="conseil" className={inputCls}>
            {techniquesChoix.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="delai" label="Date souhaitée" error={errors.delai} hint="Une urgence peut entraîner une majoration.">
          <input id="delai" name="delai" type="date" className={inputCls} {...aria("delai", true)} />
        </Field>

        <div aria-live="polite" className="sm:col-span-2">
          {suggestion ? (
            <p className="etiquette flex items-start gap-3 bg-indigo py-3 pr-4 pl-6 text-white">
              <Lightbulb aria-hidden className="mt-0.5 shrink-0 text-orange" size={20} />
              <span>
                <strong className="font-display">Notre conseil indicatif : {suggestion.technique}.</strong>{" "}
                {suggestion.raison} Votre conseiller confirmera selon votre visuel.
              </span>
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <Field id="message" label="Votre projet en quelques mots" error={errors.message} hint="Couleurs, emplacement du logo (cœur, dos, épaule), tailles…">
            <textarea id="message" name="message" rows={5} className={inputCls} {...aria("message", true)} />
          </Field>
        </div>
      </fieldset>

      {/* Champ piège anti-robots */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="site_web">Ne pas remplir</label>
        <input id="site_web" name="site_web" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">* Champs obligatoires. Vos données servent uniquement à traiter votre demande.</p>
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="btn-presse inline-flex min-h-12 items-center justify-center gap-2 border-2 border-ink bg-orange px-8 font-display text-lg font-bold disabled:cursor-wait disabled:opacity-70"
        >
          {status.kind === "sending" ? (
            <>
              <Loader2 aria-hidden className="animate-spin" size={20} /> Envoi…
            </>
          ) : (
            <>
              Envoyer ma demande <ArrowRight aria-hidden size={20} />
            </>
          )}
        </button>
      </div>
      {status.kind === "error" ? (
        <p role="alert" className="mt-4 border-2 border-rouge bg-rouge/10 p-4 font-medium text-rouge">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
