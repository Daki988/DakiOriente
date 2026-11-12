import { setSession, type Session } from './sessionStore';
import type { Role } from '../domain/types';

import { setPublicKey } from '../domain/qr';

const TOKEN = 'origa.token';

/** Adresse du serveur national. Sans VITE_API_URL, l'application tourne en démonstration autonome. */
const sameOrigin = import.meta.env.VITE_API_SAME_ORIGIN === '1' && typeof location !== 'undefined'
  && /^https?:$/.test(location.protocol) && !['localhost', '127.0.0.1'].includes(location.hostname);
/** Sur le web publié, le serveur est à la même adresse que le site (/api) ; dans l'APK et sur iPhone, adresse fixe. */
export const API = sameOrigin ? `${location.origin}/api` : (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
/**
 * Serveur facultatif (VITE_API_OPTIONAL=1) : l'application démarre en démonstration autonome et bascule d'elle-même
 * sur le serveur dès qu'il répond « prêt ». Sans cette option, le serveur est obligatoire (exploitation).
 */
const OPTIONAL = !!API && import.meta.env.VITE_API_OPTIONAL === '1';
const MODE = 'origa.mode'; const KEY = 'origa.lotKey';
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } };

/** Vrai quand l'application travaille avec le serveur national (liaison vivante : mise à jour par `detectServer`). */
export let apiEnabled = !!API && (!OPTIONAL || read(MODE) === 'api');
if (apiEnabled && read(KEY)) setPublicKey(read(KEY)!);

async function probe<T>(path: string): Promise<T | null> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 4000);
  try { const r = await fetch(`${API}${path}`, { signal: ctl.signal }); return r.ok ? (await r.json()) as T : null; } catch { return null; } finally { clearTimeout(t); }
}

/**
 * À appeler au démarrage. Renvoie « upgraded » quand l'appareil passe de la démonstration au serveur : les données
 * fictives locales doivent alors être effacées. Le retour en démonstration n'est jamais automatique (une panne du
 * serveur ne doit pas faire perdre les saisies en attente d'envoi).
 */
export async function detectServer(): Promise<'api' | 'demo' | 'upgraded'> {
  if (!API) return 'demo';
  if (apiEnabled) {
    if (!read(KEY)) probe<{ publicKey: string }>('/public/key').then((k) => { if (k?.publicKey) { write(KEY, k.publicKey); setPublicKey(k.publicKey); } });
    return 'api';
  }
  const cfg = await probe<{ ready?: boolean }>('/public/config');
  if (!cfg?.ready) return 'demo';
  const k = await probe<{ publicKey: string }>('/public/key');
  if (!k?.publicKey) return 'demo';
  write(KEY, k.publicKey); setPublicKey(k.publicKey); write(MODE, 'api'); write('origa.upgraded', new Date().toISOString());
  for (const stale of ['origa.session', 'origa.cursor', 'origa.syncIssues', TOKEN]) { try { localStorage.removeItem(stale); } catch { /* ignore */ } }
  apiEnabled = true;
  return 'upgraded';
}

export const getToken = () => { try { return localStorage.getItem(TOKEN); } catch { return null; } };
const setToken = (t: string | null) => { try { if (t) localStorage.setItem(TOKEN, t); else localStorage.removeItem(TOKEN); } catch { /* ignore */ } };

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && token) logout();
  if (!res.ok) throw new ApiError(res.status, body.error ?? `Erreur ${res.status}`);
  return body as T;
}

const DEMO = 'origa.serverDemo';
/** Le serveur dit s'il accepte le code de démonstration (présentation sans passerelle SMS). */
export async function serverDemo(): Promise<boolean> {
  if (!apiEnabled) return false;
  try {
    const r = await fetch(`${API}/public/config`).then((x) => x.json() as Promise<{ demo?: boolean }>);
    localStorage.setItem(DEMO, r.demo ? '1' : '0');
    return !!r.demo;
  } catch { try { return localStorage.getItem(DEMO) === '1'; } catch { return false; } }
}

export const requestOtp = (phone: string) => api<{ sent: boolean; expiresIn: number }>('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) });

interface LoginUser { sub: number; role: Role; name: string; farmId?: string | null; farmIds?: string[]; operatorId?: string | null }

export async function verifyOtp(phone: string, code: string) {
  const r = await api<{ token: string; user: LoginUser }>('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, code }) });
  setToken(r.token);
  const s: Session = { role: r.user.role, userLabel: r.user.name, userId: String(r.user.sub), operatorId: r.user.operatorId ?? undefined, farmId: r.user.farmId ?? r.user.farmIds?.[0] ?? undefined, farmIds: r.user.farmIds };
  setSession(s);
  return s;
}

export function logout() {
  setToken(null);
  try { localStorage.removeItem('origa.cursor'); } catch { /* ignore */ }
  setSession({ role: 'eleveur', userLabel: '' });
}
