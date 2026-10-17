'use server';
import { donnerAvis } from '@/lib/api';
import type { ParcoursAvis } from '@/lib/types';

const PARCOURS: ParcoursAvis[] = ['DEMANDE', 'SUIVI', 'TRESOR', 'VERIFICATION'];

/** Avis de satisfaction anonyme : une note de 1 à 5, un commentaire facultatif. Une erreur n'empêche jamais le parcours. */
export async function envoyerAvis(_: 'envoye' | 'erreur' | null, f: FormData): Promise<'envoye' | 'erreur' | null> {
  const note = Number(f.get('note'));
  const parcours = String(f.get('parcours')) as ParcoursAvis;
  if (!Number.isInteger(note) || note < 1 || note > 5 || !PARCOURS.includes(parcours)) return 'erreur';
  const commentaire = String(f.get('commentaire') ?? '').trim().slice(0, 1000) || undefined;
  try {
    await donnerAvis(note, commentaire, parcours);
    return 'envoye';
  } catch {
    return 'erreur';
  }
}
