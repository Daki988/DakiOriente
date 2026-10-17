'use server';

import { RefusMetier, ServiceIndisponible, reclamer } from '@/lib/api';
import { config } from '@/lib/config';
import type { ObjetReclamation } from '@/lib/types';

export type EtatReclamation = {
  valeurs: Record<string, string>;
  erreurs?: Record<string, string>;
  message?: string;
  reference?: string;
  demo?: boolean;
};

const OBJETS: ObjetReclamation[] = ['SUIVI', 'PAIEMENT', 'CONTENU_CASIER', 'BULLETIN', 'AUTRE'];

/** Réclamation publique : validée côté serveur, messages qui disent quoi corriger (ERG-05). */
export async function reclamerAction(_precedent: EtatReclamation, f: FormData): Promise<EtatReclamation> {
  const v = (k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max);
  const valeurs = { objet: v('objet', 20), numeroDossier: v('numeroDossier', 20).toUpperCase(), nom: v('nom', 120),
    telephone: v('telephone', 20), email: v('email', 254), message: v('message', 3000) };
  const erreurs: Record<string, string> = {};
  if (!OBJETS.includes(valeurs.objet as ObjetReclamation)) erreurs.objet = 'Choisissez l’objet de votre réclamation.';
  if (valeurs.numeroDossier && !/^CJ-\d{4}-\d{6}$/.test(valeurs.numeroDossier)) erreurs.numeroDossier = 'Le numéro de dossier a la forme CJ-2026-000123, ou laissez ce champ vide.';
  if (valeurs.nom.length < 2) erreurs.nom = 'Saisissez votre nom et vos prénoms.';
  const tel = valeurs.telephone.replace(/[\s.-]/g, '');
  if (!tel && !valeurs.email) erreurs.telephone = 'Indiquez un téléphone ou une adresse e-mail pour recevoir la réponse.';
  if (tel && !/^\+?[0-9]{8,15}$/.test(tel)) erreurs.telephone = 'Saisissez un numéro de téléphone valide, par exemple +241 77 00 00 00.';
  if (valeurs.email && !/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(valeurs.email)) erreurs.email = 'L’adresse e-mail doit avoir la forme nom@exemple.ga.';
  if (valeurs.message.length < 20) erreurs.message = 'Décrivez votre demande en quelques phrases (20 caractères au moins).';
  if (Object.keys(erreurs).length > 0) return { valeurs, erreurs };

  try {
    const r = await reclamer({ objet: valeurs.objet as ObjetReclamation, numeroDossier: valeurs.numeroDossier || undefined, nom: valeurs.nom,
      telephone: tel || undefined, email: valeurs.email || undefined, message: valeurs.message });
    return { valeurs: {}, reference: r.reference, demo: r.demo };
  } catch (e) {
    if (e instanceof RefusMetier) return { valeurs, message: e.message };
    if (e instanceof ServiceIndisponible) return { valeurs, message: `Le service est momentanément indisponible. Réessayez plus tard ou appelez le ${config.supportTelephone}.` };
    throw e;
  }
}
