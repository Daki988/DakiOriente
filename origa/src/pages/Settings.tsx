import { useEffect, useState } from 'react';
import { save } from '../data/repo';
import { useSession, useSettings } from '../app/hooks';
import { useToast } from '../components/ui';
import { FORMULA_VARIABLES } from '../domain/defaults';
import { validateFormula } from '../domain/formula';
import type { FormulaKey, Settings } from '../domain/types';

const F_LABEL: Record<FormulaKey, string> = { mortalite: 'Taux de mortalité (%)', viabilite: 'Viabilité (%)', gmq: 'Gain moyen quotidien (g/j)', ic: 'Indice de consommation', epef: 'EPEF', occupation: "Taux d'occupation (%)" };

/** Paramétrage sans développement (§ 7.3) : formules, seuils, calendriers. */
export function SettingsPage() {
  const s = useSession();
  const current = useSettings();
  const [draft, setDraft] = useState<Settings>(current);
  const [toast, show] = useToast();
  useEffect(() => setDraft(current), [current]);
  const vet = s.role === 'veterinaire';
  const dge = s.role === 'dge' || s.role === 'admin';
  const errors = Object.fromEntries(Object.entries(draft.formulas).map(([k, v]) => [k, validateFormula(v, FORMULA_VARIABLES)]));
  const hasError = Object.values(errors).some(Boolean);
  const num = (k: keyof Settings, v: string) => setDraft((d) => ({ ...d, [k]: Number(v.replace(',', '.')) || 0 }));

  async function submit() {
    if (hasError) return;
    // Le seuil d'alerte sanitaire n'est modifiable que par les services vétérinaires.
    const next = vet ? { ...current, alertDailyMortalityPct: draft.alertDailyMortalityPct, vaccinationCalendar: draft.vaccinationCalendar, clinicalSigns: draft.clinicalSigns }
      : { ...draft, alertDailyMortalityPct: current.alertDailyMortalityPct };
    await save('settings', next, 'modification des paramètres');
    show('Paramètres enregistrés et journalisés');
  }

  return (
    <>
      <div className="top"><div><h1>Paramètres</h1><span className="muted">Valeurs « Proposé » du cahier des charges, à valider lors du cadrage.</span></div>
        <button className="sel dark" disabled={hasError} onClick={submit}>Enregistrer</button></div>
      <div className="grid2">
        <div className="panel">
          <h3>Formules des indicateurs {dge ? '' : '(lecture seule)'}</h3>
          <span className="muted">Variables : {FORMULA_VARIABLES.join(', ')}.</span>
          {(Object.keys(F_LABEL) as FormulaKey[]).map((k) => (
            <label key={k} className="f">{F_LABEL[k]}
              <input className="input lotid" style={{ fontSize: 13 }} disabled={!dge} value={draft.formulas[k]} onChange={(e) => setDraft((d) => ({ ...d, formulas: { ...d.formulas, [k]: e.target.value } }))} />
              {errors[k] && <span className="bad" style={{ fontSize: 12 }}>{errors[k]}</span>}
            </label>
          ))}
        </div>
        <div className="panel">
          <h3>Seuils et fréquences</h3>
          <label className="f">Seuil d'alerte : mortalité du jour (% de l'effectif) — services vétérinaires
            <input className="input" disabled={!vet} value={draft.alertDailyMortalityPct} onChange={(e) => num('alertDailyMortalityPct', e.target.value)} /></label>
          <label className="f">Écart toléré livré / déclaré sur les intrants (%)<input className="input" disabled={!dge} value={draft.inputGapPct} onChange={(e) => num('inputGapPct', e.target.value)} /></label>
          <label className="f">Écart toléré à la réception abattoir (%)<input className="input" disabled={!dge} value={draft.receptionGapPct} onChange={(e) => num('receptionGapPct', e.target.value)} /></label>
          <label className="f">Durée de référence d'une bande (jours)<input className="input" disabled={!dge} value={draft.bandReferenceDays} onChange={(e) => num('bandReferenceDays', e.target.value)} /></label>
          <div className="row">
            <label className="f" style={{ flex: 1 }}>Pesée tous les (jours)<input className="input" disabled={!dge} value={draft.weighingEveryDays} onChange={(e) => num('weighingEveryDays', e.target.value)} /></label>
            <label className="f" style={{ flex: 1 }}>Échantillon (sujets)<input className="input" disabled={!dge} value={draft.weighingSample} onChange={(e) => num('weighingSample', e.target.value)} /></label>
          </div>
          <h3>Calendrier vaccinal</h3>
          {draft.vaccinationCalendar.map((v, i) => <div key={i} className="kv"><span>Jour {v.day}</span><b>{v.vaccine}</b></div>)}
        </div>
      </div>
      {toast}
    </>
  );
}
