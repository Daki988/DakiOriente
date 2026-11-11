import { useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { remove, save, type SyncTable } from '../data/repo';
import { deleteDenied, editDenied } from '../domain/access';
import { BackBar, Empty, Modal, useToast } from './ui';
import { Icon } from './Icon';
import { fmtDate, useSession, useSettings } from '../app/hooks';
import { today, uid } from '../domain/ids';

export interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'farm' | 'band' | 'operator' | 'photo' | 'checkbox';
  options?: { value: string; label: string }[];
  required?: boolean;
  hint?: string;
}

type Row = { id: string };
const val = (r: unknown, k: string) => String((r as Record<string, unknown>)[k] ?? '');

interface Props<T extends Row> {
  title: string;
  sub?: string;
  table: SyncTable;
  fields: Field[];
  columns: { label: string; render: (r: T) => ReactNode }[];
  filter?: (r: T) => boolean;
  sort?: (a: T, b: T) => number;
  defaults?: () => Partial<T>;
  /** Transforme le brouillon avant enregistrement ; renvoie un message pour refuser. */
  prepare?: (d: T) => T | string | Promise<T | string>;
  action?: string;
  canCreate?: boolean;
  createLabel?: string;
  rowActions?: (r: T) => ReactNode;
  /** Libellé d'une ligne dans la confirmation de suppression. */
  rowLabel?: (r: T) => string;
  empty?: { img?: string; title: string; text?: string };
  web?: boolean;
  intro?: ReactNode;
}

async function compress(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 900 / img.width);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.7);
}

