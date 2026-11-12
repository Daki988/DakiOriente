import { useEffect, useState } from 'react';
import { save } from '../data/repo';
import { useSession, useSettings } from '../app/hooks';
import { useToast } from '../components/ui';
import { DOMAINS, FORMULA_VARIABLES } from '../domain/defaults';
import { validateFormula } from '../domain/formula';
import type { FormulaKey, ListItem, RightAction, Settings } from '../domain/types';

const F_LABEL: Record<FormulaKey, string> = { mortalite: 'Taux de mortalité (%)', viabilite: 'Viabilité (%)', gmq: 'Gain moyen quotidien (g/j)', ic: 'Indice de consommation', epef: 'EPEF', occupation: "Taux d'occupation (%)" };
const VET_KEYS: (keyof Settings)[] = ['alertDailyMortalityPct', 'vaccinationCalendar', 'clinicalSigns', 'treatmentProducts', 'biosecurityGrid'];

/** Éditeur de liste de libellés. */
function Strings({ label, value, onChange, disabled }: { label: string; value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [add, setAdd] = useState('');
  return (
    <div className="f">{label}
      <div className="chips">{value.map((v) => <span key={v} className="chip">{v}{!disabled && <button aria-label={`Retirer ${v}`} onClick={() => onChange(value.filter((x) => x !== v))} style={{ marginLeft: 6 }}>✕</button>}</span>)}</div>
      {!disabled && <div className="row"><input className="input" placeholder="Ajouter…" value={add} onChange={(e) => setAdd(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && add.trim()) { onChange([...value, add.trim()]); setAdd(''); } }} />
        <button className="sel" onClick={() => { if (add.trim()) { onChange([...value, add.trim()]); setAdd(''); } }}>Ajouter</button></div>}
    </div>
  );
}
/** Éditeur de liste clé / libellé (statuts, motifs, types). Les clés existantes restent stables. */
function Items({ label, value, onChange, disabled }: { label: string; value: ListItem[]; onChange: (v: ListItem[]) => void; disabled?: boolean }) {
  return (
    <div className="f">{label}
      {value.map((it, i) => <div key={it.k} className="row"><input className="input" style={{ maxWidth: 150 }} value={it.k} disabled /><input className="input" disabled={disabled} value={it.label} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} /></div>)}
      {!disabled && <button className="sel" onClick={() => { const k = prompt('Code (sans espace, ex. don)'); const l = k && prompt('Libellé'); if (k && l) onChange([...value, { k: k.trim(), label: l.trim() }]); }}>Ajouter</button>}
    </div>
  );
}

