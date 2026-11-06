import { setSession, type Session } from './sessionStore';
import type { Role } from '../domain/types';

/** Serveur national. Sans VITE_API_URL, l'application tourne en démonstration autonome. */
export const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
export const apiEnabled = !!API;

const TOKEN = 'origa.token';
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
