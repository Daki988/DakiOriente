'use client';
import { useActionState } from 'react';
import { Alerte, ZoneTexte, classesBouton } from '@casier/design-system';

import { envoyerAvis } from '@/app/avis/actions';
import type { ParcoursAvis } from '@/lib/types';

const NOTES = [
  { note: 1, libelle: 'Très insatisfait' }, { note: 2, libelle: 'Insatisfait' }, { note: 3, libelle: 'Moyen' },
  { note: 4, libelle: 'Satisfait' }, { note: 5, libelle: 'Très satisfait' },
];

/** « Je donne mon avis » (inspiré de GOV.UK et de Services Publics+) : anonyme, en une étape. */
export function AvisSatisfaction({ parcours }: { parcours: ParcoursAvis }) {
  const [etat, action, enCours] = useActionState(envoyerAvis, null);
  if (etat === 'envoye') return <Alerte type="succes" titre="Merci pour votre avis">Il nous aide à améliorer le service.</Alerte>;
  return (
    <form action={action} className="p-encadre cj-pile" aria-labelledby={`avis-${parcours}`}>
      <input type="hidden" name="parcours" value={parcours} />
      <fieldset className="cj-pile" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend id={`avis-${parcours}`} className="p-titre-encadre">Ce service vous a-t-il satisfait ?</legend>
        <div className="p-avis__notes">
          {NOTES.map((n) => (
            <label key={n.note} className="p-avis__note">
              <input type="radio" name="note" value={n.note} required />
              <span aria-hidden="true">{n.note}</span>
              <span className="p-avis__libelle">{n.libelle}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <ZoneTexte id={`commentaire-${parcours}`} name="commentaire" libelle="Un commentaire ? (facultatif)" rows={2} maxLength={1000}
        aide="Avis anonyme. N’indiquez aucune information personnelle." />
      {etat === 'erreur' && <p className="cj-champ__erreur">Choisissez une note de 1 à 5.</p>}
      <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }} disabled={enCours}>
        Envoyer mon avis
      </button>
    </form>
  );
}
