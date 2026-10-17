import { Alerte, ConteneurTableau } from '@casier/design-system';

import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { dateHeure } from '@/lib/format';

/** DSH-11, SEC-07 : journal chaîné, en lecture seule ; la consultation est elle-même journalisée. */
export default async function Audit() {
  const s = await exigerSession('R12');
  const { integrite, entrees } = await espaces.journal(s);
  return (
    <>
      <TitreEspace titre="Journal d’audit" chapo="Chaque entrée est chaînée à la précédente par une empreinte : toute modification est détectée." />
      {integrite && (integrite.integre
        ? <Alerte type="succes" titre="Journal intègre">{integrite.entreesVerifiees.toLocaleString('fr-FR')} entrées vérifiées.</Alerte>
        : <Alerte type="erreur" titre="Altération détectée">Première entrée altérée : n°{integrite.premiereAlteration}.</Alerte>)}
      <ConteneurTableau libelle="Dernières entrées du journal">
        <table className="cj-tableau">
          <thead><tr><th className="cj-nombre">N°</th><th>Date</th><th>Acteur</th><th>Action</th><th>Objet</th><th>Finalité</th></tr></thead>
          <tbody>
            {entrees.map((e) => (
              <tr key={e.numero}>
                <td className="cj-nombre">{e.numero}</td>
                <td>{dateHeure(e.horodatage)}</td>
                <td>{e.evenement.acteurId}<br /><small>{e.evenement.roles}</small></td>
                <td>{e.evenement.action}</td>
                <td>{e.evenement.objetType ?? '—'}{e.evenement.objetId ? <><br /><small>{e.evenement.objetId}</small></> : null}</td>
                <td>{e.evenement.finalite ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConteneurTableau>
    </>
  );
}
