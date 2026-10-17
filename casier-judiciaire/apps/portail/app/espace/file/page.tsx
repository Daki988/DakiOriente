import Link from 'next/link';
import { Alerte, Badge, ConteneurTableau, TuileIndicateur } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { libellesProfils } from '@/lib/contenu';
import { dateHeure } from '@/lib/format';

/** « PT2H30M » → « 2 h 30 » */
function duree(iso: string | null) {
  if (!iso) return '—';
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
  if (!m) return iso;
  return `${m[1] ?? 0} h${m[2] ? ` ${m[2].padStart(2, '0')}` : ''}`;
}

/** DSH-04 : file de travail de l'agent, triée par échéance, avec alerte à 4 heures de l'échéance (RG-08). */
export default async function FileDeTravail() {
  const s = await exigerSession('R06');
  const file = await espaces.file(s);
  const aTraiter = file.filter((d) => d.statut === 'A_TRAITER_PAR_AGENT');
  return (
    <>
      <TitreEspace titre="File de travail" chapo={`Demandes à vérifier${s.juridiction ? ` — ${s.juridiction}` : ''}. Chaque décision est motivée et journalisée.`} />
      <MessageAction session={s} />
      <div className="cj-grille cj-grille--3">
        <TuileIndicateur valeur={aTraiter.length} libelle="À traiter" />
        <TuileIndicateur valeur={file.filter((d) => d.alerte || d.enRetard).length} libelle="Proches de l’échéance" detail="Moins de 4 heures" />
        <TuileIndicateur valeur={file.filter((d) => d.statut === 'EN_ATTENTE_PIECE').length} libelle="En attente de pièce" detail="Délai suspendu" />
      </div>
      {file.length === 0
        ? <Alerte type="succes" titre="File vide">Aucune demande en attente de vérification.</Alerte>
        : (
          <ConteneurTableau libelle="Demandes à traiter">
            <table className="cj-tableau">
              <thead><tr><th>Dossier</th><th>Demandeur</th><th>Motif</th><th>Échéance</th><th>État</th></tr></thead>
              <tbody>
                {file.map((d) => (
                  <tr key={d.id}>
                    <td><Link href={`/espace/file/${encodeURIComponent(d.id)}`}>{d.numeroDossier}</Link></td>
                    <td>{d.identite.nom} {d.identite.prenoms}<br /><small>{libellesProfils[d.profil] ?? d.profil}</small></td>
                    <td>{d.motif}</td>
                    <td>{dateHeure(d.echeance)}<br /><small>reste {duree(d.restant)}</small></td>
                    <td>
                      {d.enRetard ? <Badge ton="erreur">En retard</Badge>
                        : d.alerte ? <Badge ton="alerte">Échéance proche</Badge>
                        : d.statut === 'EN_ATTENTE_PIECE' ? <Badge ton="neutre">Pièce demandée</Badge>
                        : <Badge ton="info">À traiter</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConteneurTableau>
        )}
    </>
  );
}
