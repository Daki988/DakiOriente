'use server';
import { RefusMetier, ServiceIndisponible, deposerPreplainte } from '@/lib/api';
import { SERVICES_PREPLAINTE } from '@/lib/preplainte';
import type { NaturePreplainte, NouvellePreplainte, PreplainteDeposee } from '@/lib/types';

export type EtatPreplainte = { ok: true; recu: PreplainteDeposee } | { ok: false; erreur: string } | null;

const NATURES: NaturePreplainte[] = ['VOL', 'CAMBRIOLAGE', 'VOL_VEHICULE', 'DEGRADATION', 'ESCROQUERIE', 'AUTRE_ATTEINTE_BIENS'];
const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const facultatif = (v: unknown, max: number) => texte(v, max) || null;

/** Dépôt d'une pré-plainte : contrôle de forme ici, contrôles métier par le service. */
export async function envoyerPreplainte(_: EtatPreplainte, f: FormData): Promise<EtatPreplainte> {
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(String(f.get('donnees') ?? '{}'));
  } catch {
    return { ok: false, erreur: 'Formulaire illisible. Rechargez la page.' };
  }
  const declarant = (d.declarant ?? {}) as Record<string, unknown>;
  const nature = texte(d.nature, 30) as NaturePreplainte;
  const service = texte(d.service, 120);
  if (!NATURES.includes(nature)) return { ok: false, erreur: 'Choisissez la nature des faits.' };
  if (!SERVICES_PREPLAINTE.includes(service)) return { ok: false, erreur: 'Choisissez le service où vous signerez votre plainte.' };
  if (d.attestation !== true) return { ok: false, erreur: 'Cochez l’attestation pour envoyer votre pré-plainte.' };
  const prejudice = d.prejudiceFcfa === '' || d.prejudiceFcfa == null ? null : Number(d.prejudiceFcfa);
  const p: NouvellePreplainte = {
    nature, dateFaits: texte(d.dateFaits, 10), heureFaits: facultatif(d.heureFaits, 40), ville: texte(d.ville, 80), lieu: texte(d.lieu, 200),
    description: texte(d.description, 4000), auteurConnu: d.auteurConnu === true, auteurInfos: d.auteurConnu === true ? facultatif(d.auteurInfos, 1000) : null,
    biens: facultatif(d.biens, 1000), prejudiceFcfa: prejudice !== null && Number.isFinite(prejudice) ? Math.max(0, Math.round(prejudice)) : null,
    declarant: { nom: texte(declarant.nom, 80), prenoms: texte(declarant.prenoms, 120), dateNaissance: texte(declarant.dateNaissance, 10),
      telephone: texte(declarant.telephone, 30), email: facultatif(declarant.email, 120), adresse: facultatif(declarant.adresse, 200),
      entreprise: facultatif(declarant.entreprise, 120) },
    service,
  };
  try {
    return { ok: true, recu: await deposerPreplainte(p) };
  } catch (e) {
    if (e instanceof RefusMetier) return { ok: false, erreur: e.message };
    if (e instanceof ServiceIndisponible) return { ok: false, erreur: 'Le service est momentanément indisponible. Votre saisie est conservée : réessayez dans quelques minutes.' };
    throw e;
  }
}
