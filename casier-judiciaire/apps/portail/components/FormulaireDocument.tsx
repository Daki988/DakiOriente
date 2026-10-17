'use client';
import { useActionState } from 'react';
import { Alerte, Icone, classesBouton } from '@casier/design-system';

import { controlerDocument, type EtatDocument } from '@/app/verifier/actions';
import { ResultatVerification } from './ResultatVerification';

/** BUL-08 : contrôle d'un bulletin reçu en PDF (sceau électronique et intégrité du fichier). */
export function FormulaireDocument() {
  const [etat, action, enCours] = useActionState<EtatDocument, FormData>(controlerDocument, null);
  return (
    <section className="p-encadre cj-pile" aria-labelledby="titre-document">
      <h2 id="titre-document" className="p-titre-encadre">Vous avez reçu le bulletin en PDF ?</h2>
      <p>Déposez le fichier : nous contrôlons son sceau électronique et vérifions qu’il n’a pas été modifié. Le fichier n’est pas conservé.</p>
      <form action={action} className="cj-pile">
        <div className="cj-champ">
          <label className="cj-champ__libelle" htmlFor="fichier">Fichier PDF du bulletin</label>
          <input id="fichier" name="fichier" type="file" accept="application/pdf,.pdf" required className="cj-champ__saisie" />
        </div>
        <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }} disabled={enCours}>
          <Icone nom="file-check" taille={20} /><span>{enCours ? 'Contrôle en cours…' : 'Contrôler le fichier'}</span>
        </button>
      </form>
      <div aria-live="polite" className="cj-pile">
        {etat && 'erreur' in etat && <Alerte type="erreur" titre="Contrôle impossible">{etat.erreur}</Alerte>}
        {etat && 'integre' in etat && (etat.integre
          ? <><Alerte type="succes" titre="Sceau valide, fichier intact">Le fichier a été scellé par le casier judiciaire et n’a pas été modifié depuis.</Alerte>
              <ResultatVerification resultat={etat.resultat} /></>
          : <Alerte type="erreur" titre="Fichier non authentique">Le sceau est absent, invalide, ou le fichier a été modifié après son émission. Ne l’acceptez pas.</Alerte>)}
      </div>
    </section>
  );
}
