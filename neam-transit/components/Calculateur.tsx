"use client";

import { useState } from "react";
import { poidsVolumetrique, volumeCartons } from "@/lib/calcul";

type Carton = { l: string; w: string; h: string; n: string };
const vide: Carton = { l: "", w: "", h: "", n: "1" };
const n = (s: string) => {
  const x = Number(s.replace(",", "."));
  return Number.isFinite(x) && x > 0 ? x : 0;
};
const f = (x: number, d = 2) => x.toLocaleString("fr-FR", { maximumFractionDigits: d });

export function Calculateur() {
  const [cartons, setCartons] = useState<Carton[]>([{ ...vide }]);
  const [poids, setPoids] = useState("");
  const volume = volumeCartons(cartons.map((c) => ({ l: n(c.l), w: n(c.w), h: n(c.h), n: Math.floor(n(c.n)) })));
  const pv = poidsVolumetrique(volume, 6000);
  const p = n(poids);
  const maj = (i: number, k: keyof Carton, v: string) => setCartons((cs) => cs.map((c, j) => (j === i ? { ...c, [k]: v } : c)));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="carte p-5">
        <h2 className="font-semibold text-marine-900">Vos cartons (dimensions en cm)</h2>
        <div className="mt-3 space-y-3">
          {cartons.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_70px_auto] items-end gap-2">
              {(["l", "w", "h"] as const).map((k, j) => (
                <div key={k}>
                  <label className="etiquette text-xs" htmlFor={`${k}${i}`}>{["Longueur", "Largeur", "Hauteur"][j]}</label>
                  <input id={`${k}${i}`} className="champ" inputMode="decimal" value={c[k]} onChange={(e) => maj(i, k, e.target.value)} placeholder="cm" />
                </div>
              ))}
              <div>
                <label className="etiquette text-xs" htmlFor={`n${i}`}>Nombre</label>
                <input id={`n${i}`} className="champ" inputMode="numeric" value={c.n} onChange={(e) => maj(i, "n", e.target.value)} />
              </div>
              <button type="button" className="btn-contour px-3" onClick={() => setCartons((cs) => (cs.length > 1 ? cs.filter((_, j) => j !== i) : [{ ...vide }]))} aria-label="Retirer ce carton">✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-contour mt-3" onClick={() => setCartons((cs) => [...cs, { ...vide }])}>+ Ajouter un type de carton</button>
        <div className="mt-5 max-w-xs">
          <label className="etiquette" htmlFor="poids">Poids total réel (kg)</label>
          <input id="poids" className="champ" inputMode="decimal" value={poids} onChange={(e) => setPoids(e.target.value)} />
        </div>
      </div>

      <div className="carte h-fit space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Volume total</p>
          <p className="text-2xl font-extrabold text-marine-900">{f(volume, 3)} m³</p>
          <p className="aide">Utilisé pour le bateau (groupage au m³ / CBM).</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Poids volumétrique avion</p>
          <p className="text-2xl font-extrabold text-marine-900">{f(pv, 1)} kg</p>
          <p className="aide">Volume × 1 000 000 ÷ 6 000 (diviseur le plus courant ; certains transitaires en utilisent un autre).</p>
        </div>
        {(p > 0 || volume > 0) && (
          <div className="rounded-xl bg-marine-50 p-3 text-sm text-slate-700">
            En avion, vous serez facturé sur <strong>{f(Math.max(p, pv), 1)} kg</strong> ({pv > p ? "poids volumétrique" : "poids réel"}, le plus élevé des deux).
            En bateau, sur <strong>{f(Math.max(volume, p / 1000), 3)} m³</strong> (règle 1 tonne = 1 m³).
          </div>
        )}
        <a className="btn-primaire w-full" href={`/comparer?type=groupage&poids=${p || ""}&volume=${volume ? volume.toFixed(3) : ""}`}>Comparer avec ces valeurs</a>
      </div>
    </div>
  );
}
