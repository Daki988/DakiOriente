import { Badge, CaseACocher, Champ, ChampSelection, ConteneurTableau, Icone, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { fcfa, libellesActes, libellesProfils } from '@/lib/contenu';
import { dateLongue } from '@/lib/format';
import { proposerTarif, validerTarif } from '../actions';

/** ADM-04 : tarifs versionnés à date d'effet, proposés puis validés par une seconde personne. */
export default async function Tarifs() {
  const s = await exigerSession('R08', 'R13');
  const tarifs = await espaces.tarifs(s);
  return (
    <>
      <TitreEspace titre="Tarifs" chapo="Aucun tarif n’est écrit dans le code : chaque montant est une donnée datée, validée à quatre yeux." />
      <MessageAction session={s} />
      <ConteneurTableau libelle="Historique des tarifs">
        <table className="cj-tableau cj-tableau--empile">
          <thead><tr><th>Acte et profil</th><th className="cj-nombre">Montant</th><th>Date d’effet</th><th>État</th><th>Action</th></tr></thead>
          <tbody>
            {tarifs.map((t) => (
              <tr key={t.id}>
                <th scope="row">{libellesActes[t.acte] ?? t.acte}<br /><small>{libellesProfils[t.profil] ?? t.profil}</small></th>
                <td className="cj-nombre" data-label="Montant"><span>{fcfa(t.montantFcfa)}{t.provisoire && <><br /><small>provisoire</small></>}</span></td>
                <td data-label="Date d’effet">{dateLongue(t.dateEffet)}</td>
                <td data-label="État">{t.statut === 'VALIDE' ? <Badge ton="succes">Validé</Badge> : t.statut === 'PROPOSE' ? <Badge ton="alerte">À valider</Badge> : <Badge ton="erreur">Rejeté</Badge>}</td>
                <td data-label="Action">
                  {t.statut === 'PROPOSE' && (t.proposePar === s.sujet
                    ? <small>Proposé par vous</small>
                    : (
                      <form action={validerTarif}>
                        <input type="hidden" name="id" value={t.id} />
                        <button type="submit" className={classesBouton({ variante: 'secondaire' })}>Valider</button>
                      </form>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConteneurTableau>
      <section className="cj-panneau" aria-labelledby="t-proposer">
        <h2 id="t-proposer">Proposer un tarif</h2>
        <form action={proposerTarif} className="cj-pile">
          <div className="cj-formulaire-ligne">
            <ChampSelection id="acte" libelle="Acte" requis>{Object.entries(libellesActes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</ChampSelection>
            <ChampSelection id="profil" libelle="Profil" requis>{Object.entries(libellesProfils).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</ChampSelection>
            <Champ id="montantFcfa" libelle="Montant (FCFA)" type="number" min={0} step={1} requis inputMode="numeric" />
            <Champ id="dateEffet" libelle="Date d’effet" type="date" requis />
          </div>
          <Champ id="libelle" libelle="Libellé public" requis maxLength={200} />
          <Champ id="source" libelle="Texte de référence" maxLength={300} aide="Arrêté ou décision fixant le tarif." />
          <CaseACocher id="provisoire" libelle="Tarif provisoire (en attente du texte officiel)" />
          <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}><Icone nom="plus" taille={20} /><span>Proposer</span></button>
        </form>
      </section>
    </>
  );
}
