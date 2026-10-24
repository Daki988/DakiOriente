import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

import { config } from './config';
import type { Session } from './session';

/**
 * Connexion OpenID Connect (section 18) : flux « code d'autorisation » avec PKCE S256, état et nonce à usage unique.
 * Le jeton est obtenu par le serveur du site auprès de Keycloak (canal direct TLS, OIDC Core 3.1.3.7 §6).
 */
export const oidc = {
  emetteur: (process.env.OIDC_EMETTEUR ?? '').replace(/\/+$/, ''),
  client: process.env.OIDC_CLIENT ?? 'penitentiaire',
  portail: (process.env.PORTAIL_URL ?? 'http://localhost:3200').replace(/\/+$/, ''),
};

/** Connexion réelle seulement si le service et le fournisseur d'identité sont configurés ; sinon comptes de démonstration. */
export const connexionReelle = () => oidc.emetteur !== '' && config.apiCasier !== '';

type Attente = { verifieur: string; nonce: string; retour: string; cree: number };
const attentes: Map<string, Attente> = ((globalThis as { __penOidc?: Map<string, Attente> }).__penOidc ??= new Map());

const b64 = (b: Buffer) => b.toString('base64url');

export function urlAutorisation(retour: string) {
  for (const [k, v] of attentes) if (Date.now() - v.cree > 10 * 60_000) attentes.delete(k);
  const etat = b64(randomBytes(24));
  const verifieur = b64(randomBytes(48));
  const nonce = b64(randomBytes(24));
  attentes.set(etat, { verifieur, nonce, retour, cree: Date.now() });
  const q = new URLSearchParams({
    client_id: oidc.client, response_type: 'code', scope: 'openid profile', redirect_uri: `${oidc.portail}/auth/rappel`,
    state: etat, nonce, code_challenge: b64(createHash('sha256').update(verifieur).digest()), code_challenge_method: 'S256',
    ui_locales: 'fr',
  });
  return { url: `${oidc.emetteur}/protocol/openid-connect/auth?${q}`, etat };
}

function charge(jeton: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(jeton.split('.')[1] ?? '', 'base64url').toString('utf8'));
}

/** Échange du code contre les jetons, contrôles de l'émetteur, du destinataire, de l'expiration et du nonce. */
export async function echanger(code: string, etat: string): Promise<{ session: Omit<Session, 'creeLe' | 'vuLe'>; retour: string }> {
  const a = attentes.get(etat);
  attentes.delete(etat);
  if (!a) throw new Error('État inconnu ou expiré');
  const reponse = await fetch(`${oidc.emetteur}/protocol/openid-connect/token`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: `${oidc.portail}/auth/rappel`,
      client_id: oidc.client, code_verifier: a.verifieur }),
  });
  if (!reponse.ok) throw new Error('Échange du code refusé');
  const j = (await reponse.json()) as { access_token: string; refresh_token?: string; id_token: string; expires_in: number };
  const id = charge(j.id_token);
  const aud = Array.isArray(id.aud) ? id.aud : [id.aud];
  if (id.iss !== oidc.emetteur || !aud.includes(oidc.client) || id.nonce !== a.nonce || Number(id.exp) * 1000 < Date.now()) {
    throw new Error('Jeton d’identité invalide');
  }
  const acces = charge(j.access_token);
  const roles = ((acces.realm_access as { roles?: string[] } | undefined)?.roles ?? []).filter((r) => /^R\d\d$/.test(r));
  return {
    retour: a.retour,
    session: {
      sujet: String(acces.sub), nom: String(acces.name ?? acces.preferred_username ?? 'Utilisateur'), roles,
      juridiction: acces.juridiction as string | undefined, organisme: acces.organisme as string | undefined,
      jetonAcces: j.access_token, jetonRafraichissement: j.refresh_token, jetonId: j.id_token,
      expireAcces: Date.now() + j.expires_in * 1000, demo: false,
    },
  };
}

/** Renouvelle le jeton d'accès une minute avant son expiration (accès court, 5 minutes). */
export async function jetonValide(s: Session): Promise<string | undefined> {
  if (s.demo || !s.jetonAcces) return undefined;
  if (s.expireAcces && s.expireAcces - Date.now() > 60_000) return s.jetonAcces;
  if (!s.jetonRafraichissement) return undefined;
  const r = await fetch(`${oidc.emetteur}/protocol/openid-connect/token`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: s.jetonRafraichissement, client_id: oidc.client }),
  });
  if (!r.ok) return undefined;
  const j = (await r.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  s.jetonAcces = j.access_token;
  s.jetonRafraichissement = j.refresh_token ?? s.jetonRafraichissement;
  s.expireAcces = Date.now() + j.expires_in * 1000;
  return s.jetonAcces;
}

export function urlDeconnexion(jetonId?: string) {
  const q = new URLSearchParams({ client_id: oidc.client, post_logout_redirect_uri: `${oidc.portail}/` });
  if (jetonId) q.set('id_token_hint', jetonId);
  return `${oidc.emetteur}/protocol/openid-connect/logout?${q}`;
}
