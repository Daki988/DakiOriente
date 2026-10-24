import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

import { connexionReelle } from './oidc';
import { PROFILS_DEMO } from './profils-demo';

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

export const COOKIE = 'pen_session';
/** Session de démonstration : le cookie ne porte que le profil fictif choisi (aucun droit au-delà du bouton public). */
const COOKIE_DEMO = 'pen_demo';
const COOKIE_FLASH = 'pen_flash';
const INACTIVITE_MS = 15 * 60_000;
const DUREE_MAX_MS = 8 * 3600_000;

const magasin: Map<string, Session> = ((globalThis as { __penSessions?: Map<string, Session> }).__penSessions ??= new Map());

function purger(maintenant: number) {
  for (const [id, s] of magasin) {
    if (maintenant - s.vuLe > INACTIVITE_MS || maintenant - s.creeLe > DUREE_MAX_MS) magasin.delete(id);
  }
}

const options = (maxAge: number) => ({ httpOnly: true, sameSite: 'lax' as const, path: '/', secure: process.env.NODE_ENV === 'production', maxAge });

/** Session de démonstration sans état serveur : fonctionne aussi sur plusieurs instances (hébergement sans serveur). */
function sessionDemo(valeur: string | undefined): Session | null {
  if (connexionReelle() || process.env.COMPTES_DEMO !== 'true') return null; // en production, seules les sessions OpenID Connect sont admises
  const [id, cree] = (valeur ?? '').split('.');
  const p = PROFILS_DEMO.find((x) => x.id === id);
  const creeLe = Number(cree);
  if (!p || !creeLe || Date.now() - creeLe > DUREE_MAX_MS) return null;
  return { sujet: p.sujet, nom: p.nom, roles: [...p.roles], juridiction: 'juridiction' in p ? p.juridiction : undefined, demo: true, creeLe, vuLe: Date.now() };
}

export async function ouvrirSessionDemo(profil: string) {
  (await cookies()).set(COOKIE_DEMO, `${profil}.${Date.now()}`, options(DUREE_MAX_MS / 1000));
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
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return sessionDemo(jar.get(COOKIE_DEMO)?.value);
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
  jar.delete(COOKIE_DEMO);
  return s;
}

export const aLeRole = (s: Session | null, ...roles: string[]) => !!s && roles.some((r) => s.roles.includes(r));

/** Message de la dernière action, conservé quelques secondes dans un cookie (affiché sur la page de retour). */
export async function poserFlash(f: NonNullable<Session['flash']>) {
  (await cookies()).set(COOKIE_FLASH, encodeURIComponent(JSON.stringify(f)), options(15));
}

export async function lireFlash(): Promise<Session['flash']> {
  const v = (await cookies()).get(COOKIE_FLASH)?.value;
  if (!v) return undefined;
  try {
    const f = JSON.parse(decodeURIComponent(v));
    return (f.type === 'succes' || f.type === 'erreur') && typeof f.texte === 'string' ? { type: f.type, texte: f.texte.slice(0, 500) } : undefined;
  } catch {
    return undefined;
  }
}
