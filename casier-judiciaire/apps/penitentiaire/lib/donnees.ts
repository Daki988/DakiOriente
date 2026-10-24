import 'server-only';
import { redirect } from 'next/navigation';

import { config } from './config';
import { demo, ETABLISSEMENTS } from './demo';
import { jetonValide } from './oidc';
import { session, type Session } from './session';
import type { Detenu, Etablissement, MotifLiberation, Mouvement, NouvelEcrou, TableauDeBord, TitreDetention, TypeMouvement } from './types';

/** Le service ne répond pas : message clair, sans code technique. */
export class ServiceIndisponible extends Error {}
/** Refus métier (message destiné à l'agent). */
export class RefusMetier extends Error {}

export async function exigerSession(...roles: string[]): Promise<Session> {
  const s = await session();
  if (!s) redirect('/connexion?expiree=1');
  if (roles.length && !roles.some((r) => s.roles.includes(r))) redirect('/espace?refus=1');
  return s;
}

const reel = (s?: Session) => config.apiCasier !== '' && !(s?.demo ?? false);

async function appel<T>(s: Session | null, chemin: string, init?: RequestInit): Promise<T | null> {
  const jeton = s ? await jetonValide(s) : undefined;
  if (s && !jeton) redirect('/connexion?expiree=1');
  let r: Response;
  try {
    r = await fetch(`${config.apiCasier}${chemin}`, {
      ...init, cache: 'no-store', signal: AbortSignal.timeout(10_000),
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    });
  } catch {
    throw new ServiceIndisponible();
  }
  if (r.status === 401) redirect('/connexion?expiree=1');
  if (r.status === 404) return null;
  if ([403, 409, 422].includes(r.status)) {
    const corps = await r.json().catch(() => ({}));
    throw new RefusMetier(typeof corps.detail === 'string' ? corps.detail : 'Cette action n’est pas possible.');
  }
  if (!r.ok) throw new ServiceIndisponible();
  return r.status === 204 ? null : ((await r.json()) as T);
}

/** Erreur de la démonstration convertie en refus métier, comme une réponse 422 du service. */
function verifier(erreur: string | null) {
  if (erreur) throw new RefusMetier(erreur);
}
const poster = (corps: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(corps) });

/**
 * Données pénitentiaires : service métier avec le jeton de l'agent, ou registre fictif de démonstration.
 * Les habilitations sont appliquées par le service ; le site ne fait que masquer les actions inutiles.
 */
export const donnees = {
  async etablissements(): Promise<Etablissement[]> {
    if (!reel()) return ETABLISSEMENTS;
    try {
      return (await appel<Etablissement[]>(null, '/api/public/v1/penitentiaire/etablissements')) ?? ETABLISSEMENTS;
    } catch {
      return ETABLISSEMENTS;
    }
  },
  async tableauDeBord(s: Session): Promise<TableauDeBord> {
    return reel(s) ? (await appel<TableauDeBord>(s, '/api/v1/penitentiaire/tableau-de-bord'))! : demo.tableauDeBord(s);
  },
  async registre(s: Session, recherche: string, avecLiberes: boolean): Promise<Detenu[]> {
    if (!reel(s)) return demo.registre(s, recherche, avecLiberes);
    const q = new URLSearchParams({ recherche, avecLiberes: String(avecLiberes) });
    return (await appel<Detenu[]>(s, `/api/v1/penitentiaire/detenus?${q}`)) ?? [];
  },
  async fiche(s: Session, id: string): Promise<{ detenu: Detenu; mouvements: Mouvement[] } | null> {
    if (!reel(s)) return demo.fiche(s, id);
    return appel(s, `/api/v1/penitentiaire/detenus/${encodeURIComponent(id)}`);
  },
  async ecrouer(s: Session, e: NouvelEcrou): Promise<Detenu> {
    if (reel(s)) return (await appel<Detenu>(s, '/api/v1/penitentiaire/detenus', poster(e)))!;
    const r = demo.ecrouer(s, e);
    if (typeof r === 'string') throw new RefusMetier(r);
    return r;
  },
  async condamner(s: Session, id: string, titre: TitreDetention, reference: string, juridiction: string, dateDebutPeine: string | null, dureePeineMois: number) {
    if (reel(s)) await appel(s, `/api/v1/penitentiaire/detenus/${encodeURIComponent(id)}/condamnation`, poster({ titre, reference, juridiction, dateDebutPeine, dureePeineMois }));
    else verifier(demo.condamner(s, id, titre, reference, juridiction, dateDebutPeine, dureePeineMois));
  },
  async liberer(s: Session, id: string, motif: MotifLiberation, precision: string | null) {
    if (reel(s)) await appel(s, `/api/v1/penitentiaire/detenus/${encodeURIComponent(id)}/liberation`, poster({ motif, date: null, precision }));
    else verifier(demo.liberer(s, id, motif, precision));
  },
  async mouvements(s: Session): Promise<Mouvement[]> {
    return reel(s) ? (await appel<Mouvement[]>(s, '/api/v1/penitentiaire/mouvements')) ?? [] : demo.mouvements(s);
  },
  async demanderMouvement(s: Session, id: string, type: TypeMouvement, destination: string, motif: string, prevuLe: string, retourPrevu: string | null) {
    if (reel(s)) await appel(s, `/api/v1/penitentiaire/detenus/${encodeURIComponent(id)}/mouvements`, poster({ type, destination, motif, prevuLe, retourPrevu }));
    else verifier(demo.demanderMouvement(s, id, type, destination, motif, prevuLe, retourPrevu));
  },
  async decider(s: Session, id: string, autoriser: boolean, observation: string | null) {
    if (reel(s)) await appel(s, `/api/v1/penitentiaire/mouvements/${encodeURIComponent(id)}/decision`, poster({ autoriser, observation }));
    else verifier(demo.decider(s, id, autoriser, observation));
  },
  async executer(s: Session, id: string, etape: 'DEPART' | 'RETOUR' | 'ANNULATION') {
    if (reel(s)) await appel(s, `/api/v1/penitentiaire/mouvements/${encodeURIComponent(id)}/execution`, poster({ etape }));
    else verifier(demo.executer(s, id, etape));
  },
};

export const nomEtablissement = (code: string) => ETABLISSEMENTS.find((e) => e.code === code)?.nom ?? code;
