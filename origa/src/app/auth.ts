import { db } from '../data/db';
import { DEMO_CODE } from '../data/demoUsers';
import { apiEnabled, api, logout as apiLogout, requestOtp, serverDemo, verifyOtp } from './api';
import { setSession, type Session } from './sessionStore';
import type { AccessRequest, Role } from '../domain/types';
import { uid } from '../domain/ids';

/** Normalise un numéro gabonais au format E.164 (+241…). */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('00')) d = '+' + d.slice(2);
  if (!d.startsWith('+')) d = '+241' + d;
  return /^\+\d{9,15}$/.test(d) ? d : null;
}

/** Étape 1 : envoi du code. En démonstration, le code est affiché à l'écran. */
export async function requestCode(rawPhone: string): Promise<{ phone: string; demoCode?: string }> {
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new Error('Numéro de téléphone invalide.');
  if (apiEnabled) { await requestOtp(phone); return { phone, demoCode: (await serverDemo()) ? DEMO_CODE : undefined }; }
  return { phone, demoCode: DEMO_CODE };
}

/** Étape 2 : vérification du code et ouverture de la session. */
export async function verifyCode(phone: string, code: string): Promise<Session> {
  if (apiEnabled) return verifyOtp(phone, code);
  const user = await db.users.where('phone').equals(phone).first();
  if (code !== DEMO_CODE) throw new Error('Code incorrect.');
  if (!user) throw new Error('Aucun compte actif pour ce numéro. Faites une demande d’accès.');
  if (!user.active) throw new Error('Ce compte est désactivé. Contactez l’administrateur.');
  await db.users.update(user.id, { lastLoginAt: new Date().toISOString() });
  const s: Session = { role: user.role as Role, userLabel: user.name, userId: user.id, operatorId: user.operatorId, farmId: user.farmId ?? user.farmIds?.[0], farmIds: user.farmIds };
  setSession(s);
  return s;
}

export function signOut() {
  if (apiEnabled) apiLogout();
  else setSession({ role: 'eleveur', userLabel: '' });
}

/** Demande d'accès publique, validée ensuite par l'administrateur. */
export async function submitAccessRequest(r: Omit<AccessRequest, 'id' | 'createdAt' | 'status'>) {
  const phone = normalizePhone(r.phone);
  if (!phone) throw new Error('Numéro de téléphone invalide.');
  if (!r.consent) throw new Error('Votre accord sur le traitement des données est nécessaire.');
  const req = { ...r, phone };
  if (apiEnabled) { await api('/access-requests', { method: 'POST', body: JSON.stringify(req) }); return; }
  await db.requests.put({ ...req, id: uid(), createdAt: new Date().toISOString(), status: 'en_attente' });
}
