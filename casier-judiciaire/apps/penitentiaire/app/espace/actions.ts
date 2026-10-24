'use server';
import { redirect } from 'next/navigation';

import { donnees, exigerSession, RefusMetier, ServiceIndisponible } from '@/lib/donnees';
import { poserFlash, type Session } from '@/lib/session';
import type { MotifLiberation, TitreDetention, TypeMouvement } from '@/lib/types';

const TITRES: TitreDetention[] = ['MANDAT_DEPOT', 'JUGEMENT', 'ARRET', 'CONTRAINTE'];
const TYPES: TypeMouvement[] = ['TRANSFERT', 'EXTRACTION_JUDICIAIRE', 'EXTRACTION_MEDICALE', 'PERMISSION'];
const MOTIFS: MotifLiberation[] = ['FIN_DE_PEINE', 'MAINLEVEE_MANDAT', 'ACQUITTEMENT_RELAXE', 'LIBERTE_CONDITIONNELLE', 'GRACE', 'AUTRE'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Texte obligatoire, nettoyé et borné (les contrôles métier restent faits par le service). */
function texte(f: FormData, cle: string, max = 300): string {
  const v = String(f.get(cle) ?? '').trim().slice(0, max);
  if (!v) throw new RefusMetier('Complétez tous les champs obligatoires.');
  return v;
}
const facultatif = (f: FormData, cle: string, max = 300) => String(f.get(cle) ?? '').trim().slice(0, max) || null;
function parmi<T extends string>(f: FormData, cle: string, valeurs: T[]): T {
  const v = String(f.get(cle) ?? '') as T;
  if (!valeurs.includes(v)) throw new RefusMetier('Choix invalide.');
  return v;
}
function date(f: FormData, cle: string, requis: boolean): string | null {
  const v = facultatif(f, cle, 10);
  if (!v) { if (requis) throw new RefusMetier('Complétez tous les champs obligatoires.'); return null; }
  if (!DATE.test(v)) throw new RefusMetier('Date invalide.');
  return v;
}
/** Heure saisie à Libreville (UTC+1, sans heure d'été), transmise en instant ISO. */
function instant(f: FormData, cle: string): string | null {
  const v = facultatif(f, cle, 16);
  if (!v) return null;
  const d = new Date(`${v}:00+01:00`);
  if (Number.isNaN(d.getTime())) throw new RefusMetier('Date et heure invalides.');
  return d.toISOString();
}

/** Exécute une action et laisse un message unique à afficher sur la page de retour. */
async function agir(roles: string[], retour: string, succes: string, action: (s: Session) => Promise<unknown>) {
  const s = await exigerSession(...roles);
  try {
    await action(s);
    await poserFlash({ type: 'succes', texte: succes });
  } catch (e) {
    if (e instanceof RefusMetier) await poserFlash({ type: 'erreur', texte: e.message });
    else if (e instanceof ServiceIndisponible) await poserFlash({ type: 'erreur', texte: 'Le service est momentanément indisponible. Réessayez dans quelques minutes.' });
    else throw e;
  }
  redirect(retour);
}

export async function ecrouer(f: FormData) {
  const s = await exigerSession('R16');
  let id: string | null = null;
  try {
    const titre = parmi(f, 'titreDetention', TITRES);
    const duree = Number(f.get('dureePeineMois') || 0);
    const d = await donnees.ecrouer(s, {
      nom: texte(f, 'nom', 100).toUpperCase(), prenoms: texte(f, 'prenoms', 150), dateNaissance: date(f, 'dateNaissance', true)!,
      lieuNaissance: texte(f, 'lieuNaissance', 100), nationalite: facultatif(f, 'nationalite', 60) ?? 'Gabonaise', quartier: facultatif(f, 'quartier', 60),
      titreDetention: titre, referenceTitre: texte(f, 'referenceTitre', 60), juridiction: texte(f, 'juridiction', 150), infraction: texte(f, 'infraction', 300),
      dateEcrou: date(f, 'dateEcrou', false) ?? new Date().toLocaleDateString('sv-SE', { timeZone: 'Africa/Libreville' }),
      dateDebutPeine: titre === 'MANDAT_DEPOT' ? null : date(f, 'dateDebutPeine', false), dureePeineMois: titre === 'MANDAT_DEPOT' ? null : duree || null,
    });
    id = d.id;
    await poserFlash({ type: 'succes', texte: `Écrou enregistré sous le numéro ${d.numeroEcrou}.` });
  } catch (e) {
    if (e instanceof RefusMetier) await poserFlash({ type: 'erreur', texte: e.message });
    else if (e instanceof ServiceIndisponible) await poserFlash({ type: 'erreur', texte: 'Le service est momentanément indisponible. Réessayez dans quelques minutes.' });
    else throw e;
  }
  redirect(id ? `/espace/detenus/${id}` : '/espace/ecrou');
}

export async function condamner(f: FormData) {
  const id = texte(f, 'id', 64);
  await agir(['R16'], `/espace/detenus/${id}`, 'Condamnation enregistrée : la date de libération prévue est calculée.', (s) =>
    donnees.condamner(s, id, parmi(f, 'titre', TITRES), texte(f, 'reference', 60), texte(f, 'juridiction', 150), date(f, 'dateDebutPeine', false),
      Number(f.get('dureePeineMois') || 0)));
}

export async function demanderMouvement(f: FormData) {
  const id = texte(f, 'id', 64);
  await agir(['R16'], `/espace/detenus/${id}`, 'Mouvement demandé : il attend l’autorisation du chef d’établissement.', (s) => {
    const type = parmi(f, 'type', TYPES);
    const destination = type === 'TRANSFERT' ? texte(f, 'etablissementDestination', 20) : texte(f, 'destination', 150);
    const prevuLe = instant(f, 'prevuLe');
    if (!prevuLe) throw new RefusMetier('Indiquez la date et l’heure du départ.');
    return donnees.demanderMouvement(s, id, type, destination, texte(f, 'motif', 300), prevuLe, type === 'TRANSFERT' ? null : instant(f, 'retourPrevu'));
  });
}

export async function liberer(f: FormData) {
  const id = texte(f, 'id', 64);
  await agir(['R17'], `/espace/detenus/${id}`, 'Libération enregistrée : l’écrou est levé.', (s) =>
    donnees.liberer(s, id, parmi(f, 'motif', MOTIFS), facultatif(f, 'precision', 300)));
}

export async function decider(f: FormData) {
  const autoriser = f.get('decision') === 'autoriser';
  await agir(['R17'], '/espace/mouvements', autoriser ? 'Mouvement autorisé.' : 'Mouvement refusé.', (s) =>
    donnees.decider(s, texte(f, 'id', 64), autoriser, facultatif(f, 'observation', 300)));
}

export async function executer(f: FormData) {
  const etape = parmi(f, 'etape', ['DEPART', 'RETOUR', 'ANNULATION'] as ('DEPART' | 'RETOUR' | 'ANNULATION')[]);
  const messages = { DEPART: 'Départ enregistré.', RETOUR: 'Retour enregistré : le mouvement est terminé.', ANNULATION: 'Mouvement annulé.' };
  await agir(['R16'], '/espace/mouvements', messages[etape], (s) => donnees.executer(s, texte(f, 'id', 64), etape));
}
