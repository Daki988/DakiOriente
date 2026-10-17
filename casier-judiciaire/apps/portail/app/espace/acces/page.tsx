import { Alerte, ConteneurTableau } from '@casier/design-system';

import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { dateHeure } from '@/lib/format';

const ACTIONS: Record<string, string> = {
  DEMANDE_B3_DEPOSEE: 'Dépôt de votre demande', PAIEMENT_CONFIRME: 'Paiement confirmé', RAPPROCHEMENT_AUTOMATIQUE: 'Vérification automatique de l’identité',
  BULLETIN_EMIS: 'Émission de votre bulletin', BULLETIN_TELECHARGE: 'Téléchargement du bulletin', FICHE_CONSULTEE: 'Consultation de votre fiche',
  PIECE_DEMANDEE: 'Demande d’une pièce', PIECE_DEPOSEE: 'Dépôt d’une pièce', IDENTITE_DECIDEE_PAR_AGENT: 'Décision sur votre identité',
  DEMANDE_REJETEE: 'Rejet de la demande', BULLETIN_REVOQUE: 'Révocation du bulletin', BULLETIN_VALIDE_POUR_IMPRESSION: 'Validation pour impression',
  BULLETIN_IMPRIME: 'Impression au guichet', BULLETIN_REIMPRIME: 'Réimpression au guichet', CONDAMNATION_VALIDEE: 'Inscription au casier',
};

/** Transparence (inspirée du suivi des accès en Estonie) : l'usager voit qui a consulté ou traité ses données, et pourquoi. */
export default async function AccesDonnees() {
  const s = await exigerSession('R01');
  const acces = await espaces.acces(s);
  return (
    <>
      <TitreEspace titre="Accès à mes données"
        chapo="Chaque consultation ou action sur vos demandes, vos bulletins et votre fiche est enregistrée dans un journal inaltérable. Les agents sont désignés par leur fonction." />
      <Alerte type="info" titre="Un accès vous semble injustifié ?">
        Signalez-le depuis la page <a href="/contact">Contact et réclamation</a> en indiquant la date : il sera examiné par l’auditeur du casier.
      </Alerte>
      {acces.length === 0
        ? <Alerte type="info" titre="Aucun accès">Aucune action n’est enregistrée sur vos données.</Alerte>
        : (
          <ConteneurTableau libelle="Accès à mes données">
            <table className="cj-tableau">
              <thead><tr><th>Date</th><th>Action</th><th>Par</th><th>Motif</th></tr></thead>
              <tbody>
                {acces.map((a, i) => (
                  <tr key={i}>
                    <td>{dateHeure(a.horodatage)}</td>
                    <td>{ACTIONS[a.action] ?? a.action.toLowerCase().replace(/_/g, ' ')}</td>
                    <td>{a.auteur}</td>
                    <td>{a.finalite ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConteneurTableau>
        )}
    </>
  );
}
