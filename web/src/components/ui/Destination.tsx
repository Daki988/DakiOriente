"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import Link from "@/components/ui/Link";
import { Drapeau } from "@/components/ui/Drapeau";
import { DESTINATIONS_ACTIVES, DESTINATIONS_BIENTOT, DESTINATION_DEFAUT, destinationById } from "@/lib/destinations";
import type { PaysCode } from "@/lib/data";

// Pays de destination choisi par le visiteur (maquettes « destinations ») : mémorisé dans le navigateur ;
// formations, écoles, comparateur, devis et Navi s'adaptent. « tous » = tous pays confondus.
const CLE = "navigoal.destination";
export type ChoixDestination = PaysCode | "tous";
type Ctx = { destination: ChoixDestination; choisie: boolean; setDestination: (d: ChoixDestination) => void };
const DestinationCtx = createContext<Ctx>({ destination: DESTINATION_DEFAUT, choisie: false, setDestination: () => {} });

const valide = (v: string | null): v is ChoixDestination => v === "tous" || !!(v && destinationById[v as PaysCode]?.actif);

export function DestinationProvider({ children }: { children: ReactNode }) {
  const [destination, setD] = useState<ChoixDestination>(DESTINATION_DEFAUT);
  const [choisie, setChoisie] = useState(false);
  useEffect(() => {
    try { const v = localStorage.getItem(CLE); if (valide(v)) { setD(v); setChoisie(true); } } catch { /* stockage indisponible */ }
  }, []);
  const setDestination = (d: ChoixDestination) => {
    setD(d); setChoisie(true);
    try { localStorage.setItem(CLE, d); } catch { /* stockage indisponible */ }
    try { document.cookie = `ng_dest=${d}; path=/; max-age=31536000; samesite=lax`; } catch { /* ignore */ }
  };
  return <DestinationCtx.Provider value={{ destination, choisie, setDestination }}>{children}</DestinationCtx.Provider>;
}
export const useDestination = () => useContext(DestinationCtx);

/** Pays à afficher pour une liste : `?pays=` dans l'adresse, sinon la destination choisie. */
export const paysFiltre = (d: ChoixDestination): PaysCode | "" => (d === "tous" ? "" : d);

/** Sélecteur « Destination : Sénégal » de l'en-tête. */
export function SelecteurDestination({ compact = false }: { compact?: boolean }) {
  const { destination, setDestination } = useDestination();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, [open]);
  if (DESTINATIONS_ACTIVES.length < 2) return null;
  const d = destination === "tous" ? null : destinationById[destination];
  const choisir = (v: ChoixDestination) => { setDestination(v); setOpen(false); };
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="listbox"
        className="flex h-[42px] items-center gap-2 whitespace-nowrap rounded-xl bg-brand-50 px-3 text-[13px] font-bold text-brand-700 transition hover:bg-brand-100">
        {d ? <Drapeau code={d.code} taille={13} /> : <Globe size={15} />}
        <span className={compact ? "sr-only" : "hidden 2xl:inline"}>Destination :</span><span className={compact ? "" : "hidden sm:inline"}>{d ? d.nom : "Tous les pays"}</span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute right-0 top-[48px] z-[60] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-lift">
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-extrabold uppercase tracking-wide text-ink-mute">Où veux-tu étudier ?</p>
          {DESTINATIONS_ACTIVES.map((x) => (
            <button key={x.code} role="option" aria-selected={destination === x.code} onClick={() => choisir(x.code)} className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold hover:bg-brand-50 ${destination === x.code ? "text-brand-700" : "text-ink-soft"}`}>
              <Drapeau code={x.code} taille={14} /><span className="flex-1">{x.nom}<span className="block text-[11px] font-medium text-ink-mute">{x.etablissements} établissements</span></span>{destination === x.code && <Check size={15} />}
            </button>
          ))}
          <button role="option" aria-selected={destination === "tous"} onClick={() => choisir("tous")} className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold hover:bg-brand-50 ${destination === "tous" ? "text-brand-700" : "text-ink-soft"}`}>
            <Globe size={16} className="mx-[3px]" /><span className="flex-1">Tous les pays</span>{destination === "tous" && <Check size={15} />}
          </button>
          {DESTINATIONS_BIENTOT.length > 0 && <div className="mt-1 border-t border-slate-100 px-2.5 pt-2 text-[11.5px] text-ink-mute"><b>Bientôt :</b> {DESTINATIONS_BIENTOT.map((x) => x.nom).join(", ")}</div>}
          <Link href="/pays/" onClick={() => setOpen(false)} className="mt-1 block rounded-xl px-2.5 py-2 text-[12.5px] font-bold text-brand-600 hover:bg-brand-50">Comparer les pays →</Link>
        </div>
      )}
    </div>
  );
}
