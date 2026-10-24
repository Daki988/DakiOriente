import type { Metadata } from 'next';
import { Alerte, Badge, Champ, Icone, ListeDescription, classesBouton } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { RefusMetier, ServiceIndisponible, suivrePreplainte } from '@/lib/api';
import { config } from '@/lib/config';
import { dateHeure, dateLongue } from '@/lib/format';
import { STATUTS_PREPLAINTE } from '@/lib/preplainte';
import type { SuiviPreplainte } from '@/lib/types';

export const metadata: Metadata = { title: 'Suivre une pré-plainte', description: 'Suivez votre pré-plainte avec son numéro et votre code.' };
export const dynamic = 'force-dynamic';

/** Suivi public d'une pré-plainte : statut et rendez-vous, sans le détail des faits. */
export default async function SuiviPreplaintePage({ searchParams }: { searchParams: Promise<{ numero?: string; code?: string }> }) {
  const p = await searchParams;
  const numero = String(p.numero ?? '').trim().toUpperCase().slice(0, 20);
  const code = String(p.code ?? '').trim().slice(0, 10);
  let suivi: SuiviPreplainte | null = null;
  let erreur: string | null = null;
  if (numero && code) {
    try {
      suivi = await suivrePreplainte(numero, code);
      if (!suivi) erreur = 'Numéro de pré-plainte ou code incorrect.';
    } catch (e) {
      if (e instanceof RefusMetier) erreur = e.message;
      else if (e instanceof ServiceIndisponible) erreur = 'Le service est momentanément indisponible. Réessayez dans quelques minutes.';
      else throw e;
    }
  }
  const statut = suivi ? STATUTS_PREPLAINTE[suivi.statut] : null;
  return (
    <>
      <EntetePage fil={[{ libelle: 'Pré-plainte en ligne', href: '/pre-plainte' }, { libelle: 'Suivi' }]} surtitre="Pré-plainte en ligne"
        titre="Suivre ma pré-plainte" chapo="Saisissez le numéro et le code reçus lors de votre déclaration." />
      <div className="cj-conteneur p-contenu cj-pile">
        <form method="get" className="cj-formulaire-ligne" aria-label="Retrouver une pré-plainte">
          <Champ id="numero" name="numero" libelle="Numéro" defaultValue={numero} placeholder="PP-2026-000031" required maxLength={20} autoComplete="off" />
          <Champ id="code" name="code" libelle="Code de suivi" inputMode="numeric" required maxLength={10} autoComplete="off" />
          <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-end' }}><Icone nom="search" taille={20} /><span>Suivre</span></button>
        </form>
        {config.comptesDemo && !suivi && (
          <Alerte type="info" titre="Pré-plaintes de démonstration">PP-2026-000031 avec le code 271828 ; PP-2026-000029 avec le code 314159. Données fictives.</Alerte>
        )}
        {erreur && <Alerte type="erreur" titre="Pré-plainte introuvable">{erreur}</Alerte>}
        {suivi && statut && (
          <section className="cj-panneau" aria-labelledby="titre-suivi">
            <div className="cj-actions" style={{ justifyContent: 'space-between' }}>
              <h2 id="titre-suivi">Pré-plainte {suivi.numero}</h2>
              <Badge ton={statut.ton}>{statut.libelle}</Badge>
            </div>
            <p>{statut.explication}</p>
            <ListeDescription elements={[
              { terme: 'Déposée le', valeur: dateHeure(suivi.deposeeLe) },
              { terme: 'Service', valeur: suivi.service },
              ...(suivi.rendezVousLe ? [{ terme: 'Rendez-vous', valeur: `${dateHeure(suivi.rendezVousLe)} · ${suivi.rendezVousLieu}` }] : []),
              ...(suivi.signeeLe ? [{ terme: 'Plainte signée le', valeur: dateHeure(suivi.signeeLe) }] : []),
              ...(suivi.statut === 'RECUE' || suivi.statut === 'RENDEZ_VOUS_FIXE' ? [{ terme: 'À signer avant le', valeur: dateLongue(suivi.expireLe) }] : []),
            ]} />
          </section>
        )}
      </div>
    </>
  );
}
