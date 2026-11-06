import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { BackBar, Empty, Modal, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmt, fmtDate, useSession, useSettings } from '../app/hooks';
import { biosecurityScore } from '../domain/analytics';
import { addDays, today, uid } from '../domain/ids';
import type { BiosecurityCheck } from '../domain/types';

/** Contrôles de biosécurité : grille paramétrable, score, mesures correctives suivies jusqu'à clôture (§ 5.2). */
export function BiosecurityPage() {
  const s = useSession(); const st = useSettings(); const [toast, show] = useToast();
  const web = !['eleveur', 'agent'].includes(s.role);
  const canCreate = ['agent', 'veterinaire', 'admin'].includes(s.role);
  const farms = useLiveQuery(() => db.farms.toArray(), [], []);
  const checks = useLiveQuery(() => db.biosecurity.orderBy('date').reverse().toArray(), [], [] as BiosecurityCheck[]);
  const scope = (f: string) => (s.role === 'eleveur' ? f === s.farmId : s.role === 'agent' ? !!s.farmIds?.includes(f) : true);
  const [draft, setDraft] = useState<{ farmId: string; results: Record<string, boolean>; actions: { text: string; due: string; done: boolean }[] } | null>(null);
  const score = draft ? biosecurityScore(draft.results) : 0;

  async function submit() {
    if (!draft?.farmId) return show('Choisissez la ferme.');
    const c: BiosecurityCheck = { id: uid(), farmId: draft.farmId, date: today(), results: draft.results, scorePct: score, actions: draft.actions.filter((a) => a.text.trim()), by: s.userLabel };
    await save('biosecurity', c, 'contrôle de biosécurité'); setDraft(null); show(`Contrôle enregistré : ${fmt(score, 0)} %`);
  }
  const toggleAction = (c: BiosecurityCheck, i: number) => save('biosecurity', { ...c, actions: c.actions.map((a, j) => (j === i ? { ...a, done: !a.done } : a)) }, 'suivi de mesure corrective');

  const body = (
    <>
      {canCreate && <button className={web ? 'sel dark' : 'cta'} onClick={() => setDraft({ farmId: s.farmId ?? '', results: Object.fromEntries(st.biosecurityGrid.map((g) => [g, true])), actions: [] })}>{web ? '+ Nouveau contrôle' : <><Icon name="plus" />Nouveau contrôle</>}</button>}
      {checks.filter((c) => scope(c.farmId)).length === 0 && <div className={web ? 'panel' : 'card'}><Empty title="Aucun contrôle" text="Grille de conformité, score et mesures correctives suivies jusqu'à leur clôture." /></div>}
      {checks.filter((c) => scope(c.farmId)).map((c) => {
        const open = c.actions.filter((a) => !a.done).length;
        return (
          <div key={c.id} className={web ? 'panel' : 'card'}>
            <div className="row between wrap"><h3>{c.farmId} · {farms.find((f) => f.id === c.farmId)?.name}</h3><span className={`pill ${c.scorePct >= 80 ? 'on' : c.scorePct >= 60 ? 'off' : 'red'}`}>{fmt(c.scorePct, 0)} % conforme</span></div>
            <span className="muted">{fmtDate(c.date)} · {c.by} · {open ? `${open} mesure(s) corrective(s) en cours` : 'Clos : aucune mesure en cours'}</span>
            {Object.entries(c.results).filter(([, ok]) => !ok).map(([k]) => <span key={k} className="muted bad">✕ {k}</span>)}
            {c.actions.map((a, i) => (
              <label key={i} className="check"><input type="checkbox" checked={a.done} disabled={!canCreate && s.role !== 'eleveur'} onChange={() => toggleAction(c, i)} /><span>{a.text} · échéance {fmtDate(a.due)}</span></label>
            ))}
          </div>
        );
      })}
    </>
  );

  return (
    <>
      {web ? <div className="top"><div><h1>Biosécurité</h1><span className="muted">Score = points conformes / points contrôlés × 100</span></div></div> : <BackBar title="Biosécurité" sub="Contrôles de conformité de la ferme" />}
      <div className={web ? '' : 'content'} style={web ? { display: 'flex', flexDirection: 'column', gap: 12 } : undefined}>{body}</div>
      {draft && (
        <Modal title={`Contrôle de biosécurité · ${fmt(score, 0)} %`} onClose={() => setDraft(null)}>
          <label className="f">Ferme<select className="input" value={draft.farmId} onChange={(e) => setDraft({ ...draft, farmId: e.target.value })}><option value="">Choisir…</option>{farms.filter((f) => scope(f.id)).map((f) => <option key={f.id} value={f.id}>{f.id} · {f.name}</option>)}</select></label>
          {st.biosecurityGrid.map((g) => (
            <label key={g} className="check"><input type="checkbox" checked={draft.results[g] ?? false} onChange={(e) => setDraft({ ...draft, results: { ...draft.results, [g]: e.target.checked } })} /><span>{g}</span></label>
          ))}
          <b>Mesures correctives</b>
          {draft.actions.map((a, i) => (
            <div key={i} className="row">
              <input className="input" placeholder="Mesure à prendre" value={a.text} onChange={(e) => setDraft({ ...draft, actions: draft.actions.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
              <input className="input" style={{ maxWidth: 160 }} type="date" value={a.due} onChange={(e) => setDraft({ ...draft, actions: draft.actions.map((x, j) => (j === i ? { ...x, due: e.target.value } : x)) })} />
            </div>
          ))}
          <button className="cta light" onClick={() => setDraft({ ...draft, actions: [...draft.actions, { text: '', due: addDays(today(), 7), done: false }] })}><Icon name="plus" />Ajouter une mesure</button>
          <button className="cta green" onClick={submit}>Enregistrer le contrôle</button>
        </Modal>
      )}
      {toast}
    </>
  );
}