/** Paramétrage sans développement (§ 7.3) : formules, seuils, listes, statuts, calendriers, grilles, pondérations. */
export function SettingsPage() {
  const s = useSession();
  const current = useSettings();
  const [d, setD] = useState<Settings>(current);
  const [toast, show] = useToast();
  useEffect(() => setD(current), [current]);
  const vet = s.role === 'veterinaire';
  const dge = s.role === 'dge' || s.role === 'admin';
  const errors = Object.fromEntries(Object.entries(d.formulas).map(([k, v]) => [k, validateFormula(v, FORMULA_VARIABLES)]));
  const hasError = Object.values(errors).some(Boolean);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setD((x) => ({ ...x, [k]: v }));
  const num = (k: keyof Settings, v: string) => set(k, (Number(v.replace(',', '.')) || 0) as never);

  async function submit() {
    if (hasError) return;
    // Le volet sanitaire est réservé aux services vétérinaires ; le reste à la DGE.
    const next = vet ? { ...current, ...Object.fromEntries(VET_KEYS.map((k) => [k, d[k]])) } as Settings
      : s.role === 'admin' ? d : { ...d, ...Object.fromEntries(VET_KEYS.map((k) => [k, current[k]])) } as Settings;
    await save('settings', next, 'modification des paramètres');
    show('Paramètres enregistrés et journalisés');
  }

  return (
    <>
      <div className="top"><div><h1>Paramètres</h1><span className="muted">Les règles métier ne sont jamais codées en dur. {vet ? 'Vous modifiez le volet sanitaire.' : dge ? 'Le volet sanitaire est réservé aux services vétérinaires.' : 'Lecture seule.'}</span></div>
        <button className="sel dark" disabled={hasError || (!vet && !dge)} onClick={submit}>Enregistrer</button></div>
      <div className="grid2">
        <div className="panel">
          <h3>Formules des indicateurs</h3>
          <span className="muted">Variables : {FORMULA_VARIABLES.join(', ')}.</span>
          {(Object.keys(F_LABEL) as FormulaKey[]).map((k) => (
            <label key={k} className="f">{F_LABEL[k]}
              <input className="input lotid" style={{ fontSize: 13 }} disabled={!dge} value={d.formulas[k]} onChange={(e) => set('formulas', { ...d.formulas, [k]: e.target.value })} />
              {errors[k] && <span className="bad" style={{ fontSize: 12 }}>{errors[k]}</span>}
            </label>
          ))}
          <h3>Seuils et fréquences</h3>
          <label className="f">Seuil d'alerte : mortalité du jour (% de l'effectif) · services vétérinaires<input className="input" disabled={!vet && s.role !== 'admin'} value={d.alertDailyMortalityPct} onChange={(e) => num('alertDailyMortalityPct', e.target.value)} /></label>
          <div className="row"><label className="f" style={{ flex: 1 }}>Écart intrants toléré (%)<input className="input" disabled={!dge} value={d.inputGapPct} onChange={(e) => num('inputGapPct', e.target.value)} /></label>
            <label className="f" style={{ flex: 1 }}>Écart réception abattoir (%)<input className="input" disabled={!dge} value={d.receptionGapPct} onChange={(e) => num('receptionGapPct', e.target.value)} /></label></div>
          <div className="row"><label className="f" style={{ flex: 1 }}>Mortalité de bande de référence (%)<input className="input" disabled={!dge} value={d.mortalityRefPct} onChange={(e) => num('mortalityRefPct', e.target.value)} /></label>
            <label className="f" style={{ flex: 1 }}>Mortalité de bande élevée (%)<input className="input" disabled={!dge} value={d.mortalityHighPct} onChange={(e) => num('mortalityHighPct', e.target.value)} /></label></div>
          <div className="row"><label className="f" style={{ flex: 1 }}>Durée de référence (jours)<input className="input" disabled={!dge} value={d.bandReferenceDays} onChange={(e) => num('bandReferenceDays', e.target.value)} /></label>
            <label className="f" style={{ flex: 1 }}>Pesée tous les (jours)<input className="input" disabled={!dge} value={d.weighingEveryDays} onChange={(e) => num('weighingEveryDays', e.target.value)} /></label>
            <label className="f" style={{ flex: 1 }}>Échantillon<input className="input" disabled={!dge} value={d.weighingSample} onChange={(e) => num('weighingSample', e.target.value)} /></label></div>
          <h3>Rapports automatiques</h3>
          {(['hebdomadaire', 'finBande', 'mensuel'] as const).map((k) => <label key={k} className="check"><input type="checkbox" disabled={!dge} checked={d.reports[k]} onChange={(e) => set('reports', { ...d.reports, [k]: e.target.checked })} /><span>{k === 'finBande' ? 'Fin de bande' : k === 'mensuel' ? 'Mensuel national' : 'Hebdomadaire'}</span></label>)}
          <h3>Classement des fermes : pondérations</h3>
          <div className="row">{(Object.keys(d.rankingWeights) as (keyof Settings['rankingWeights'])[]).map((k) => (
            <label key={k} className="f" style={{ flex: 1 }}>{k}<input className="input" disabled={!dge} value={d.rankingWeights[k]} onChange={(e) => set('rankingWeights', { ...d.rankingWeights, [k]: Number(e.target.value) || 0 })} /></label>
          ))}</div>
        </div>
        <div className="panel">
          <h3>Volet sanitaire · services vétérinaires</h3>
          <div className="f">Calendrier vaccinal
            {d.vaccinationCalendar.map((v, i) => (
              <div key={i} className="row"><input className="input" style={{ maxWidth: 90 }} disabled={!vet} value={v.day} onChange={(e) => set('vaccinationCalendar', d.vaccinationCalendar.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) || 0 } : x)))} />
                <input className="input" disabled={!vet} value={v.vaccine} onChange={(e) => set('vaccinationCalendar', d.vaccinationCalendar.map((x, j) => (j === i ? { ...x, vaccine: e.target.value } : x)))} />
                {vet && <button className="sel" onClick={() => set('vaccinationCalendar', d.vaccinationCalendar.filter((_, j) => j !== i))}>✕</button>}</div>
            ))}
            {vet && <button className="sel" onClick={() => set('vaccinationCalendar', [...d.vaccinationCalendar, { day: 21, vaccine: 'Nouveau vaccin' }])}>Ajouter une étape</button>}
          </div>
          <div className="f">Produits de traitement et délais d'attente (jours)
            {d.treatmentProducts.map((p, i) => (
              <div key={i} className="row"><input className="input" disabled={!vet} value={p.product} onChange={(e) => set('treatmentProducts', d.treatmentProducts.map((x, j) => (j === i ? { ...x, product: e.target.value } : x)))} />
                <input className="input" style={{ maxWidth: 90 }} disabled={!vet} value={p.withdrawalDays} onChange={(e) => set('treatmentProducts', d.treatmentProducts.map((x, j) => (j === i ? { ...x, withdrawalDays: Number(e.target.value) || 0 } : x)))} /></div>
            ))}
            {vet && <button className="sel" onClick={() => set('treatmentProducts', [...d.treatmentProducts, { product: 'Nouveau produit', withdrawalDays: 7 }])}>Ajouter un produit</button>}
          </div>
          <Strings label="Signes cliniques" value={d.clinicalSigns} disabled={!vet} onChange={(v) => set('clinicalSigns', v)} />
          <Strings label="Grille de biosécurité" value={d.biosecurityGrid} disabled={!vet} onChange={(v) => set('biosecurityGrid', v)} />
          <h3>Listes · DGE</h3>
          <Items label="Statuts de ferme" value={d.farmStatuses} disabled={!dge} onChange={(v) => set('farmStatuses', v)} />
          <Items label="Motifs de sortie" value={d.exitReasons} disabled={!dge} onChange={(v) => set('exitReasons', v)} />
          <Items label="Types d'opérateurs" value={d.operatorTypes} disabled={!dge} onChange={(v) => set('operatorTypes', v)} />
          <Strings label="Localités" value={d.localities} disabled={!dge} onChange={(v) => set('localities', v)} />
          <Strings label="Infrastructures" value={d.infrastructures} disabled={!dge} onChange={(v) => set('infrastructures', v)} />
          <Strings label="Postes de charges" value={d.chargePosts} disabled={!dge} onChange={(v) => set('chargePosts', v)} />
          <div className="f">Catalogue des intrants et unités
            {d.inputCatalog.map((c, i) => (
              <div key={i} className="row"><select className="input" style={{ maxWidth: 140 }} disabled={!dge} value={c.type} onChange={(e) => set('inputCatalog', d.inputCatalog.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}>{['poussins', 'aliment', 'vaccin', 'medicament', 'autre'].map((t) => <option key={t}>{t}</option>)}</select>
                <input className="input" disabled={!dge} value={c.product} onChange={(e) => set('inputCatalog', d.inputCatalog.map((x, j) => (j === i ? { ...x, product: e.target.value } : x)))} />
                <input className="input" style={{ maxWidth: 90 }} disabled={!dge} value={c.unit} onChange={(e) => set('inputCatalog', d.inputCatalog.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))} /></div>
            ))}
            {dge && <button className="sel" onClick={() => set('inputCatalog', [...d.inputCatalog, { type: 'autre', product: 'Nouvel intrant', unit: 'kg' }])}>Ajouter un intrant</button>}
          </div>
        </div>
      </div>
      {toast}
    </>
  );
}

