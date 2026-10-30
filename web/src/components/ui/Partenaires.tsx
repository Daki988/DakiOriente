"use client";
import Link from "@/components/ui/Link";
import { Star } from "lucide-react";
import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";
import { EtabLogo } from "./EtabLogo";
import { etabById } from "@/lib/data";

// Écoles mises en avant (abonnement en cours) : lues à l'exécution, signalées « Partenaire Navigoal » partout où elles
// sont promues, avec un comptage anonyme des affichages et des clics pour leur page « Mon offre ».
type P = { id: string; une: boolean };
let memo: P[] | null = null;
let attente: Promise<P[]> | null = null;
function charger() {
  if (memo) return Promise.resolve(memo);
  attente ??= fetch("/api/partenaires/").then((r) => (r.ok ? r.json() : [])).catch(() => []).then((d: P[]) => (memo = Array.isArray(d) ? d : []));
  return attente;
}

export function usePartenaires() {
  const [p, setP] = useState<P[]>(memo ?? []);
  useEffect(() => { let vivant = true; charger().then((d) => vivant && setP(d)); return () => { vivant = false; }; }, []);
  return p;
}

// Affichages regroupés et envoyés une fois par seconde au plus ; un affichage par école et par page.
const vus = new Set<string>();
let lot: string[] = [];
let minuteur: ReturnType<typeof setTimeout> | null = null;
function compter(aff?: string, clic?: string) {
  if (aff) { const k = `${location.pathname}:${aff}`; if (vus.has(k)) return; vus.add(k); lot.push(aff); }
  const envoyer = (corps: object) => {
    const b = JSON.stringify(corps);
    if (clic && navigator.sendBeacon) navigator.sendBeacon("/api/vitrine/", new Blob([b], { type: "application/json" }));
    else fetch("/api/vitrine/", { method: "POST", headers: { "Content-Type": "application/json" }, body: b, keepalive: true }).catch(() => {});
  };
  if (clic) { envoyer({ aff: [], clic }); return; }
  minuteur ??= setTimeout(() => { const a = lot; lot = []; minuteur = null; if (a.length) envoyer({ aff: a }); }, 1000);
}

/** Badge « Partenaire Navigoal » et cadre doré, à placer dans une carte (lien) : compte l'affichage et le clic. */
export function PartenaireMarque({ id, cadre = true, badge = true, coin = "gauche" }: { id: string; cadre?: boolean; badge?: boolean; coin?: "gauche" | "droite" }) {
  const p = usePartenaires();
  const ref = useRef<HTMLSpanElement>(null);
  const actif = p.some((x) => x.id === id);
  useEffect(() => {
    if (!actif) return;
    compter(id);
    // Carte-lien, ou carte contenant des liens : un clic sur un lien de la carte compte comme une visite.
    const zone = ref.current?.closest("a") ?? ref.current?.parentElement;
    const clic = (ev: Event) => { if ((ev.target as Element | null)?.closest("a")) compter(undefined, id); };
    zone?.addEventListener("click", clic);
    return () => zone?.removeEventListener("click", clic);
  }, [actif, id]);
  if (!actif) return null;
  return (
    <span ref={ref}>
      {cadre && <span aria-hidden className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] ring-2 ring-sun-400" />}
      {badge && <span className={`absolute ${coin === "droite" ? "right-3" : "left-3"} top-3 z-10 inline-flex items-center gap-1 rounded-full bg-sun-100 px-2 py-0.5 text-[11px] font-bold text-[#a55a00] shadow-sm`}><Star size={11} className="fill-current" />Partenaire Navigoal</span>}
    </span>
  );
}

/** Réordonne des éléments (clé = identifiant d'établissement) : écoles partenaires d'abord, ordre conservé sinon. */
export function OrdrePartenaires({ children, max, limite }: { children: ReactNode; max?: number; limite?: number }) {
  const p = usePartenaires();
  const ids = new Set(p.map((x) => x.id));
  const items = Children.toArray(children).filter(isValidElement);
  const cle = (c: (typeof items)[number]) => String(c.key ?? "").replace(/^\.\$/, "");
  const devant = items.filter((c) => ids.has(cle(c))).slice(0, max ?? Infinity);
  return <>{[...devant, ...items.filter((c) => !devant.includes(c))].slice(0, limite ?? Infinity)}</>;
}

/** Accueil : bandeau « Écoles partenaires » (la une en premier, en grand). Rien n'est affiché sans partenaire. */
export function EcolesPartenaires() {
  const p = usePartenaires().filter((x) => etabById[x.id]);
  if (!p.length) return null;
  return (
    <div className="container mb-5">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-[#a55a00]"><Star size={13} className="fill-current" />Écoles partenaires</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {p.map(({ id, une }) => {
          const e = etabById[id];
          return (
            <Link key={id} href={`/etablissements/${id}/`} title={e.nom} className={`relative flex shrink-0 items-center gap-3 rounded-2xl border-2 border-sun-300 bg-[#fffbea] transition hover:shadow-card ${une ? "py-3 pl-3 pr-6" : "py-2.5 pl-2.5 pr-4"}`}>
              <EtabLogo e={e} size={une ? 64 : 48} />
              <span><span className={`block font-extrabold ${une ? "text-base" : "text-sm"}`}>{e.sigle}</span><span className="block max-w-[220px] truncate text-[11px] text-ink-mute">{une ? e.nom : e.campus ? `${e.campus.length} campus` : e.ville}</span></span>
              <PartenaireMarque id={id} cadre={false} badge={false} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
