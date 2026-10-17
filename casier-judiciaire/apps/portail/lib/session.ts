import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Session de l'espace connecté, conservée côté serveur (SEC-01) : le navigateur ne reçoit qu'un identifiant aléatoire
 * dans un cookie httpOnly. Expiration après 15 minutes d'inactivité (aligné sur Keycloak), 8 heures au plus.
 * Mémoire du processus : une instance unique (cPanel, serveur) ; un stockage partagé sera nécessaire en grappe.
 */
export type Session = {
  sujet: string; nom: string; roles: string[]; juridiction?: string; organisme?: string;
  jetonAcces?: string; jetonRafraichissement?: string; jetonId?: string; expireAcces?: number;
  demo: boolean; creeLe: number; vuLe: number;
  /** Message à afficher une fois après une action (succès ou refus), conservé côté serveur. */
  flash?: { type: 'succes' | 'erreur'; texte: string };
};

export const COOKIE = 'cj_session';
const INACTIVITE_MS = 15 * 60_000;
const DUREE_MAX_MS = 8 * 3600_000;

const magasin: Map<string, Session> = ((globalThis as { __cjSessions?: Map<string, Session> }).__cjSessions ??= new Map());

function purger(maintenant: number) {
  for (const [id, s] of magasin) {
    if (maintenant - s.vuLe > INACTIVITE_MS || maintenant - s.creeLe > DUREE_MAX_MS) magasin.delete(id);
  }
}

export async function ouvrirSession(s: Omit<Session, 'creeLe' | 'vuLe'>) {
  const maintenant = Date.now();
  purger(maintenant);
  const id = randomBytes(32).toString('base64url');
  magasin.set(id, { ...s, creeLe: maintenant, vuLe: maintenant });
  (await cookies()).set(COOKIE, id, {
    httpOnly: true, sameSite: 'lax', path: '/', secure: process.env.NODE_ENV === 'production', maxAge: DUREE_MAX_MS / 1000,
  });
}

export async function session(): Promise<Session | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const s = magasin.get(id);
  const maintenant = Date.now();
  if (!s || maintenant - s.vuLe > INACTIVITE_MS || maintenant - s.creeLe > DUREE_MAX_MS) {
    magasin.delete(id);
    return null;
  }
  s.vuLe = maintenant;
  return s;
}

export async function fermerSession(): Promise<Session | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  const s = id ? magasin.get(id) ?? null : null;
  if (id) magasin.delete(id);
  jar.delete(COOKIE);
  return s;
}

export const aLeRole = (s: Session | null, ...roles: string[]) => !!s && roles.some((r) => s.roles.includes(r));

/** Lit et efface le message de la dernière action. */
export function lireFlash(s: Session) {
  const f = s.flash;
  s.flash = undefined;
  return f;
}