const ACTIONS: RightAction[] = ['consulter', 'creer', 'modifier', 'supprimer', 'valider', 'administrer'];
const LETTER: Record<RightAction, string> = { consulter: 'L', creer: 'C', modifier: 'M', supprimer: 'S', valider: 'V', administrer: 'A' };
const ROLE_L: Record<string, string> = { eleveur: 'Éleveur', agent: 'Agent', dge: 'DGE', veterinaire: 'Vétérinaire', bceg: 'BCEG', maedr: 'MAEDR', aninf: 'ANINF', operateur: 'Opérateur', admin: 'Admin' };

/** Matrice des droits paramétrable (consulter, créer, modifier, valider, administrer), appliquée par le serveur. */
export function RightsPage() {
  const current = useSettings(); const [toast, show] = useToast();
  const [r, setR] = useState(current.rights);
  useEffect(() => setR(current.rights), [current.rights]);
  const toggle = (role: string, dom: string, a: RightAction) => setR((x) => {
    const cur = (x[role]?.[dom as never] ?? []) as RightAction[];
    return { ...x, [role]: { ...(x[role] ?? {}), [dom]: cur.includes(a) ? cur.filter((y) => y !== a) : [...cur, a] } };
  });
  return (
    <>
      <div className="top"><div><h1>Matrice des droits</h1><span className="muted">Le serveur vérifie ces droits à chaque enregistrement, en plus du périmètre de chacun (sa ferme, ses fermes, le volet sanitaire). L'administrateur garde tous les droits.</span></div>
        <button className="sel dark" onClick={async () => { await save('settings', { ...current, rights: { ...r, admin: current.rights.admin } }, 'modification de la matrice des droits'); show('Matrice enregistrée'); }}>Enregistrer</button></div>
      <div className="panel" style={{ overflowX: 'auto' }}>
        <table className="tbl rights">
          <thead><tr><th>Profil</th>{DOMAINS.map((d) => <th key={d}>{d}</th>)}</tr></thead>
          <tbody>{Object.keys(ROLE_L).filter((x) => x !== 'admin').map((role) => (
            <tr key={role}><td><b>{ROLE_L[role]}</b></td>{DOMAINS.map((dom) => (
              <td key={dom}>{ACTIONS.map((a) => {
                const on = ((r[role]?.[dom] ?? []) as RightAction[]).includes(a);
                return <button key={a} title={a} className={`rbit${on ? ' on' : ''}`} onClick={() => toggle(role, dom, a)}>{LETTER[a]}</button>;
              })}</td>
            ))}</tr>
          ))}</tbody>
        </table>
        <span className="muted">L = consulter (lire) · C = créer · M = modifier · S = supprimer · V = valider · A = administrer. Les lots, les bandes, les fermes et les alertes ne se suppriment jamais, quel que soit le profil.</span>
      </div>
      {toast}
    </>
  );
}
