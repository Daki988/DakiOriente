import { MARCHANDISES, MARCHANDISE_CODES, PAYS, PAYS_CODES, type MarchandiseCode } from "@/lib/referentiel";
import type { Entrepot } from "@/lib/queries";

export function ChampsEntrepots({ valeurs = [] }: { valeurs?: Entrepot[] }) {
  return (
    <fieldset>
      <legend className="etiquette">Entrepôts ou partenaires au départ (au moins un)</legend>
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[140px_140px_1fr]">
            <select name={`e_pays_${i}`} className="champ" defaultValue={valeurs[i]?.pays ?? (i === 0 ? "CN" : "")} aria-label={`Pays de l'entrepôt ${i + 1}`}>
              <option value="">—</option>
              {PAYS_CODES.map((c) => <option key={c} value={c}>{PAYS[c].nom}</option>)}
            </select>
            <input name={`e_ville_${i}`} className="champ" placeholder="Ville" defaultValue={valeurs[i]?.ville ?? ""} maxLength={60} aria-label={`Ville de l'entrepôt ${i + 1}`} />
            <input name={`e_adresse_${i}`} className="champ" placeholder="Adresse complète de l'entrepôt" defaultValue={valeurs[i]?.adresse ?? ""} maxLength={300} aria-label={`Adresse de l'entrepôt ${i + 1}`} />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function CasesMarchandises({ name, legende, valeurs = [] }: { name: string; legende: string; valeurs?: MarchandiseCode[] }) {
  return (
    <fieldset>
      <legend className="etiquette">{legende}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {MARCHANDISE_CODES.map((m) => (
          <label key={m} className="flex min-h-10 items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name={name} value={m} defaultChecked={valeurs.includes(m)} className="h-5 w-5 accent-marine-900" />
            {MARCHANDISES[m].label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
