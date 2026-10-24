import Link from 'next/link';
import { Alerte, Badge, ConteneurTableau, TuileIndicateur } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { donnees, exigerSession } from '@/lib/donnees';
import { dateLongue } from '@/lib/format';

/** Tableau de bord : établissement de l'agent, ou réseau national pour la direction. */
export default async function TableauDeBord({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const s = await exigerSession();
  const { refus } = await searchParams;
  const t = await donnees.tableauDeBord(s);
  const national = s.roles.includes('R18');
  const population = t.etablissements.reduce((x, e) => x + e.population, 0);
  const capacite = t.etablissements.reduce((x, e) => x + e.capacite, 0);
  return (
    <>
      <TitreEspace titre="Tableau de bord" chapo={national ? 'Vue nationale de tous les établissements pénitentiaires.' : `${t.etablissements[0]?.nom ?? 'Votre établissement'}.`} />
      {refus && <Alerte type="avertissement" titre="Accès non autorisé">Votre profil ne permet pas d’ouvrir cette page.</Alerte>}
      <MessageAction session={s} />
      {s.demo && <Alerte type="info" titre="Données fictives">Détenus et chiffres de démonstration, réinitialisés toutes les heures.</Alerte>}
      <div className="cj-grille cj-grille--4">
        <TuileIndicateur valeur={population.toLocaleString('fr-FR')} libelle="Personnes détenues" detail={`${capacite ? Math.round((population * 100) / capacite) : 0} % d’occupation`} />
        <TuileIndicateur valeur={t.prevenus} libelle="Prévenus" detail={national ? 'Registre détaillé' : 'Au registre numérique'} />
        <TuileIndicateur valeur={t.condamnes} libelle="Condamnés" detail={national ? 'Registre détaillé' : 'Au registre numérique'} />
        <TuileIndicateur valeur={t.liberationsSous30Jours} libelle="Libérations sous 30 jours" />
        <TuileIndicateur valeur={t.mouvementsAAutoriser} libelle="Mouvements à autoriser" />
        <TuileIndicateur valeur={t.mouvementsDuJour} libelle="Mouvements du jour" />
        <TuileIndicateur valeur={t.enDehors} libelle="Hors de l’établissement" detail="Extraction ou permission en cours" />
      </div>
      {(t.mouvementsAAutoriser > 0 || t.enDehors > 0) && (
        <p><Link href="/espace/mouvements">Voir les mouvements en cours</Link></p>
      )}
      <ConteneurTableau libelle="Occupation des établissements">
        <table className="cj-tableau cj-tableau--empile">
          <caption>Occupation des établissements</caption>
          <thead><tr><th>Établissement</th><th className="cj-nombre">Capacité</th><th className="cj-nombre">Population</th><th>Occupation</th></tr></thead>
          <tbody>
            {t.etablissements.map((e) => (
              <tr key={e.code}>
                <th scope="row">{e.nom}<br /><small>{e.ville}</small></th>
                <td data-label="Capacité" className="cj-nombre">{e.capacite.toLocaleString('fr-FR')}</td>
                <td data-label="Population" className="cj-nombre">{e.population.toLocaleString('fr-FR')}</td>
                <td data-label="Occupation">
                  <span className="pen-occupation">
                    <span className="pen-jauge" aria-hidden="true"><span style={{ width: `${Math.min(e.tauxOccupation, 100)}%` }} data-ton={e.tauxOccupation > 120 ? 'erreur' : e.tauxOccupation > 100 ? 'alerte' : 'succes'} /></span>
                    <Badge ton={e.tauxOccupation > 120 ? 'erreur' : e.tauxOccupation > 100 ? 'alerte' : 'succes'}>{e.tauxOccupation} %</Badge>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConteneurTableau>
      <ConteneurTableau libelle="Prochaines libérations">
        <table className="cj-tableau cj-tableau--empile">
          <caption>Prochaines libérations prévues</caption>
          <thead><tr><th>Détenu</th><th>Écrou</th><th>Libération prévue</th></tr></thead>
          <tbody>
            {t.prochainesLiberations.length === 0 && <tr><td colSpan={3}>Aucune libération prévue.</td></tr>}
            {t.prochainesLiberations.map((d) => (
              <tr key={d.id}>
                <th scope="row"><Link href={`/espace/detenus/${d.id}`}>{d.nom} {d.prenoms}</Link></th>
                <td data-label="Écrou"><span className="p-code">{d.numeroEcrou}</span></td>
                <td data-label="Libération prévue">{dateLongue(d.dateLiberationPrevue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConteneurTableau>
    </>
  );
}
