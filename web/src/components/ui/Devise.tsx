"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MARGE_PRUDENCE, TAUX_SECOURS, convertir, devisePays, formatMontant, paysNavigateur, type Taux } from "@/lib/devises";
import { PAYS_OPTIONS, nomPays } from "@/lib/pays-origine";

const CLE = "navigoal.pays";
type Ctx = { pays: string | null; devise: string | null; taux: Taux; setPays: (p: string | null) => void };
const DeviseCtx = createContext<Ctx>({ pays: null, devise: null, taux: TAUX_SECOURS, setPays: () => {} });

const lire = () => { try { return localStorage.getItem(CLE); } catch { return null; } };
const ecrire = (p: string | null) => { try { if (p) localStorage.setItem(CLE, p); else localStorage.removeItem(CLE); } catch { /* stockage indisponible */ } };

/** Pays de provenance (profil, choix enregistré ou langue du navigateur) et taux du jour, pour toute l'application. */
export function DeviseProvider({ children }: { children: ReactNode }) {
  const [pays, setP] = useState<string | null>(null);
  const [taux, setTaux] = useState<Taux>(TAUX_SECOURS);
  useEffect(() => {
    setP(lire() ?? paysNavigateur());
    fetch("/api/taux/").then((r) => (r.ok ? r.json() : null)).then((t) => t?.taux && setTaux(t)).catch(() => {});
  }, []);
  const setPays = (p: string | null) => { ecrire(p); setP(p); };
  return <DeviseCtx.Provider value={{ pays, devise: devisePays(pays), taux, setPays }}>{children}</DeviseCtx.Provider>;
}
export const useDevise = () => useContext(DeviseCtx);

/** Aligne la devise sur le pays du profil connecté. */
export function DeviseProfil({ country }: { country: string | null | undefined }) {
  const { pays, setPays } = useDevise();
  useEffect(() => { if (country && country !== "MA" && country !== pays) setPays(country); }, [country, pays, setPays]);
  return null;
}

/** Montant en dirhams, suivi de son équivalent dans la devise du pays de provenance (marge de prudence incluse). */
export function Prix({ mad, suffixe = "", bloc = false, className = "" }: { mad: number; suffixe?: string; bloc?: boolean; className?: string }) {
  const { devise, taux } = useDevise();
  const c = devise ? convertir(mad, devise, taux) : null;
  return (
    <span className={className}>
      {formatMontant(mad, "MAD")}{suffixe}
      {c != null && <span className={`${bloc ? "block" : "ml-1"} text-[0.85em] font-semibold text-ink-mute`} title={`Taux du ${new Date(taux.date).toLocaleDateString("fr-FR")}, majoré de ${MARGE_PRUDENCE * 100} % par prudence`}>≈ {formatMontant(c, devise!)}{suffixe}</span>}
    </span>
  );
}

/** Montants en texte : « 1 500 MAD (≈ 94 000 F CFA) » selon le pays de provenance ; `eq` donne l'équivalent seul. */
export function useMontant() {
  const { devise, taux } = useDevise();
  const eq = (n: number | null | undefined, cur: string | null = "MAD") => {
    if (n == null || (cur ?? "MAD") !== "MAD" || !devise) return null;
    const c = convertir(n, devise, taux);
    return c == null ? null : formatMontant(c, devise);
  };
  const m = (n: number | null | undefined, cur: string | null = "MAD") => {
    if (n == null) return "—";
    const e = eq(n, cur);
    return `${formatMontant(n, cur ?? "MAD")}${e ? ` (≈ ${e})` : ""}`;
  };
  return { m, eq };
}

/** Choix du pays de provenance (affichage des montants convertis). */
export function DeviseSelect({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const { pays, devise, setPays } = useDevise();
  return (
    <label className={`flex flex-wrap items-center gap-2 text-[13px] ${dark ? "text-white/80" : "text-ink-soft"} ${className}`}>
      <span>Montants convertis pour :</span>
      <select value={pays ?? ""} onChange={(e) => setPays(e.target.value || null)} className={`max-w-[200px] rounded-lg border px-2 py-1 text-[13px] font-semibold ${dark ? "border-white/20 bg-white/10 text-white [&_option]:text-ink" : "border-slate-200 bg-white text-ink"}`} aria-label="Pays de provenance">
        <option value="">Dirhams uniquement</option>
        {PAYS_OPTIONS.filter((p) => p.value !== "MA").map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      {pays && devise && devise !== "MAD" && <span className="text-xs">({nomPays(pays)} · {devise}, marge de {MARGE_PRUDENCE * 100} %)</span>}
    </label>
  );
}
