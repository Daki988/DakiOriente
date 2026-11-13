import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { save } from '../../data/repo';
import { auditIntact, decideRequest, listAudit, listRequests, listUsers, roleFor, type AuditRow } from '../../data/admin';
import { Modal, useToast } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { UserForm, ROLES, roleLabel } from './UserForm';
import { fmtDate } from '../../app/hooks';
import { API, api, apiEnabled } from '../../app/api';
import { provinceName } from '../../domain/provinces';
import type { AccessRequest, Operator, UserAccount } from '../../domain/types';
import { saveText } from '../../app/native';

/** Recharge une liste distante ou locale à la demande. */
function useAsync<T>(fn: () => Promise<T>, init: T): [T, () => void, string] {
  const [v, setV] = useState<T>(init);
  const [err, setErr] = useState('');
  const load = useCallback(() => { fn().then((x) => { setV(x); setErr(''); }).catch((e) => setErr((e as Error).message)); }, [fn]);
  useEffect(load, [load]);
  return [v, load, err];
}

// ---------- Tableau de bord d'administration ----------
export function AdminHome() {
  const [users] = useAsync(listUsers, [] as UserAccount[]);
  const [requests] = useAsync(listRequests, [] as AccessRequest[]);
  const [audit] = useAsync(useCallback(() => listAudit(8), []), [] as AuditRow[]);
  const stats = useLiveQuery(async () => ({
    farms: await db.farms.where('status').equals('operationnelle').count(),
    operators: (await db.operators.toArray()).filter((o) => o.convention).length,
    lots: await db.lots.count(),
    alerts: (await db.alerts.toArray()).filter((a) => ['nouvelle', 'analyse', 'confirmee'].includes(a.status)).length,
    pending: await db.outbox.count(),
  }), [], { farms: 0, operators: 0, lots: 0, alerts: 0, pending: 0 });
  const pendingReq = requests.filter((r) => r.status === 'en_attente');

  return (
    <>
      <div className="top"><div><h1>Administration</h1><span className="muted">Comptes, droits, registres et journal d'audit du programme POUFA.</span></div></div>
      <div className="grid4">
        <div className="wk"><span className="l">Comptes actifs</span><span className="v">{users.filter((u) => u.active).length}</span><span className="s">{users.length} au total</span></div>
        <Link to="/admin/demandes" className="wk"><span className="l">Demandes d'accès</span><span className={`v ${pendingReq.length ? 'warn' : ''}`}>{pendingReq.length}</span><span className="s">en attente de validation</span></Link>
        <div className="wk"><span className="l">Fermes opérationnelles</span><span className="v">{stats.farms}</span><span className="s">{stats.operators} opérateur(s) sous convention</span></div>
        <div className="wk"><span className="l">Lots tracés</span><span className="v">{stats.lots}</span><span className="s bad">{stats.alerts} alerte(s) sanitaire(s) ouverte(s)</span></div>
      </div>
      <div className="grid2">
        <div className="panel">
          <div className="row between"><h3>Demandes en attente</h3><Link className="sel" to="/admin/demandes">Tout voir</Link></div>
          {pendingReq.length === 0 && <div className="empty">Aucune demande en attente.</div>}
          {pendingReq.slice(0, 5).map((r) => (
            <div key={r.id} className="li"><div className="grow"><b>{r.name}</b><span>{r.organisation} · {roleLabel(roleFor(r))} · {fmtDate(r.createdAt)}</span></div><Link className="pill sky" to="/admin/demandes">Examiner</Link></div>
          ))}
        </div>
        <div className="panel">
          <div className="row between"><h3>Dernières opérations</h3><Link className="sel" to="/admin/journal">Journal</Link></div>
          {audit.map((a) => <div key={a.id} className="li"><div className="grow"><b>{a.action}</b><span>{a.user} · {a.table ?? ''} {a.key ?? ''} · {new Date(a.at).toLocaleString('fr-FR')}</span></div></div>)}
        </div>
      </div>
      <DemoReset />
    </>
  );
}

