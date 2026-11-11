"use client";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { useFiltres } from "@/hooks/useFiltres";
import { useDevise } from "@/components/ui/Devise";
import { MARGE_PRUDENCE, formatMontant, symbole } from "@/lib/devises";
import { ResidenceCarte } from "@/components/navilease/Residences";
import { reservee, residencesEtudiantes, VILLES_RESIDENCES, type Residence } from "@/lib/residences";

const DEFAUTS = { ville: "", budget: "", monnaie: "", type: "", universite: "" };
const TYPES: [string, string, (r: Residence) => boolean][] = [
  ["partage", "Chambre partagée", (r) => r.logements.some((l) => /double|triple|partag|chambres doubles/i.test(l.type) || l.partage)],
  ["seul", "Chambre ou studio individuel", (r) => r.logements.some((l) => /individuel|studio|single|suite|standard|deluxe|vip/i.test(l.type))],
  ["pmr", "Accès PMR", (r) => r.logements.some((l) => /pmr/i.test(l.type)) || /PMR/.test(r.inclus.join(" "))],
];

/** Liste des résidences universitaires (maquettes « residences », écran 2). */
export function ResidencesListe() {
  const { f, set, reset, sync } = useFiltres(DEFAUTS);
  // Budget saisi librement, dans la monnaie du parent ou en dirhams ; converti en dirhams (avec la marge de prudence) pour filtrer.
  const { devise, taux } = useDevise();
  const locale = devise && devise !== "MAD" && taux.taux[devise] ? devise : null;
  const monnaie = f.monnaie === "MAD" || !locale ? "MAD" : locale;
  const saisi = Number(f.budget.replace(/\s/g, "").replace(",", "."));
  const budgetMad = !f.budget || !Number.isFinite(saisi) || saisi <= 0 ? null : monnaie === "MAD" ? saisi : Math.floor(saisi / taux.taux[monnaie] / (1 + MARGE_PRUDENCE));
  const passe = (r: Residence) => (!f.ville || r.ville === f.ville) && (budgetMad == null || (r.a_partir_de ?? 1e9) <= budgetMad)
    && (!f.type || TYPES.find(([k]) => k === f.type)![2](r)) && (f.universite === "1" || !reservee(r));
  const list = residencesEtudiantes.filter(passe);
  const actif = (v: string) => (v ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-ink-soft");
  return (
    <div className="container grid items-start gap-7 lg:grid-cols-[280px_1fr]">
      {sync}
      <aside className="card flex flex-col gap-5 p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between"><b>Filtrer</b><button onClick={reset} className="flex min-h-[36px] items-center gap-1 text-[13px] font-bold text-brand-600"><RotateCcw size={13} />Réinitialiser</button></div>
        <div className="flex flex-col gap-1.5 text-sm font-bold"><label htmlFor="budget-residence">Budget mensuel maximum</label>
          <div className="flex gap-2">
            <input id="budget-residence" inputMode="numeric" value={f.budget} onChange={(e) => set({ budget: e.target.value.replace(/[^\d\s.,]/g, "").slice(0, 10) })} placeholder={monnaie === "MAD" ? "ex. 2 500" : "ex. 150 000"} className="min-h-[42px] min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
            {locale ? (
              <select aria-label="Monnaie du budget" value={monnaie} onChange={(e) => set({ monnaie: e.target.value === "MAD" ? "MAD" : "" })} className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-2 font-semibold"><option value={locale}>{symbole(locale)}</option><option value="MAD">DH</option></select>
            ) : <span className="flex min-h-[42px] items-center rounded-xl bg-[#f6f8fe] px-3 font-semibold text-ink-soft">DH</span>}
          </div>
          <span className="text-xs font-normal leading-snug text-ink-mute">{budgetMad != null && monnaie !== "MAD" ? <>≈ <b className="text-ink">{formatMontant(budgetMad, "MAD")}</b> par mois (taux du jour, marge de prudence comprise). Les loyers sont payés en dirhams.</> : locale ? "Saisis ton budget dans ta monnaie : la conversion en dirhams est automatique." : "Montant libre, en dirhams par mois."}</span>
        </div>
        <div className="flex flex-col gap-1.5"><span className="text-sm font-bold">Type de logement</span>
          {TYPES.map(([k, l]) => <label key={k} className="flex min-h-[36px] items-center gap-2 text-sm"><input type="radio" name="type" checked={f.type === k} onChange={() => set({ type: f.type === k ? "" : k })} onClick={() => f.type === k && set({ type: "" })} />{l}</label>)}
        </div>
        <label className="flex min-h-[36px] items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={f.universite === "1"} onChange={(e) => set({ universite: e.target.checked ? "1" : "" })} />Inclure les résidences réservées aux étudiants d&apos;une université (UM6SS)</label>
        <p className="flex gap-2 rounded-2xl bg-[#f6f8fe] p-3 text-xs leading-relaxed text-ink-mute"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#0f8a46]" />Informations vérifiées sur les sites officiels, à reconfirmer avec la résidence à chaque rentrée.</p>
      </aside>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {["", ...VILLES_RESIDENCES].map((v) => <button key={v || "toutes"} onClick={() => set({ ville: v })} className={`chip min-h-[40px] shrink-0 px-3.5 text-[13px] ${actif(f.ville === v ? "x" : "")}`}>{v || "Toutes les villes"}</button>)}
        </div>
        <p className="text-sm text-ink-soft"><b className="text-ink">{list.length} résidence{list.length > 1 ? "s" : ""}</b> · triées par prix croissant</p>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{list.map((r) => <ResidenceCarte key={r.id} r={r} />)}</div>
        {!list.length && <div className="card p-10 text-center text-ink-mute">Aucune résidence ne correspond. <button onClick={reset} className="font-bold text-brand-600">Réinitialiser les filtres</button></div>}
      </div>
    </div>
  );
}
