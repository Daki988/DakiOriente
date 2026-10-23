'use client';
import { useActionState } from 'react';
import { Alerte, Badge, Champ, ConteneurTableau, Icone, TuileIndicateur, ZoneTexte, classesBouton } from '@casier/design-system';

import { rapprocher, type EtatRapprochement } from '@/app/espace/actions-etat';
import { fcfa } from '@/lib/contenu';

const NATURES = {
  ABSENT_DE_LA_PLATEFORME: { ton: 'erreur', libelle: 'Sur le relevé, absent de la plateforme' },
  ABSENT_DU_RELEVE: { ton: 'alerte', libelle: 'Encaissé sur la plateforme, absent du relevé' },
  MONTANT_DIFFERENT: { ton: 'erreur', libelle: 'Montants différents' },
} as const;

/** Rapprochement d'un relevé du Trésor ou d'un opérateur avec les paiements enregistrés sur la période. */
export function FormulaireRapprochement({ du, au }: { du: string; au: string }) {
  const [etat, action, enCours] = useActionState<EtatRapprochement, FormData>(rapprocher, null);
  return (
    <div className="cj-pile">
      <form action={action} className="cj-pile">
        <input type="hidden" name="du" value={du} />
        <input type="hidden" name="au" value={au} />
        <Champ id="fichier-releve" name="fichier" type="file" libelle="Fichier du relevé (CSV)" accept=".csv,text/csv,text/plain"
          aide="Une ligne « référence;montant » par paiement, ligne d’en-tête facultative." />
        <ZoneTexte id="releve" name="releve" libelle="Ou collez les lignes du relevé" rows={4} maxLength={500000}
          placeholder={'TRESOR-TP-2026-104300;1500\nAIRTEL-104301;1500'} />
        <button type="submit" className={classesBouton()} disabled={enCours} style={{ alignSelf: 'flex-start' }}>
          <Icone nom="list-checks" taille={20} /><span>{enCours ? 'Rapprochement…' : 'Rapprocher'}</span>
        </button>
      </form>
      <div aria-live="polite" className="cj-pile">
        {etat && !etat.ok && <Alerte type="erreur" titre="Rapprochement impossible">{etat.erreur}</Alerte>}
        {etat?.ok && (
          <>
            <div className="cj-grille cj-grille--4">
              <TuileIndicateur valeur={etat.resultat.lignesReleve} libelle="Lignes du relevé" />
              <TuileIndicateur valeur={etat.resultat.concordantes} libelle="Concordantes" />
              <TuileIndicateur valeur={etat.resultat.ecarts.length} libelle="Écarts à examiner" />
              <TuileIndicateur valeur={fcfa(etat.resultat.totalReleveFcfa - etat.resultat.totalPlateformeFcfa)} libelle="Différence de total" detail="Relevé moins plateforme" />
            </div>
            {etat.resultat.ecarts.length === 0
              ? <Alerte type="succes" titre="Relevé concordant">Toutes les lignes correspondent aux paiements enregistrés sur la période.</Alerte>
              : (
                <ConteneurTableau libelle="Écarts du rapprochement">
                  <table className="cj-tableau cj-tableau--empile">
                    <thead><tr><th>Référence</th><th>Écart</th><th className="cj-nombre">Plateforme</th><th className="cj-nombre">Relevé</th></tr></thead>
                    <tbody>
                      {etat.resultat.ecarts.slice(0, 200).map((e) => (
                        <tr key={e.reference + e.nature}>
                          <th scope="row">{e.reference}</th>
                          <td data-label="Écart"><Badge ton={NATURES[e.nature].ton}>{NATURES[e.nature].libelle}</Badge></td>
                          <td data-label="Plateforme" className="cj-nombre">{e.montantPlateforme === null ? '—' : fcfa(e.montantPlateforme)}</td>
                          <td data-label="Relevé" className="cj-nombre">{e.montantReleve === null ? '—' : fcfa(e.montantReleve)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ConteneurTableau>
              )}
          </>
        )}
      </div>
    </div>
  );
}
