import { Alerte, Champ, ConteneurTableau, Icone, TuileIndicateur, classesBouton } from '@casier/design-system';

import { FormulaireRapprochement } from '@/components/FormulaireRapprochement';
import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { MOYENS_PAIEMENT, periode } from '@/lib/comptabilite';
import { fcfa } from '@/lib/contenu';
import { espaces, exigerSession } from '@/lib/espaces';
import { dateHeure } from '@/lib/format';

/** Tableau du comptable (R10) : recettes par moyen de paiement, détail des paiements, rapprochement, export. */
export default async function Comptabilite({ searchParams }: { searchParams: Promise<{ du?: string; au?: string }> }) {
  const s = await exigerSession('R10');
  const p = await searchParams;
  const { du, au } = periode(p.du, p.au);
  const [synthese, paiements] = await Promise.all([espaces.synthese(s, du, au), espaces.paiements(s, du, au)]);
  const moyens = Object.entries(synthese?.totalParMoyen ?? {}).sort((a, b) => b[1] - a[1]);
  const total = synthese?.totalFcfa ?? 0;
  return (
    <>
      <TitreEspace titre="Comptabilité"
        chapo="Recettes encaissées par moyen de paiement, rapprochement avec les relevés du Trésor et des opérateurs, export pour la comptabilité publique." />
      <MessageAction session={s} />
      <form method="get" className="cj-formulaire-ligne" aria-label="Période">
        <Champ id="du" name="du" type="date" libelle="Du" defaultValue={du} max={au} />
        <Champ id="au" name="au" type="date" libelle="Au" defaultValue={au} />
        <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-end' }}>
          <Icone nom="filter" taille={20} /><span>Afficher</span>
        </button>
      </form>
      <div className="cj-grille cj-grille--4">
        <TuileIndicateur valeur={fcfa(total)} libelle="Recettes de la période" />
        <TuileIndicateur valeur={synthese?.nombre ?? 0} libelle="Paiements" />
        <TuileIndicateur valeur={synthese?.nombre ? fcfa(Math.round(total / synthese.nombre)) : '—'} libelle="Montant moyen" />
        <TuileIndicateur valeur={paiements.filter((x) => x.tarifProvisoire).length} libelle="Au tarif provisoire" detail="En attente du texte officiel" />
      </div>

      <section className="cj-panneau" aria-labelledby="titre-moyens">
        <h2 id="titre-moyens">Recettes par moyen de paiement</h2>
        {moyens.length === 0 ? <p>Aucun paiement sur la période.</p> : (
          <ConteneurTableau libelle="Recettes par moyen de paiement">
            <table className="cj-tableau cj-tableau--empile">
              <thead><tr><th>Moyen</th><th className="cj-nombre">Paiements</th><th className="cj-nombre">Montant</th><th className="cj-nombre">Part</th></tr></thead>
              <tbody>
                {moyens.map(([m, montant]) => (
                  <tr key={m}>
                    <th scope="row">{MOYENS_PAIEMENT[m] ?? m}</th>
                    <td data-label="Paiements" className="cj-nombre">{synthese?.nombreParMoyen[m] ?? 0}</td>
                    <td data-label="Montant" className="cj-nombre">{fcfa(montant)}</td>
                    <td data-label="Part" className="cj-nombre">{total ? `${Math.round((montant / total) * 100)} %` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConteneurTableau>
        )}
        <a href={`/espace/comptabilite/export?du=${du}&au=${au}`} className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>
          <Icone nom="download" taille={20} /><span>Exporter les paiements (CSV)</span>
        </a>
      </section>

      <section className="cj-panneau" aria-labelledby="titre-rapprochement">
        <h2 id="titre-rapprochement">Rapprochement avec un relevé</h2>
        <p>Chargez le relevé du Trésor ou d’un opérateur pour la période du {du} au {au} : chaque écart est listé, rien n’est modifié.</p>
        <FormulaireRapprochement du={du} au={au} />
      </section>

      <section className="cj-panneau" aria-labelledby="titre-paiements">
        <h2 id="titre-paiements">Derniers paiements</h2>
        {paiements.length === 0 ? <Alerte type="info" titre="Aucun paiement">Aucun paiement enregistré sur la période.</Alerte> : (
          <ConteneurTableau libelle="Derniers paiements de la période">
            <table className="cj-tableau cj-tableau--empile">
              <thead><tr><th>Dossier</th><th>Payé le</th><th>Moyen</th><th>Référence</th><th className="cj-nombre">Montant</th></tr></thead>
              <tbody>
                {[...paiements].reverse().slice(0, 15).map((x) => (
                  <tr key={x.reference}>
                    <th scope="row">{x.numeroDossier}</th>
                    <td data-label="Payé le">{dateHeure(x.payeLe)}</td>
                    <td data-label="Moyen">{MOYENS_PAIEMENT[x.moyen] ?? x.moyen}</td>
                    <td data-label="Référence"><small>{x.reference}</small></td>
                    <td data-label="Montant" className="cj-nombre">{fcfa(x.montantFcfa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ConteneurTableau>
        )}
        {paiements.length > 15 && <p className="p-note">15 derniers paiements sur {paiements.length} ; l’export contient la période complète.</p>}
      </section>
    </>
  );
}
