"use client";
// Blocs d'explication Navilease, partagés par l'accueil et les pages « Comment ça marche » et « Bailleurs ».
import { CalendarCheck, KeyRound, Search, ShieldCheck, Signature, type LucideIcon } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

const ETAPES: [LucideIcon, string, string][] = [
  [Search, "Je cherche", "Par établissement, budget, type de logement."],
  [CalendarCheck, "Je réserve", "Demande + pièces ; validation parent si mineur."],
  [ShieldCheck, "Je paie en séquestre", "Mobile money, carte ou espèces : fonds protégés jusqu'à l'entrée."],
  [Signature, "Je signe", "Contrat numérique et état des lieux photo."],
  [KeyRound, "J'emménage", "Quittances mensuelles, médiation en cas de litige."],
];

export function EtapesReservation() {
  return (
    <Reveal>
      <div className="flex flex-col gap-8 rounded-[28px] bg-nl-vert p-6 text-white sm:p-11">
        <div><span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-[#f4c26b]">Comment ça marche</span><h2 className="h-section mt-2 text-white">Réserver <em className="text-[#f4c26b]">sans arnaque</em>, en 5 étapes</h2></div>
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {ETAPES.map(([Icon, t, s], k) => (
            <StaggerItem key={t} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5"><span className="font-serif text-[40px] font-semibold leading-none text-[#f4c26b]">0{k + 1}</span><span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><Icon size={20} /></span></div>
              <b>{t}</b><span className="text-[13px] leading-relaxed text-[#c9d8cf]">{s}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Reveal>
  );
}
