import { db } from './db';
import { auditOnly, verifyAuditChain } from './repo';
import { api, apiEnabled } from '../app/api';
import { normalizePhone } from '../app/auth';
import { getSession } from '../app/sessionStore';
import { uid } from '../domain/ids';
import type { AccessRequest, AuditEntry, Role, UserAccount } from '../domain/types';

// Back-office : en production, les comptes et demandes vivent sur le serveur (jamais sur un téléphone) ;
// en démonstration, dans la base locale.

export async function listUsers(): Promise<UserAccount[]> {
  if (apiEnabled) return api<UserAccount[]>('/admin/users');
  return (await db.users.toArray()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveUser(u: Omit<UserAccount, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<UserAccount> {
  const phone = normalizePhone(u.phone);
  if (!phone) throw new Error('Numéro de téléphone invalide.');
  if (!u.name.trim()) throw new Error('Le nom est obligatoire.');
  if (u.role === 'eleveur' && !u.farmId) throw new Error('Rattachez l’éleveur à sa ferme.');
  if (u.role === 'agent' && !u.farmIds?.length) throw new Error('Rattachez l’agent à au moins une ferme.');
  if (u.role === 'operateur' && !u.operatorId) throw new Error('Rattachez le compte à un opérateur du registre.');
  const clean = { ...u, phone, name: u.name.trim() };
  if (apiEnabled) {
    return u.id ? api<UserAccount>(`/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify(clean) })
      : api<UserAccount>('/admin/users', { method: 'POST', body: JSON.stringify(clean) });
  }
  const dup = await db.users.where('phone').equals(phone).first();
  if (dup && dup.id !== u.id) throw new Error('Un compte existe déjà avec ce numéro.');
  const row: UserAccount = { ...clean, id: u.id ?? uid(), createdAt: u.createdAt ?? new Date().toISOString() } as UserAccount;
  await db.users.put(row);
  await logAdmin(u.id ? 'modification de compte' : 'création de compte', 'users', row.id);
  return row;
}

export async function listRequests(): Promise<AccessRequest[]> {
  if (apiEnabled) return api<AccessRequest[]>('/admin/requests');
  return (await db.requests.toArray()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Approuve (en créant le compte) ou refuse une demande d'accès. */
export async function decideRequest(req: AccessRequest, approve: boolean, note: string, user?: Parameters<typeof saveUser>[0]) {
  if (apiEnabled) {
    await api(`/admin/requests/${req.id}/decision`, { method: 'POST', body: JSON.stringify({ approve, note, user }) });
    return;
  }
  let userId: string | undefined;
  if (approve) { if (!user) throw new Error('Compte à créer manquant.'); userId = (await saveUser(user)).id; }
  await db.requests.put({ ...req, status: approve ? 'approuvee' : 'refusee', decidedAt: new Date().toISOString(), decidedBy: getSession().userLabel, decisionNote: note || undefined, userId });
  await logAdmin(approve ? 'demande approuvée' : 'demande refusée', 'requests', req.id);
}

/** Profil proposé à partir de la demande. */
export function roleFor(req: AccessRequest): Role | 'operateur' {
  return req.profile === 'autre' ? 'dge' : req.profile;
}

export interface AuditRow { id: number | string; at: string; user: string; action: string; table?: string; key?: string }

export async function listAudit(limit = 200): Promise<AuditRow[]> {
  if (apiEnabled) return api<AuditRow[]>(`/admin/audit?limit=${limit}`);
  const rows: AuditEntry[] = await db.audit.orderBy('id').reverse().limit(limit).toArray();
  return rows.map((r) => ({ id: r.id!, at: r.at, user: r.user, action: r.action, table: r.table, key: r.key }));
}

export async function auditIntact(): Promise<{ intact: boolean; entries: number }> {
  if (apiEnabled) return api('/audit/verify');
  return { intact: await verifyAuditChain(), entries: await db.audit.count() };
}

/** Les actions d'administration locales passent par le journal chaîné. */
const logAdmin = (action: string, table: string, key: string) => auditOnly(action, table, key);
