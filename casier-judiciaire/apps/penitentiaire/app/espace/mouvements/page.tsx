import Link from 'next/link';
import { Alerte, Badge, ConteneurTableau, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { donnees, exigerSession, nomEtablissement } from '@/lib/donnees';
import { dateHeure } from '@/lib/format';
import type { Mouvement } from '@/lib/types';
import { STATUTS_MOUVEMENT, TYPES_MOUVEMENT } from '@/lib/libelles';
import { decider, executer } from '../actions';

/** Mouvements en cours : le chef d'établissement autorise ou refuse, le greffe enregistre départs et retours. */
export default async function Mouvements() {
  const s = await exigerSession();
  const liste = await donnees.mouvements(s);
  const greffe = s.roles.includes('R16');
  const chef = s.roles.includes('R17');
  return (
    <>
      <TitreEspace titre="Mouvements" chapo="Transferts, extractions et permissions de sortir. Un mouvement est autorisé par une autre personne que celle qui l’a demandé." />
      <MessageAction session={s} />
      {liste.length === 0
        ? <Alerte type="succes" titre="Aucun mouvement en cours">Tous les mouvements sont terminés.</Alerte>
        : (
          <ConteneurTableau libelle="Mouvements en cours">
            <table className="cj-tableau cj-tableau--empile">
              <caption>{liste.length} mouvement{liste.length > 1 ? 's' : ''} en cours</caption>
              <thead><tr><th>Détenu</th><th>Mouvement</th><th>Prévu</th><th>État</th>{(greffe || chef) && <th>Action</th>}</tr></thead>
              <tbody>
                {liste.map((m) => (
                  <tr key={m.id}>
                    <th scope="row"><Link href={`/espace/detenus/${m.detenuId}`}>{m.nomDetenu}</Link><br /><small className="p-code">{m.numeroEcrou}</small></th>
                    <td data-label="Mouvement"><span>{TYPES_MOUVEMENT[m.type]} → {m.type === 'TRANSFERT' ? nomEtablissement(m.destination) : m.destination}<br /><small>{m.motif}</small></span></td>
                    <td data-label="Prévu"><span>{dateHeure(m.prevuLe)}{m.retourPrevu && <><br /><small>retour {dateHeure(m.retourPrevu)}</small></>}</span></td>
                    <td data-label="État"><Badge ton={STATUTS_MOUVEMENT[m.statut].ton}>{STATUTS_MOUVEMENT[m.statut].libelle}</Badge></td>
                    {(greffe || chef) && <td data-label="Action"><Actions m={m} greffe={greffe} chef={chef} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </ConteneurTableau>
        )}
    </>
  );
}

function Actions({ m, greffe, chef }: { m: Mouvement; greffe: boolean; chef: boolean }) {
  if (chef && m.statut === 'DEMANDE') {
    if (m.demandeParMoi) return <small>Vous avez demandé ce mouvement : une autre personne doit l’autoriser.</small>;
    return (
      <form action={decider} className="pen-decision">
        <input type="hidden" name="id" value={m.id} />
        <label htmlFor={`obs-${m.id}`} className="pen-libelle">Observation (obligatoire en cas de refus)</label>
        <input id={`obs-${m.id}`} name="observation" className="cj-champ__saisie" maxLength={300} />
        <span className="cj-actions">
          <button type="submit" name="decision" value="autoriser" className={classesBouton()}>Autoriser</button>
          <button type="submit" name="decision" value="refuser" className={classesBouton({ variante: 'secondaire' })}>Refuser</button>
        </span>
      </form>
    );
  }
  if (!greffe) return <small>—</small>;
  const etapes: { etape: string; libelle: string; principal?: boolean }[] =
    m.statut === 'AUTORISE' ? [{ etape: 'DEPART', libelle: 'Enregistrer le départ', principal: true }, { etape: 'ANNULATION', libelle: 'Annuler' }]
      : m.statut === 'EN_COURS' ? [{ etape: 'RETOUR', libelle: 'Enregistrer le retour', principal: true }]
        : [{ etape: 'ANNULATION', libelle: 'Annuler' }];
  return (
    <form action={executer} className="cj-actions">
      <input type="hidden" name="id" value={m.id} />
      {etapes.map((e) => (
        <button key={e.etape} type="submit" name="etape" value={e.etape} className={classesBouton({ variante: e.principal ? 'primaire' : 'secondaire' })}>{e.libelle}</button>
      ))}
    </form>
  );
}
