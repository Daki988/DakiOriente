import { Alerte, Badge, ListeDescription, ZoneTexte, Icone, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { fcfa } from '@/lib/contenu';
import { dateHeure, dateLongue } from '@/lib/format';
import type { Peine } from '@/lib/types';
import { rejeterInscription, validerInscription } from '../actions';

const peine = (p: Peine) =>
  `${p.nature === 'EMPRISONNEMENT' ? `Emprisonnement ${p.dureeMois} mois` : p.nature === 'AMENDE' ? `Amende ${fcfa(p.montantFcfa ?? 0)}` : p.nature}`
  + (p.sursis !== 'AUCUN' ? ` avec sursis ${p.sursis.toLowerCase()}` : '');

/** DSH-06, HAB-02 : le greffier en chef valide ou rejette les inscriptions saisies par une autre personne. */
export default async function Validations() {
  const s = await exigerSession('R07');
  const liste = await espaces.enAttente(s);
  return (
    <>
      <TitreEspace titre="Validations" chapo="Inscriptions au casier à contrôler avant qu’elles ne produisent effet. Vous ne pouvez pas valider votre propre saisie." />
      <MessageAction session={s} />
      {liste.length === 0 && <Alerte type="succes" titre="Rien à valider">Aucune inscription en attente.</Alerte>}
      {liste.map((c) => (
        <section key={c.id} className="cj-panneau" aria-labelledby={`t-${c.id}`}>
          <div className="cj-actions" style={{ justifyContent: 'space-between' }}>
            <h2 id={`t-${c.id}`}>{c.nom} {c.prenoms}</h2>
            {c.remplaceId ? <Badge ton="alerte">Correction (version {c.version})</Badge> : <Badge ton="info">Nouvelle inscription</Badge>}
          </div>
          <ListeDescription elements={[
            { terme: 'Décision', valeur: `${c.numeroDecision} du ${dateLongue(c.dateDecision)}` },
            { terme: 'Juridiction', valeur: c.juridiction },
            { terme: 'Infraction', valeur: `${c.infraction} (${c.qualification.toLowerCase()})` },
            { terme: 'Peine', valeur: c.peines.map(peine).join(' ; ') },
            { terme: 'Né(e) le', valeur: dateLongue(c.dateNaissance) },
            { terme: 'Saisie', valeur: `${c.saisieParMoi ? 'par vous' : c.saisiePar}, le ${dateHeure(c.saisieLe)}` },
          ]} />
          {c.saisieParMoi
            ? <Alerte type="info" titre="Saisie par vous">Une autre personne doit la valider (quatre yeux).</Alerte>
            : (
              <div className="cj-grille cj-grille--2">
                <form action={validerInscription} className="cj-pile">
                  <input type="hidden" name="id" value={c.id} />
                  <p>J’ai contrôlé la décision au regard de la pièce source.</p>
                  <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>
                    <Icone nom="check" taille={20} /><span>Valider l’inscription</span>
                  </button>
                </form>
                <form action={rejeterInscription} className="cj-pile">
                  <input type="hidden" name="id" value={c.id} />
                  <ZoneTexte id={`motif-${c.id}`} name="motif" libelle="Motif du rejet" requis rows={2} maxLength={1000} />
                  <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>Rejeter</button>
                </form>
              </div>
            )}
        </section>
      ))}
    </>
  );
}
