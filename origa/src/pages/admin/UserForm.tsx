import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { saveUser } from '../../data/admin';
import { Icon } from '../../components/Icon';
import type { Role, UserAccount } from '../../domain/types';

export const ROLES: { k: Role | 'operateur'; label: string }[] = [
  { k: 'eleveur', label: 'Éleveur' }, { k: 'agent', label: 'Agent technique' }, { k: 'dge', label: 'POUFA / DGE' },
  { k: 'veterinaire', label: 'Services vétérinaires' }, { k: 'bceg', label: 'BCEG' }, { k: 'operateur', label: 'Opérateur (abattoir, distributeur)' },
  { k: 'maedr', label: 'MAEDR (données agrégées)' }, { k: 'aninf', label: 'ANINF (audit)' },
  { k: 'admin', label: 'Administrateur' },
];
export const roleLabel = (r: string) => ROLES.find((x) => x.k === r)?.label ?? r;

type Draft = Omit<UserAccount, 'id' | 'createdAt'> & { id?: string; createdAt?: string };

/** Création ou modification d'un compte, avec son périmètre (ferme, fermes, opérateur). */
export function UserForm({ initial, onSaved, submitLabel = 'Enregistrer', onSubmit }: {
  initial: Draft; onSaved: (u?: UserAccount) => void; submitLabel?: string; onSubmit?: (d: Draft) => Promise<void>;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const farms = useLiveQuery(() => db.farms.orderBy('id').toArray(), [], []);
  const operators = useLiveQuery(() => db.operators.toArray(), [], []);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const toggleFarm = (id: string) => set('farmIds', (d.farmIds ?? []).includes(id) ? (d.farmIds ?? []).filter((x) => x !== id) : [...(d.farmIds ?? []), id]);

  async function submit() {
    setBusy(true); setError('');
    try {
      if (onSubmit) { await onSubmit(d); onSaved(); } else onSaved(await saveUser(d));
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label className="f">Nom affiché<input className="input" value={d.name} onChange={(e) => set('name', e.target.value)} /></label>
      <label className="f">Téléphone (identifiant de connexion)<input className="input" inputMode="tel" value={d.phone} onChange={(e) => set('phone', e.target.value)} /></label>
      <label className="f">Profil
        <select className="input" value={d.role} onChange={(e) => set('role', e.target.value as Draft['role'])}>
          {ROLES.map((r) => <option key={r.k} value={r.k}>{r.label}</option>)}
        </select>
      </label>
      {d.role === 'eleveur' && (
        <label className="f">Ferme
          <select className="input" value={d.farmId ?? ''} onChange={(e) => set('farmId', e.target.value || undefined)}>
            <option value="">Choisir…</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.id} · {f.name}</option>)}
          </select>
        </label>
      )}
      {d.role === 'agent' && (
        <div className="f">Fermes suivies
          <div className="chips">{farms.map((f) => (
            <button key={f.id} type="button" className={`chip${(d.farmIds ?? []).includes(f.id) ? ' sel-g' : ''}`} onClick={() => toggleFarm(f.id)}>{f.id}</button>
          ))}</div>
        </div>
      )}
      {d.role === 'operateur' && (
        <label className="f">Opérateur du registre
          <select className="input" value={d.operatorId ?? ''} onChange={(e) => set('operatorId', e.target.value || undefined)}>
            <option value="">Choisir…</option>
            {operators.map((o) => <option key={o.id} value={o.id} disabled={!o.convention}>{o.name}{o.convention ? '' : ' (sans convention)'}</option>)}
          </select>
        </label>
      )}
      <label className="check"><input type="checkbox" checked={d.active} onChange={(e) => set('active', e.target.checked)} /><span>Compte actif</span></label>
      {error && <div className="note red" role="alert"><Icon name="warn" size={18} />{error}</div>}
      <button className="cta green" disabled={busy} onClick={submit}>{busy ? 'Enregistrement…' : submitLabel}</button>
    </div>
  );
}
