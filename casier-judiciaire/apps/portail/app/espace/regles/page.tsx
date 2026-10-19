import { Alerte, Badge, Icone, ListeDescription, ZoneTexte, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { dateHeure, dateLongue } from '@/lib/format';
import { rejeterRegles, validerRegles } from '../actions';

/** ADM-05, RG-04 : paramètres juridiques versionnés (contenu des bulletins), cas de test, validation à quatre yeux. */
export default async function Regles() {
  const s = await exigerSession('R05', 'R08');
  const versions = await espaces.regles(s);
  return (
    <>
      <TitreEspace titre="Paramètres juridiques" chapo="Règles de contenu du bulletin n°3. Une version ne s’applique qu’après validation et à sa date d’effet." />
      <MessageAction session={s} />
      {versions.some((v) => v.fictif) && (
        <Alerte type="avertissement" titre="Règles fictives">Les règles chargées sont des exemples sans valeur juridique, en attente de validation par le Ministère.</Alerte>
      )}
      {versions.map((v) => (
        <section key={v.id} className="cj-panneau" aria-labelledby={`t-${v.id}`}>
          <div className="cj-actions" style={{ justifyContent: 'space-between' }}>
            <h2 id={`t-${v.id}`}>Version {v.version}</h2>
            {v.statut === 'PUBLIE' ? <Badge ton="succes">Publiée</Badge> : v.statut === 'PROPOSE' ? <Badge ton="alerte">À valider</Badge> : <Badge ton="erreur">Rejetée</Badge>}
          </div>
          <ListeDescription elements={[
            { terme: 'Date d’effet', valeur: dateLongue(v.dateEffet) },
            { terme: 'Référence', valeur: v.contenu.reference },
            { terme: 'Proposée', valeur: `${v.proposePar}, le ${dateHeure(v.proposeLe)}` },
            { terme: 'Validée', valeur: v.validePar ? `${v.validePar}, le ${dateHeure(v.valideLe)}` : '—' },
          ]} />
          <details className="cj-faq">
            <summary>Cas de test ({v.casDeTest.length})<Icone nom="chevron-down" /></summary>
            <ul>{v.casDeTest.map((c, i) => <li key={i}>{c.libelle}</li>)}</ul>
          </details>
          {v.motifRejet && <Alerte type="erreur" titre="Motif du rejet">{v.motifRejet}</Alerte>}
          {v.statut === 'PROPOSE' && (v.proposePar === s.sujet
            ? <Alerte type="info" titre="Proposée par vous">Une autre personne doit la valider.</Alerte>
            : (
              <div className="cj-grille cj-grille--2">
                <form action={validerRegles} className="cj-pile">
                  <input type="hidden" name="id" value={v.id} />
                  <p>Les cas de test ont été rejoués avec succès sur cette version.</p>
                  <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>Valider et publier</button>
                </form>
                <form action={rejeterRegles} className="cj-pile">
                  <input type="hidden" name="id" value={v.id} />
                  <ZoneTexte id={`motif-${v.id}`} name="motif" libelle="Motif du rejet" requis rows={2} maxLength={1000} />
                  <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>Rejeter</button>
                </form>
              </div>
            ))}
        </section>
      ))}
    </>
  );
}
