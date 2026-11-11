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
      <div className="flex flex-col gap-8 rounded-[28px] border border-[#f3e6bd] bg-[#fffaf0] p-6 sm:p-11">
        <div><span className="text-[13px] font-extrabold uppercase tracking-[.16em] text-[#a55a00]">Comment ça marche</span><h2 className="h-section mt-2">Réserver sans arnaque, en 5 étapes</h2></div>
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {ETAPES.map(([Icon, t, s], k) => (
            <StaggerItem key={t} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5"><span className={`flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#f3e6bd] ${k === 2 ? "bg-sun-400" : "bg-white"}`}><Icon size={22} /></span><span className="text-[28px] font-extrabold text-[#f3e6bd]">0{k + 1}</span></div>
              <b>{t}</b><span className="text-[13px] text-ink-mute">{s}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Reveal>
  );
}
