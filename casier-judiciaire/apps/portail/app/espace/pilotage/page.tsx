import { Alerte, ConteneurTableau, TuileIndicateur } from '@casier/design-system';

import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { fcfa } from '@/lib/contenu';

const STATUTS: Record<string, string> = {
  EN_ATTENTE_PAIEMENT: 'En attente de paiement', EN_TRAITEMENT: 'En traitement', A_TRAITER_PAR_AGENT: 'À traiter par un agent',
  EN_ATTENTE_PIECE: 'En attente de pièce', DELIVREE: 'Délivrées', REJETEE: 'Rejetées',
};
const BULLETINS: Record<string, string> = { B3_EMIS: 'Bulletins n°3 émis', B3_REVOQUE: 'Bulletins n°3 révoqués', B2_EMIS: 'Bulletins n°2 délivrés', B1_EMIS: 'Bulletins n°1 délivrés' };
const n = (x: number) => x.toLocaleString('fr-FR').replace(/ | /g, ' ');

/** DSH-07, DSH-08 : indicateurs nationaux agrégés, sans donnée nominative (DON-02). */
export default async function Pilotage() {
  const s = await exigerSession('R08', 'R09');
  const ind = await espaces.indicateurs(s);
  if (!ind) return <Alerte type="erreur" titre="Indicateurs indisponibles">Réessayez dans quelques minutes.</Alerte>;
  const d = ind.demandes;
  const taux = d.delivrees ? Math.round((d.delivreesAutomatiquement / d.delivrees) * 100) : 0;
  return (
    <>
      <TitreEspace titre="Pilotage" chapo="Indicateurs nationaux agrégés. Aucune donnée nominative n’est affichée." />
      {s.demo && <Alerte type="info" titre="Chiffres fictifs">Valeurs de démonstration.</Alerte>}
      <div className="cj-grille cj-grille--4">
        <TuileIndicateur valeur={n(d.total)} libelle="Demandes" />
        <TuileIndicateur valeur={n(d.delivrees)} libelle="Bulletins délivrés" detail={`${taux} % sans intervention`} />
        <TuileIndicateur valeur={d.delaiMoyenHeures == null ? '—' : `${d.delaiMoyenHeures.toLocaleString('fr-FR')} h`} libelle="Délai moyen" detail="Objectif : 24 h" />
        <TuileIndicateur valeur={n(d.enRetard)} libelle="En retard" />
        <TuileIndicateur valeur={fcfa(d.recettesFcfa)} libelle="Recettes encaissées" />
        <TuileIndicateur valeur={n(ind.verifications)} libelle="Vérifications de bulletins" />
        <TuileIndicateur valeur={d.satisfaction?.noteMoyenne != null ? `${d.satisfaction.noteMoyenne.toLocaleString('fr-FR')} / 5` : '—'}
          libelle="Satisfaction des usagers" detail={`${n(d.satisfaction?.nombreAvis ?? 0)} avis`} />
      </div>
      <div className="cj-grille cj-grille--2">
        <ConteneurTableau libelle="Demandes par état">
          <table className="cj-tableau">
            <caption>Demandes par état</caption>
            <thead><tr><th>État</th><th className="cj-nombre">Nombre</th></tr></thead>
            <tbody>{Object.entries(d.parStatut).map(([k, v]) => <tr key={k}><td>{STATUTS[k] ?? k}</td><td className="cj-nombre">{n(v)}</td></tr>)}</tbody>
          </table>
        </ConteneurTableau>
        <ConteneurTableau libelle="Bulletins">
          <table className="cj-tableau">
            <caption>Bulletins</caption>
            <thead><tr><th>Type</th><th className="cj-nombre">Nombre</th></tr></thead>
            <tbody>{Object.entries(ind.bulletins).map(([k, v]) => <tr key={k}><td>{BULLETINS[k] ?? k}</td><td className="cj-nombre">{n(v)}</td></tr>)}</tbody>
          </table>
        </ConteneurTableau>
      </div>
    </>
  );
}