/**
 * Avant une séance de test (jury, formation) : les données métier repartent du jeu de démonstration, dates du jour.
 * Visible seulement quand le serveur national tourne en mode démonstration ; comptes et journal d'audit conservés.
 */
function DemoReset() {
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, show] = useToast();
  useEffect(() => { if (apiEnabled) fetch(`${API}/public/config`).then((r) => r.json()).then((c) => setDemo(!!c.demo)).catch(() => undefined); }, []);
  if (!demo) return null;
  const reset = async () => {
    if (!window.confirm('Remettre la démonstration à zéro ? Toutes les saisies d’essai seront effacées pour tous les appareils (comptes et journal d’audit conservés).')) return;
    setBusy(true);
    try { const r = await api<{ records: number }>('/admin/demo/reset', { method: 'POST' }); show(`Démonstration remise à zéro : ${r.records} enregistrements rechargés`); setTimeout(() => location.reload(), 1200); }
    catch (e) { show((e as Error).message); setBusy(false); }
  };
  return (
    <div className="panel">
      <h3>Séance de démonstration</h3>
      <span className="muted">Avant une séance de test (jury, formation) : les saisies d’essai sont effacées et les données de démonstration rechargées, dates du jour. Chaque appareil se met à jour à sa prochaine ouverture.</span>
      <button className="sel dark" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={reset}>{busy ? 'Remise à zéro…' : 'Remettre la démonstration à zéro'}</button>
      {toast}
    </div>
  );
}

// ---------- Comptes ----------
export function AdminUsers() {
  const [users, reload, err] = useAsync(listUsers, [] as UserAccount[]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [edit, setEdit] = useState<Partial<UserAccount> | null>(null);
  const [toast, show] = useToast();
  const rows = useMemo(() => users.filter((u) => (!role || u.role === role) && `${u.name} ${u.phone} ${u.farmId ?? ''}`.toLowerCase().includes(q.toLowerCase())), [users, q, role]);

  return (
    <>
      <div className="top">
        <div><h1>Comptes utilisateurs</h1><span className="muted">Chacun ne voit que son périmètre : sa ferme, ses fermes, le volet sanitaire ou les données agrégées.</span></div>
        <div className="row wrap" style={{ gap: 8 }}>
          <input className="sel" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="sel" value={role} onChange={(e) => setRole(e.target.value)}><option value="">Tous les profils</option>{ROLES.map((r) => <option key={r.k} value={r.k}>{r.label}</option>)}</select>
          <button className="sel dark" onClick={() => setEdit({ name: '', phone: '', role: 'eleveur', active: true })}>+ Nouveau compte</button>
        </div>
      </div>
      {err && <div className="note red">{err}</div>}
      <div className="panel">
        <table className="tbl">
          <thead><tr><th>Nom</th><th>Téléphone</th><th>Profil</th><th>Périmètre</th><th>Dernière connexion</th><th>Statut</th><th /></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td><b>{u.name}</b></td><td className="nw">{u.phone}</td><td>{roleLabel(u.role)}</td>
                <td>{u.role === 'eleveur' ? u.farmId : u.role === 'agent' ? (u.farmIds ?? []).join(', ') : u.role === 'operateur' ? u.operatorId : 'National'}</td>
                <td className="nw">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : '—'}</td>
                <td><span className={`pill ${u.active ? 'on' : 'red'}`}>{u.active ? 'Actif' : 'Désactivé'}</span></td>
                <td><button className="sel" onClick={() => setEdit(u)}>Modifier</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit.id ? 'Modifier le compte' : 'Nouveau compte'} onClose={() => setEdit(null)}>
          <UserForm initial={edit as UserAccount} onSaved={() => { setEdit(null); reload(); show('Compte enregistré et journalisé'); }} />
        </Modal>
      )}
      {toast}
    </>
  );
}

