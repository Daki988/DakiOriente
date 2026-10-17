'use server';
import { RefusMetier, ServiceIndisponible, verifierDocument } from '@/lib/api';
import type { ResultatVerification } from '@/lib/types';

export type EtatDocument = { integre: boolean; resultat: ResultatVerification } | { erreur: string } | null;

/** BUL-08 : le vérificateur dépose le PDF reçu ; sceau et intégrité contrôlés, fichier jamais conservé. */
export async function controlerDocument(_: EtatDocument, f: FormData): Promise<EtatDocument> {
  const fichier = f.get('fichier');
  if (!(fichier instanceof Blob) || fichier.size === 0) return { erreur: 'Choisissez le fichier PDF du bulletin.' };
  if (fichier.size > 5 * 1024 * 1024) return { erreur: 'Le fichier dépasse 5 Mo : ce n’est pas un bulletin émis par le casier.' };
  const debut = Buffer.from(await fichier.slice(0, 5).arrayBuffer()).toString('latin1');
  if (debut !== '%PDF-') return { erreur: 'Le fichier n’est pas un PDF. Déposez le bulletin tel que vous l’avez reçu.' };
  try {
    return await verifierDocument(fichier);
  } catch (e) {
    if (e instanceof RefusMetier) return { erreur: e.message };
    if (e instanceof ServiceIndisponible) return { erreur: 'La vérification est momentanément indisponible. Réessayez dans quelques minutes.' };
    throw e;
  }
}
