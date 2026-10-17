import 'server-only';

import { config } from './config';
import { deposerDemo, reclamerDemo, suiviDemo, tarifsDemo, verifierCodeDemo, verifierJetonDemo } from './demo';
import type { DemandeDeposee, NouvelleDemande, NouvelleReclamation, ReclamationDeposee, ResultatVerification, SuiviDemande, Tarif } from './types';

/** Le service ne répond pas : la page affiche un message clair, sans code technique (ERG-05, PUB-16). */
export class ServiceIndisponible extends Error {}

/** Refus métier du service (message destiné à l'usager). */
export class RefusMetier extends Error {}

async function appel<T>(chemin: string, init?: RequestInit): Promise<T | null> {
  let reponse: Response;
  try {
    reponse = await fetch(`${config.apiCasier}${chemin}`, {
      ...init,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init?.headers },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new ServiceIndisponible();
  }
  if (reponse.status === 404) return null;
  if (reponse.status === 429) throw new RefusMetier('Trop de demandes depuis votre connexion. Patientez une minute puis réessayez.');
  if (reponse.status === 422 || reponse.status === 409 || reponse.status === 403) {
    const corps = await reponse.json().catch(() => ({}));
    throw new RefusMetier(typeof corps.detail === 'string' ? corps.detail : 'Votre demande ne peut pas être traitée.');
  }
  if (!reponse.ok) throw new ServiceIndisponible();
  return (await reponse.json()) as T;
}

const reel = () => config.apiCasier !== '';

/** PUB-09 : tarifs lus dans le référentiel, jamais écrits dans le code. */
export async function tarifs(): Promise<Tarif[]> {
  return reel() ? (await appel<Tarif[]>('/api/public/v1/tarifs')) ?? [] : tarifsDemo();
}

/** BUL-06 : vérification par le jeton du QR code. */
export async function verifierJeton(jeton: string): Promise<ResultatVerification> {
  if (!reel()) return verifierJetonDemo(jeton);
  return (await appel<ResultatVerification>(`/api/public/v1/verifications/jeton/${encodeURIComponent(jeton)}`))!;
}

/** BUL-03 : vérification par le code court. */
export async function verifierCode(code: string): Promise<ResultatVerification> {
  if (!reel()) return verifierCodeDemo(code);
  return (await appel<ResultatVerification>('/api/public/v1/verifications/code', { method: 'POST', body: JSON.stringify({ code }) }))!;
}

/** PUB-07 : suivi avec le numéro de dossier et le code reçu par SMS. */
export async function suivre(numero: string, code: string): Promise<SuiviDemande | null> {
  if (!reel()) return suiviDemo(numero, code);
  const q = new URLSearchParams({ numero, code });
  return appel<SuiviDemande>(`/api/public/v1/suivi?${q}`);
}

/**
 * Dépôt d'une demande de bulletin n°3 (RG-01). Avec le service réel, la demande part avec le jeton OpenID Connect
 * de l'usager (connexion par l'identité numérique, à brancher au lot L1).
 */
export async function deposer(demande: NouvelleDemande, jetonUsager?: string): Promise<DemandeDeposee> {
  if (!reel()) {
    try {
      return deposerDemo(demande);
    } catch (e) {
      throw new RefusMetier((e as Error).message);
    }
  }
  if (!jetonUsager) throw new RefusMetier('Connectez-vous avec votre identité numérique pour déposer une demande.');
  const r = await appel<Omit<DemandeDeposee, 'demo'>>('/api/v1/demandes', {
    method: 'POST', body: JSON.stringify(demande), headers: { Authorization: `Bearer ${jetonUsager}` },
  });
  return { ...r!, demo: false };
}

/** Réclamation depuis le formulaire public (parcours « Réclamation », section 8 ; DSH-10). */
export async function reclamer(r: NouvelleReclamation): Promise<ReclamationDeposee> {
  if (!reel()) return reclamerDemo();
  const res = await appel<{ reference: string }>('/api/public/v1/reclamations', { method: 'POST', body: JSON.stringify(r) });
  if (!res) throw new ServiceIndisponible();
  return { reference: res.reference, demo: false };
}
