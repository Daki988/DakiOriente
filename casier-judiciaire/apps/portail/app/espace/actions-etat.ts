'use server';
import { RefusMetier, ServiceIndisponible } from '@/lib/api';
import { espaces, exigerSession } from '@/lib/espaces';
import type { CompteCree, ResultatRapprochement } from '@/lib/types';

/** Actions dont le résultat s'affiche dans la page (le mot de passe provisoire ne transite jamais par un cookie). */
type Etat<T> = { ok: true; resultat: T } | { ok: false; erreur: string } | null;
export type EtatCreationAgent = Etat<CompteCree>;
export type EtatRapprochement = Etat<ResultatRapprochement>;

async function capturer<T>(action: () => Promise<T>): Promise<Etat<T>> {
  try {
    return { ok: true, resultat: await action() };
  } catch (e) {
    if (e instanceof RefusMetier) return { ok: false, erreur: e.message };
    if (e instanceof ServiceIndisponible) return { ok: false, erreur: 'Le service est momentanément indisponible. Réessayez dans quelques minutes.' };
    throw e;
  }
}

const champ = (f: FormData, cle: string, max: number) => String(f.get(cle) ?? '').trim().slice(0, max);

export async function creerAgent(_: EtatCreationAgent, f: FormData): Promise<EtatCreationAgent> {
  const s = await exigerSession('R13');
  const a = { login: champ(f, 'login', 50), prenom: champ(f, 'prenom', 80), nom: champ(f, 'nom', 80), email: champ(f, 'email', 120),
    role: champ(f, 'role', 5), juridiction: champ(f, 'juridiction', 40) || null };
  if (!a.login || !a.prenom || !a.nom || !a.email || !a.role) return { ok: false, erreur: 'Complétez tous les champs obligatoires.' };
  return capturer(() => espaces.creerAgent(s, a));
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function rapprocher(_: EtatRapprochement, f: FormData): Promise<EtatRapprochement> {
  const s = await exigerSession('R10');
  const du = champ(f, 'du', 10);
  const au = champ(f, 'au', 10);
  if (!DATE.test(du) || !DATE.test(au) || au < du) return { ok: false, erreur: 'La période est invalide.' };
  let releve = champ(f, 'releve', 500_000);
  const fichier = f.get('fichier');
  if (fichier instanceof File && fichier.size > 0) {
    if (fichier.size > 2 * 1024 * 1024) return { ok: false, erreur: 'Le relevé dépasse 2 Mo.' };
    releve = await fichier.text();
  }
  if (!releve) return { ok: false, erreur: 'Collez le relevé ou choisissez son fichier CSV.' };
  return capturer(() => espaces.rapprocher(s, du, au, releve));
}