// ---------- Demandes d'accès ----------
export function AdminRequests() {
  const [requests, reload, err] = useAsync(listRequests, [] as AccessRequest[]);
  const [tab, setTab] = useState<'en_attente' | 'traitees'>('en_attente');
  const [approve, setApprove] = useState<AccessRequest | null>(null);
  const [reject, setReject] = useState<AccessRequest | null>(null);
  const [note, setNote] = useState('');
  const [toast, show] = useToast();
  const rows = requests.filter((r) => (tab === 'en_attente' ? r.status === 'en_attente' : r.status !== 'en_attente'));

  return (
    <>
      <div className="top">
        <div><h1>Demandes d'accès</h1><span className="muted">Pas d'inscription libre : chaque compte est vérifié. Un opérateur n'est activé qu'avec une convention signée.</span></div>
        <div className="row" style={{ gap: 8 }}>
          <button className={`sel${tab === 'en_attente' ? ' dark' : ''}`} onClick={() => setTab('en_attente')}>En attente ({requests.filter((r) => r.status === 'en_attente').length})</button>
          <button className={`sel${tab === 'traitees' ? ' dark' : ''}`} onClick={() => setTab('traitees')}>Traitées</button>
        </div>
      </div>
      {err && <div className="note red">{err}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.length === 0 && <div className="panel"><div className="empty">Aucune demande.</div></div>}
        {rows.map((r) => (
          <div key={r.id} className="panel">
            <div className="row between wrap"><h3>{r.name} · {roleLabel(roleFor(r))}</h3>
              <span className={`pill ${r.status === 'en_attente' ? 'off' : r.status === 'approuvee' ? 'on' : 'red'}`}>{r.status === 'en_attente' ? 'En attente' : r.status === 'approuvee' ? 'Approuvée' : 'Refusée'}</span></div>
            <div className="muted">{r.organisation}{r.province ? ` · ${provinceName(r.province)}` : ''} · {r.phone} · reçue le {fmtDate(r.createdAt)}</div>
            {r.reference && <div className="muted">Référence : <b>{r.reference}</b></div>}
            {r.message && <div className="muted">« {r.message} »</div>}
            {r.decidedAt && <div className="muted">Décision du {fmtDate(r.decidedAt)} par {r.decidedBy}{r.decisionNote ? ` : ${r.decisionNote}` : ''}</div>}
            {r.status === 'en_attente' && (
              <div className="row" style={{ gap: 8 }}>
                <button className="sel dark" onClick={() => setApprove(r)}>Approuver et créer le compte</button>
                <button className="sel" onClick={() => { setReject(r); setNote(''); }}>Refuser</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {approve && (
        <Modal title={`Créer le compte de ${approve.name}`} onClose={() => setApprove(null)}>
          <UserForm submitLabel="Approuver et activer"
            initial={{ name: approve.name, phone: approve.phone, role: roleFor(approve), active: true }}
            onSubmit={(d) => decideRequest(approve, true, '', d)}
            onSaved={() => { setApprove(null); reload(); show('Compte créé : la personne peut se connecter'); }} />
        </Modal>
      )}
      {reject && (
        <Modal title="Refuser la demande" onClose={() => setReject(null)}>
          <label className="f">Motif communiqué au demandeur<textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <button className="cta red" disabled={!note.trim()} onClick={async () => { await decideRequest(reject, false, note); setReject(null); reload(); show('Demande refusée'); }}>Confirmer le refus</button>
        </Modal>
      )}
      {toast}
    </>
  );
}

// ---------- Registre des opérateurs ----------
export function AdminOperators() {
  const ops = useLiveQuery(() => db.operators.toArray(), [], []);
  const [edit, setEdit] = useState<Partial<Operator> | null>(null);
  const [toast, show] = useToast();
  async function submit() {
    if (!edit?.name?.trim() || !edit.locality?.trim()) return;
    const n = ops.reduce((m, o) => Math.max(m, Number(o.id.replace(/\D/g, '')) || 0), 0) + 1;
    await save('operators', { id: edit.id ?? `OP-${String(n).padStart(3, '0')}`, name: edit.name.trim(), type: edit.type ?? 'abattoir', locality: edit.locality.trim(), contact: edit.contact, convention: !!edit.convention } as Operator, edit.id ? 'modification opérateur' : 'création opérateur');
    setEdit(null); show('Opérateur enregistré');
  }
  return (
    <>
      <div className="top"><div><h1>Registre des opérateurs</h1><span className="muted">Abattoirs, acheteurs et distributeurs. Toute cession vise un opérateur connu (§ 6.1).</span></div>
        <button className="sel dark" onClick={() => setEdit({ type: 'abattoir', convention: false })}>+ Nouvel opérateur</button></div>
      <div className="panel">
        <table className="tbl">
          <thead><tr><th>Identifiant</th><th>Nom</th><th>Type</th><th>Localité</th><th>Contact</th><th>Convention</th><th /></tr></thead>
          <tbody>{ops.map((o) => (
            <tr key={o.id}><td className="lotid" style={{ fontSize: 13 }}>{o.id}</td><td><b>{o.name}</b></td><td>{o.type}</td><td>{o.locality}</td><td>{o.contact ?? '—'}</td>
              <td><span className={`pill ${o.convention ? 'on' : 'off'}`}>{o.convention ? 'Signée' : 'En attente'}</span></td><td><button className="sel" onClick={() => setEdit(o)}>Modifier</button></td></tr>
          ))}</tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit.id ? 'Modifier l’opérateur' : 'Nouvel opérateur'} onClose={() => setEdit(null)}>
          <label className="f">Nom<input className="input" value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
          <label className="f">Type<select className="input" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Operator['type'] })}>
            <option value="abattoir">Abattoir</option><option value="acheteur">Acheteur</option><option value="distributeur">Distributeur</option></select></label>
          <label className="f">Localité<input className="input" value={edit.locality ?? ''} onChange={(e) => setEdit({ ...edit, locality: e.target.value })} /></label>
          <label className="f">Contact<input className="input" value={edit.contact ?? ''} onChange={(e) => setEdit({ ...edit, contact: e.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={!!edit.convention} onChange={(e) => setEdit({ ...edit, convention: e.target.checked })} /><span>Convention signée avec le ministère</span></label>
          <button className="cta green" disabled={!edit.name?.trim() || !edit.locality?.trim()} onClick={submit}>Enregistrer</button>
        </Modal>
      )}
      {toast}
    </>
  );
}

// ---------- Journal d'audit ----------
export function AdminAudit() {
  const [rows, reload, err] = useAsync(useCallback(() => listAudit(300), []), [] as AuditRow[]);
  const [check, setCheck] = useState<{ intact: boolean; entries: number } | null>(null);
  const [q, setQ] = useState('');
  const shown = rows.filter((r) => `${r.action} ${r.user} ${r.table} ${r.key}`.toLowerCase().includes(q.toLowerCase()));
  function exportCsv() {
    saveText(`origa-journal-${new Date().toISOString().slice(0, 10)}.csv`, '﻿Date;Utilisateur;Action;Table;Clé\n' + shown.map((r) => [r.at, r.user, r.action, r.table, r.key].join(';')).join('\n'));
  }
  return (
    <>
      <div className="top"><div><h1>Journal d'audit</h1><span className="muted">Non modifiable, chaîné par empreintes SHA-256, exportable pour les audits de l'ANINF.</span></div>
        <div className="row wrap" style={{ gap: 8 }}>
          <input className="sel" placeholder="Filtrer…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="sel" onClick={reload}>Actualiser</button>
          <button className="sel" onClick={exportCsv}>Exporter CSV</button>
          <button className="sel dark" onClick={async () => setCheck(await auditIntact())}>Vérifier l'intégrité</button>
        </div></div>
      {check && <div className={`note ${check.intact ? '' : 'red'}`}><Icon name={check.intact ? 'check' : 'warn'} size={18} />{check.intact ? `Journal intègre : ${check.entries} opérations, aucune altération.` : 'Altération détectée dans le journal !'}</div>}
      {err && <div className="note red">{err}</div>}
      <div className="panel">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Objet</th></tr></thead>
          <tbody>{shown.map((r) => <tr key={String(r.id)}><td className="nw">{new Date(r.at).toLocaleString('fr-FR')}</td><td>{r.user}</td><td>{r.action}</td><td className="lotid" style={{ fontSize: 12 }}>{r.table} {r.key}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}

