"use client";

import Image from "next/image";
import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { clients } from "@/content/catalogue";

/** Bandeau de logos clients façon ruban tissé. Pause au survol, au focus, ou via le bouton. */
export function ClientsMarquee() {
  const [paused, setPaused] = useState(false);
  const loop = [...clients, ...clients];

  return (
    <div className="defile-zone relative border-y-2 border-ink bg-paper" data-paused={paused}>
      <p className="sr-only">Ils nous font confiance : {clients.map((c) => c.name).join(", ")}.</p>
      <div aria-hidden className="overflow-hidden py-6">
        <ul className="defile flex w-max items-center gap-16 pr-16">
          {loop.map((c, i) => (
            <li key={`${c.name}-${i}`} className="flex h-16 w-32 shrink-0 items-center justify-center">
              <Image
                src={c.logo}
                alt=""
                width={128}
                height={64}
                className="max-h-16 w-auto object-contain grayscale transition duration-300 hover:grayscale-0"
              />
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="absolute top-1/2 right-3 inline-flex size-11 -translate-y-1/2 items-center justify-center border-2 border-ink bg-ecru motion-reduce:hidden"
        aria-label={paused ? "Relancer le défilement des logos" : "Mettre en pause le défilement des logos"}
      >
        {paused ? <Play aria-hidden size={18} /> : <Pause aria-hidden size={18} />}
      </button>
    </div>
  );
}