/** Registre générique : liste + formulaire d'ajout, enregistré hors ligne, synchronisé et journalisé. */
export function Registry<T extends Row>(p: Props<T>) {
  const s = useSession();
  const [toast, show] = useToast();
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [doomed, setDoomed] = useState<T | null>(null);
  const st = useSettings();
  const rows = useLiveQuery(() => db.table(p.table).toArray() as Promise<T[]>, [p.table], []);
  const farms = useLiveQuery(() => db.farms.orderBy('id').toArray(), [], []);
  const bands = useLiveQuery(() => db.bands.toArray(), [], []);
  const operators = useLiveQuery(() => db.operators.toArray(), [], []);
  const shown = useMemo(() => {
    const r = p.filter ? rows.filter(p.filter) : rows;
    return [...r].sort(p.sort ?? ((a, b) => (val(b, 'date') || val(b, 'createdAt')).localeCompare(val(a, 'date') || val(a, 'createdAt'))));
  }, [rows, p.filter, p.sort]);
  const myFarms = farms.filter((f) => (s.role === 'eleveur' ? f.id === s.farmId : s.role === 'agent' ? s.farmIds?.includes(f.id) : true));

  function open() {
    setError('');
    const base: Record<string, unknown> = { date: today() };
    if (p.fields.some((f) => f.type === 'farm') && s.farmId && (s.role === 'eleveur' || s.role === 'agent')) base.farmId = s.farmId;
    setDraft({ ...base, ...(p.defaults?.() ?? {}) });
  }

  async function submit() {
    if (!draft) return;
    const missing = p.fields.find((f) => f.required && (draft[f.key] === undefined || draft[f.key] === ''));
    if (missing) { setError(`« ${missing.label} » est obligatoire.`); return; }
    const row = { id: (draft.id as string) ?? uid(), ...draft } as unknown as T;
    const out = p.prepare ? await p.prepare(row) : row;
    if (typeof out === 'string') { setError(out); return; }
    await save(p.table, out, p.action ?? `enregistrement ${p.table}`);
    setDraft(null); show('Enregistré');
  }

  const closed = useMemo(() => new Set(bands.filter((b) => b.closedAt).map((b) => b.id)), [bands]);
  const who = { role: s.role, farmId: s.farmId, farmIds: s.farmIds, operatorId: s.operatorId };
  const editing = !!draft && rows.some((r) => r.id === draft.id);
  /** Corriger et supprimer : proposés seulement à qui en a le droit (le serveur revérifie). */
  const tools = (r: T) => {
    const row = r as unknown as Record<string, unknown>;
    const edit = editDenied(who, p.table, row, st.rights, closed) === null;
    const del = deleteDenied(who, p.table, row, st.rights, closed) === null;
    if (!edit && !del) return null;
    return (
      <span className="rowtools">
        {edit && <button className="rowbtn" aria-label="Modifier" title="Modifier" onClick={() => { setError(''); setDraft({ ...row }); }}><Icon name="edit" size={17} /></button>}
        {del && <button className="rowbtn danger" aria-label="Supprimer" title="Supprimer" onClick={() => setDoomed(r)}><Icon name="trash" size={17} /></button>}
      </span>
    );
  };
  async function confirmDelete() {
    if (!doomed) return;
    await remove(p.table, doomed.id, `suppression ${p.table}`);
    setDoomed(null); show('Supprimé');
  }

  const set = (k: string, v: unknown) => setDraft((d) => ({ ...(d ?? {}), [k]: v }));
  const input = (f: Field) => {
    const v = draft?.[f.key];
    switch (f.type) {
      case 'textarea': return <textarea className="input" value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />;
      case 'number': return <input className="input" inputMode="decimal" value={v === undefined ? '' : String(v)} onChange={(e) => set(f.key, e.target.value === '' ? undefined : Number(e.target.value.replace(',', '.')))} />;
      case 'date': return <input className="input" type="date" value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />;
      case 'checkbox': return <input type="checkbox" checked={!!v} onChange={(e) => set(f.key, e.target.checked)} />;
      case 'select': return <select className="input" value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)}><option value="">Choisir…</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      case 'farm': return <select className="input" value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)}><option value="">Choisir…</option>{myFarms.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.name}</option>)}</select>;
      case 'band': {
        const fid = (draft?.farmId as string) ?? s.farmId;
        return <select className="input" value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)}><option value="">Aucune</option>{bands.filter((b) => b.farmId === fid).sort((a, b) => b.rank - a.rank).map((b) => <option key={b.id} value={b.id}>Bande {b.rank}{b.closedAt ? ' (clôturée)' : ''}</option>)}</select>;
      }
      case 'operator': return <select className="input" value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)}><option value="">Choisir…</option>{operators.map((o) => <option key={o.id} value={o.id}>{o.name} · {o.locality}</option>)}</select>;
      case 'photo': return (
        <label className="photo">{v ? <img src={String(v)} alt="Pièce jointe" /> : <><Icon name="camera" size={22} />Ajouter une photo</>}
          <input type="file" accept="image/*" capture="environment" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (file) set(f.key, await compress(file)); }} /></label>
      );
      default: return <input className="input" value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />;
    }
  };

  const create = p.canCreate !== false && (
    <button className={p.web ? 'sel dark' : 'cta'} onClick={open}>{p.web ? `+ ${p.createLabel ?? 'Ajouter'}` : <><Icon name="plus" />{p.createLabel ?? 'Ajouter'}</>}</button>
  );

  const list = shown.length === 0 ? <Empty img={p.empty?.img ?? './img/poussin.webp'} title={p.empty?.title ?? 'Aucun enregistrement'} text={p.empty?.text} /> : p.web ? (
    <table className="tbl">
      <thead><tr>{p.columns.map((c) => <th key={c.label}>{c.label}</th>)}<th /></tr></thead>
      <tbody>{shown.map((r) => <tr key={r.id}>{p.columns.map((c) => <td key={c.label}>{c.render(r)}</td>)}<td className="nw"><span className="rowtools">{p.rowActions?.(r)}{tools(r)}</span></td></tr>)}</tbody>
    </table>
  ) : (
    <div className="list">{shown.map((r) => (
      <div key={r.id} className="li" style={{ alignItems: 'flex-start' }}>
        <div className="grow">{p.columns.map((c, i) => (i === 0 ? <b key={c.label}>{c.render(r)}</b> : <span key={c.label}>{c.label} : {c.render(r)}</span>))}</div>
        <span className="rowtools col">{p.rowActions?.(r)}{tools(r)}</span>
      </div>
    ))}</div>
  );

  return (
    <>
      {p.web ? <div className="top"><div><h1>{p.title}</h1>{p.sub && <span className="muted">{p.sub}</span>}</div>{create}</div> : <BackBar title={p.title} sub={p.sub} />}
      <div className={p.web ? '' : 'content'} style={p.web ? { display: 'flex', flexDirection: 'column', gap: 12 } : undefined}>
        {p.intro}
        {!p.web && create}
        <div className={p.web ? 'panel' : 'card'}>{list}</div>
      </div>
      {draft && (
        <Modal title={editing ? `Modifier · ${p.title}` : p.createLabel ?? `Nouveau · ${p.title}`} onClose={() => setDraft(null)}>
          {p.fields.map((f) => (
            f.type === 'checkbox'
              ? <label key={f.key} className="check">{input(f)}<span>{f.label}</span></label>
              : <label key={f.key} className="f">{f.label}{f.hint && <span style={{ fontWeight: 400 }}> · {f.hint}</span>}{input(f)}</label>
          ))}
          {error && <div className="note red" role="alert"><Icon name="warn" size={18} />{error}</div>}
          <button className="cta green" onClick={submit}>Enregistrer</button>
        </Modal>
      )}
      {doomed && (
        <Modal title="Supprimer cet enregistrement ?" onClose={() => setDoomed(null)}>
          <p className="muted">{p.rowLabel?.(doomed) ?? `${p.title} · ${val(doomed, 'date') ? fmtDate(val(doomed, 'date')) : doomed.id}`}</p>
          <div className="note sun"><Icon name="warn" size={18} />La suppression est définitive et inscrite au journal d'audit.</div>
          <div className="row"><button className="cta light" style={{ flex: 1 }} onClick={() => setDoomed(null)}>Annuler</button><button className="cta danger" style={{ flex: 1 }} onClick={confirmDelete}><Icon name="trash" />Supprimer</button></div>
        </Modal>
      )}
      {toast}
    </>
  );
}
