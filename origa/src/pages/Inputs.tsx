import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { save } from '../data/repo';
import { BackBar, Modal, useToast } from '../components/ui';
import { Icon } from '../components/Icon';
import { fmt, fmtDate, fmtInt, useCurrentBand, useSession, useSettings } from '../app/hooks';
import { stockByType } from '../domain/kpis';
import { inputGap } from '../domain/analytics';
import { today, uid } from '../domain/ids';
import type { InputMovement, InputType } from '../domain/types';

const LABEL: Record<string, string> = { poussins: 'Poussins', aliment: 'Aliment', vaccin: 'Vaccins', medicament: 'Médicaments', autre: 'Autres' };

/** Intrants reçus et utilisés : livraisons, confirmation par l'éleveur, stock, écart livré / déclaré (§ 5.1). */
export function InputsPage() {
  const s = useSession();
  const st = useSettings();
  const cur = useCurrentBand(s.farmId);
  const [toast, show] = useToast();
  const [form, setForm] = useState<Partial<InputMovement> | null>(null);
  const movs = useLiveQuery(() => (s.farmId ? db.inputs.where('farmId').equals(s.farmId).reverse().sortBy('date') : []), [s.farmId], []);
  const visits = useLiveQuery(() => (s.farmId ? db.visits.where('farmId').equals(s.farmId).toArray() : []), [s.farmId], []);
  const stock = stockByType(movs.filter((m) => m.type !== 'poussins'));
  const gap = inputGap(movs, visits);
  const receptions = movs.filter((m) => m.kind === 'reception');

  async function submit() {
    const c = st.inputCatalog.find((x) => x.product === form?.product);
    if (!c || !form?.quantity || form.quantity <= 0 || !s.farmId) return show('Choisissez l’intrant et la quantité.');
    await save('inputs', {
      id: uid(), farmId: s.farmId, bandId: cur?.band?.id, date: form.date ?? today(), type: c.type as InputType, product: c.product, quantity: form.quantity, unit: c.unit,
      kind: 'reception', supplier: form.supplier || 'Programme POUFA', supplierLot: form.supplierLot || undefined, subsidized: form.subsidized ?? true,
      confirmed: s.role === 'eleveur', // une livraison saisie par l'agent doit être confirmée par l'éleveur
    }, 'réception d’intrants');
    setForm(null); show(s.role === 'eleveur' ? 'Livraison enregistrée' : 'Livraison enregistrée : à confirmer par l’éleveur');
  }

  return (
    <>
      <BackBar title="Intrants" sub="Fournis par l'État (subvention dégressive)" />
      <div className="content">
        <button className="cta" onClick={() => setForm({ date: today(), subsidized: true })}><Icon name="plus" />Enregistrer une livraison</button>
        <div className="kpis">
          {Object.entries(stock).map(([t, q]) => (
            <div key={t} className="kpi"><span className="l">Stock {LABEL[t] ?? t}</span><span className={`v ${q < 0 ? 'bad' : ''}`}>{fmtInt(q)}</span><span className="s">{q < 0 ? 'Stock négatif : à vérifier' : receptions.find((r) => r.type === t)?.unit ?? ''}</span></div>
          ))}
        </div>
        <div className="card">
          <h3>Recoupement livraisons / déclarations</h3>
          {gap.gapPct === undefined ? <span className="muted">Disponible après une visite technique avec relevé du stock d'aliment.</span> : (
            <span className={`muted ${Math.abs(gap.gapPct) > st.inputGapPct ? 'bad' : 'ok'}`}>
              Livré {fmtInt(gap.delivered)} kg · déclaré utilisé {fmtInt(gap.used)} kg · constaté en stock {fmtInt(gap.observed!)} kg · écart {fmt(gap.gapPct, 1)} % (seuil {st.inputGapPct} %)
            </span>
          )}
        </div>
        <div className="card">
          <h3>Réceptions</h3>
          <div className="list">
            {receptions.map((m) => (
              <div key={m.id} className="li">
                <div className="grow"><b>{m.product}</b><span>{fmtInt(m.quantity)} {m.unit} · {m.supplier} · lot {m.supplierLot ?? '—'} · {fmtDate(m.date)}{m.subsidized ? ' · subventionné' : ''}</span></div>
                {m.confirmed ? <span className="pill on">Confirmé</span> : s.role === 'eleveur' ? (
                  <button className="pill sky" onClick={async () => { await save('inputs', { ...m, confirmed: true }, 'confirmation de réception'); show('Réception confirmée'); }}>Confirmer</button>
                ) : <span className="pill off">À confirmer</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      {form && (
        <Modal title="Livraison d'intrants" onClose={() => setForm(null)}>
          <label className="f">Intrant<select className="input" value={form.product ?? ''} onChange={(e) => setForm({ ...form, product: e.target.value })}><option value="">Choisir…</option>{st.inputCatalog.map((c) => <option key={c.product} value={c.product}>{c.product} ({c.unit})</option>)}</select></label>
          <label className="f">Quantité<input className="input" inputMode="decimal" value={form.quantity ?? ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value.replace(',', '.')) || undefined })} /></label>
          <label className="f">Date<input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label className="f">Fournisseur<input className="input" placeholder="SMAG, couvoir…" value={form.supplier ?? ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></label>
          <label className="f">N° de lot du fournisseur<input className="input" value={form.supplierLot ?? ''} onChange={(e) => setForm({ ...form, supplierLot: e.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={!!form.subsidized} onChange={(e) => setForm({ ...form, subsidized: e.target.checked })} /><span>Intrant subventionné par l'État</span></label>
          <button className="cta green" onClick={submit}>Enregistrer</button>
        </Modal>
      )}
      {toast}
    </>
  );
}
