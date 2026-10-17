'use server';

import { RefusMetier, ServiceIndisponible, suivre } from '@/lib/api';
import { config } from '@/lib/config';
import type { SuiviDemande } from '@/lib/types';

export type EtatSuivi = {
  numero: string; code: string;
  erreurs?: { numero?: string; code?: string };
  message?: { type: 'erreur' | 'avertissement'; titre: string; texte: string };
  suivi?: SuiviDemande;
};

/**
 * PUB-07 : suivi avec le numéro de dossier et le code reçu par SMS. Envoi en POST (le code ne figure pas dans l'adresse) ;
 * le service limite les essais (BUL-09) et ne dit pas lequel des deux champs est faux.
 */
export async function suivreAction(_precedent: EtatSuivi, formulaire: FormData): Promise<EtatSuivi> {
  const numero = String(formulaire.get('numero') ?? '').trim().toUpperCase().slice(0, 20);
  const code = String(formulaire.get('code') ?? '').replace(/\s/g, '').slice(0, 10);
  const erreurs: EtatSuivi['erreurs'] = {};
  if (!/^CJ-\d{4}-\d{6}$/.test(numero)) erreurs.numero = 'Saisissez le numéro de dossier au format CJ-2026-000123, tel qu’il figure sur votre reçu.';
  if (!/^\d{6}$/.test(code)) erreurs.code = 'Saisissez les 6 chiffres du code reçu par SMS.';
  if (erreurs.numero || erreurs.code) return { numero, code: '', erreurs };

  try {
    const suivi = await suivre(numero, code);
    if (!suivi) {
      return { numero, code: '', message: { type: 'erreur', titre: 'Aucune demande ne correspond',
        texte: 'Vérifiez le numéro de dossier et le code reçu par SMS. Après plusieurs essais infructueux, le suivi est bloqué quelques minutes.' } };
    }
    return { numero, code: '', suivi };
  } catch (e) {
    if (e instanceof RefusMetier) return { numero, code: '', message: { type: 'avertissement', titre: 'Suivi momentanément bloqué', texte: e.message } };
    if (e instanceof ServiceIndisponible) {
      return { numero, code: '', message: { type: 'erreur', titre: 'Le suivi est momentanément indisponible',
        texte: `Réessayez dans quelques minutes. Si le problème persiste, appelez le ${config.supportTelephone}.` } };
    }
    throw e;
  }
}
