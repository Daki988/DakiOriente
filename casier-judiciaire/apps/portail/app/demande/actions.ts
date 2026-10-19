'use server';

import { RefusMetier, ServiceIndisponible, deposer } from '@/lib/api';
import { config } from '@/lib/config';
import { jetonValide } from '@/lib/oidc';
import { session } from '@/lib/session';
import type { DemandeDeposee } from '@/lib/types';
import { neAilleurs, normaliserDate, verifierTout, type DonneesDemande, type Erreurs } from '@/lib/validation';

export type ResultatDepot =
  | { ok: true; depot: DemandeDeposee }
  | { ok: false; erreurs?: Erreurs; message?: string };

const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Dépôt d'une demande de bulletin n°3 (PUB-06, RG-01). Les données reçues sont revalidées ici : le navigateur n'est jamais cru.
 * En démonstration, le paiement passe par le simulateur (PAY-07) ; sinon, confirmation par l'opérateur uniquement (PAY-02).
 */
export async function deposerAction(brut: DonneesDemande): Promise<ResultatDepot> {
  const d: DonneesDemande = {
    profil: texte(brut?.profil, 40) as DonneesDemande['profil'],
    nom: texte(brut?.nom, 80), prenoms: texte(brut?.prenoms, 80), dateNaissance: texte(brut?.dateNaissance, 10),
    lieuNaissance: texte(brut?.lieuNaissance, 100), paysNaissance: texte(brut?.paysNaissance, 80),
    nomPere: texte(brut?.nomPere, 80), nomMere: texte(brut?.nomMere, 80), nationalite: texte(brut?.nationalite, 80),
    numeroCnie: texte(brut?.numeroCnie, 20), numeroPasseport: texte(brut?.numeroPasseport, 20),
    telephone: texte(brut?.telephone, 20), email: texte(brut?.email, 254),
    consentement: brut?.consentement === true, modePaiement: texte(brut?.modePaiement, 20) as DonneesDemande['modePaiement'],
  };
  const erreurs = verifierTout(d);
  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs };

  const facultatif = (v: string) => v || undefined;
  const s = await session();
  const jeton = s && !s.demo ? await jetonValide(s) : undefined;
  try {
    const depot = await deposer({
      profil: d.profil,
      identite: {
        nom: d.nom.toUpperCase(), prenoms: d.prenoms, dateNaissance: normaliserDate(d.dateNaissance)!, lieuNaissance: d.lieuNaissance,
        paysNaissance: neAilleurs(d.profil) ? d.paysNaissance : 'Gabon', nomPere: facultatif(d.nomPere), nomMere: facultatif(d.nomMere),
        nationalite: d.profil === 'ETRANGER_RESIDENT' ? d.nationalite : 'Gabonaise',
        numeroCnie: d.profil === 'ETRANGER_RESIDENT' ? undefined : facultatif(d.numeroCnie),
        numeroPasseport: d.profil === 'ETRANGER_RESIDENT' ? d.numeroPasseport : undefined,
      },
      telephone: d.telephone.replace(/[\s.-]/g, ''), email: facultatif(d.email),
      paiementTresor: d.modePaiement === 'TRESOR',
    }, jeton);
    return { ok: true, depot };
  } catch (e) {
    if (e instanceof RefusMetier) return { ok: false, message: e.message };
    if (e instanceof ServiceIndisponible) {
      return { ok: false, message: `Le service est momentanément indisponible. Votre saisie est conservée : réessayez dans quelques minutes ou appelez le ${config.supportTelephone}.` };
    }
    throw e;
  }
}
