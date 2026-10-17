'use server';
import { RefusMetier, ServiceIndisponible, payerTresor } from '@/lib/api';
import { config } from '@/lib/config';
import type { PaiementTresorEnregistre } from '@/lib/types';

export type EtatTresor =
  | { ok: true; paiement: PaiementTresorEnregistre; numero: string; code: string; quittance: string }
  | { ok: false; erreurs?: Partial<Record<'numero' | 'code' | 'quittance', string>>; message?: string; valeurs: { numero: string; quittance: string } }
  | null;

const NUMERO = /^CJ-\d{4}-\d{6}$/;
const QUITTANCE = /^[A-Z0-9-]{6,30}$/;

/** Saisie de l'identifiant de paiement du Trésor : contrôles de forme ici, contrôle du dossier par le service. */
export async function enregistrerPaiementTresor(_: EtatTresor, f: FormData): Promise<EtatTresor> {
  const numero = String(f.get('numero') ?? '').trim().toUpperCase().slice(0, 20);
  const code = String(f.get('code') ?? '').replace(/\s/g, '').slice(0, 6);
  const quittance = String(f.get('quittance') ?? '').trim().toUpperCase().replace(/\s+/g, '').slice(0, 30);
  const erreurs: Partial<Record<'numero' | 'code' | 'quittance', string>> = {};
  if (!NUMERO.test(numero)) erreurs.numero = 'Le numéro de dossier a la forme CJ-2026-000123.';
  if (!/^\d{6}$/.test(code)) erreurs.code = 'Le code de suivi compte 6 chiffres.';
  if (!QUITTANCE.test(quittance)) erreurs.quittance = 'Saisissez l’identifiant de paiement tel qu’il figure sur la quittance du Trésor (6 à 30 lettres ou chiffres).';
  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs, valeurs: { numero, quittance } };
  try {
    const paiement = await payerTresor(numero, code, quittance);
    if (!paiement) return { ok: false, message: 'Numéro de dossier ou code de suivi incorrect. Vérifiez votre avis de paiement.', valeurs: { numero, quittance } };
    return { ok: true, paiement, numero, code, quittance };
  } catch (e) {
    if (e instanceof RefusMetier) return { ok: false, message: e.message, valeurs: { numero, quittance } };
    if (e instanceof ServiceIndisponible) {
      return { ok: false, message: `Le service est momentanément indisponible. Réessayez dans quelques minutes ou appelez le ${config.supportTelephone}.`, valeurs: { numero, quittance } };
    }
    throw e;
  }
}
