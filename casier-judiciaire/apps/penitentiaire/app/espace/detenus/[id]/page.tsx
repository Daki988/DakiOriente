import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Alerte, Badge, Champ, ChampSelection, ConteneurTableau, Icone, ListeDescription, ZoneTexte, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { donnees, exigerSession, nomEtablissement } from '@/lib/donnees';
import { dateHeure, dateLongue } from '@/lib/format';
import { MOTIFS_LIBERATION, STATUTS_DETENU, STATUTS_MOUVEMENT, TITRES, TYPES_MOUVEMENT } from '@/lib/libelles';
import { condamner, demanderMouvement, liberer } from '../../actions';

const age = (naissance: string) => Math.floor((Date.now() - new Date(naissance).getTime()) / (365.25 * 86_400_000));

/** Fiche d'écrou : identité, titre de détention, situation pénale, mouvements et actions selon le rôle. */
export default async function FicheDetenu({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigerSession();
  const { id } = await params;
  const fiche = await donnees.fiche(s, id);
  if (!fiche) notFound();
  const { detenu: d, mouvements } = fiche;
  const etablissements = await donnees.etablissements();
  const greffe = s.roles.includes('R16');
  const chef = s.roles.includes('R17');
  const present = d.statut !== 'LIBERE';
  const dehors = mouvements.some((m) => m.statut === 'EN_COURS');
  return (
    <>
      <p><Link href="/espace/registre"><Icone nom="arrow-left" taille={16} /> Registre d’écrou</Link></p>
      <TitreEspace titre={`${d.nom} ${d.prenoms}`} chapo={<>Écrou <span className="p-code">{d.numeroEcrou}</span> · {nomEtablissement(d.etablissement)}</>} />
      <MessageAction session={s} />
      <div className="cj-actions">
        <Badge ton={STATUTS_DETENU[d.statut].ton}>{STATUTS_DETENU[d.statut].libelle}</Badge>
        {dehors && <Badge ton="alerte">Hors de l’établissement</Badge>}
      </div>
      <div className="cj-grille cj-grille--2">
        <section className="p-encadre cj-pile" aria-labelledby="titre-identite">
          <h2 id="titre-identite" className="p-titre-encadre">Identité</h2>
          <ListeDescription elements={[
            { terme: 'Né(e) le', valeur: `${dateLongue(d.dateNaissance)} (${age(d.dateNaissance)} ans)` },
            { terme: 'À', valeur: d.lieuNaissance },
            { terme: 'Nationalité', valeur: d.nationalite },
            { terme: 'Quartier', valeur: d.quartier ?? '—' },
            { terme: 'Écroué le', valeur: dateLongue(d.dateEcrou) },
          ]} />
        </section>
        <section className="p-encadre cj-pile" aria-labelledby="titre-penale">
          <h2 id="titre-penale" className="p-titre-encadre">Situation pénale</h2>
          <ListeDescription elements={[
            { terme: 'Titre de détention', valeur: `${TITRES[d.titreDetention]} n° ${d.referenceTitre}` },
            { terme: 'Juridiction', valeur: d.juridiction },
            { terme: 'Infraction', valeur: d.infraction },
            ...(d.statut === 'CONDAMNE' || d.dureePeineMois ? [
              { terme: 'Peine', valeur: `${d.dureePeineMois} mois, depuis le ${dateLongue(d.dateDebutPeine)}` },
              { terme: 'Réductions', valeur: `${d.reductionJours} jour${d.reductionJours > 1 ? 's' : ''}` },
              { terme: 'Libération prévue', valeur: <strong>{dateLongue(d.dateLiberationPrevue)}</strong> },
            ] : []),
            ...(d.statut === 'LIBERE' ? [{ terme: 'Libéré le', valeur: `${dateLongue(d.dateLiberation)} — ${d.motifLiberation ?? ''}` }] : []),
          ]} />
          {d.statut === 'PREVENU' && <p className="p-note"><Icone nom="info" taille={18} /><span>Prévenu : présumé innocent. La détention provisoire s’imputera sur la peine éventuelle.</span></p>}
        </section>
      </div>

      <ConteneurTableau libelle="Mouvements">
        <table className="cj-tableau cj-tableau--empile">
          <caption>Mouvements</caption>
          <thead><tr><th>Type</th><th>Destination</th><th>Prévu le</th><th>État</th></tr></thead>
          <tbody>
            {mouvements.length === 0 && <tr><td colSpan={4}>Aucun mouvement.</td></tr>}
            {mouvements.map((m) => (
              <tr key={m.id}>
                <th scope="row">{TYPES_MOUVEMENT[m.type]}<br /><small>{m.motif}</small></th>
                <td data-label="Destination">{m.type === 'TRANSFERT' ? nomEtablissement(m.destination) : m.destination}</td>
                <td data-label="Prévu le">{dateHeure(m.prevuLe)}</td>
                <td data-label="État"><span><Badge ton={STATUTS_MOUVEMENT[m.statut].ton}>{STATUTS_MOUVEMENT[m.statut].libelle}</Badge>{m.observation && <><br /><small>{m.observation}</small></>}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </ConteneurTableau>

      {greffe && d.statut === 'PREVENU' && (
        <form action={condamner} className="p-encadre cj-pile" aria-labelledby="titre-condamnation">
          <h2 id="titre-condamnation" className="p-titre-encadre">Enregistrer la condamnation</h2>
          <input type="hidden" name="id" value={d.id} />
          <div className="cj-grille cj-grille--2">
            <ChampSelection id="titre" name="titre" libelle="Décision" requis defaultValue="JUGEMENT">
              {(['JUGEMENT', 'ARRET', 'CONTRAINTE'] as const).map((t) => <option key={t} value={t}>{TITRES[t]}</option>)}
            </ChampSelection>
            <Champ id="reference" name="reference" libelle="Référence de la décision" requis />
            <Champ id="juridiction-condamnation" name="juridiction" libelle="Juridiction" requis defaultValue={d.juridiction} />
            <Champ id="dureePeineMois" name="dureePeineMois" type="number" min={1} max={600} libelle="Durée de la peine (mois)" requis />
            <Champ id="dateDebutPeine" name="dateDebutPeine" type="date" libelle="Début de peine" aide="Par défaut : date d’écrou (détention provisoire imputée)" />
          </div>
          <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>Enregistrer la condamnation</button>
        </form>
      )}

      {greffe && present && (
        <form action={demanderMouvement} className="p-encadre cj-pile" aria-labelledby="titre-mouvement">
          <h2 id="titre-mouvement" className="p-titre-encadre">Demander un mouvement</h2>
          <p>Le mouvement devra être autorisé par le chef d’établissement avant le départ.</p>
          <input type="hidden" name="id" value={d.id} />
          <div className="cj-grille cj-grille--2">
            <ChampSelection id="type" name="type" libelle="Type de mouvement" requis>
              {Object.entries(TYPES_MOUVEMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </ChampSelection>
            <Champ id="destination" name="destination" libelle="Lieu (extraction, permission)" aide="Tribunal, hôpital, adresse…" />
            <ChampSelection id="etablissementDestination" name="etablissementDestination" libelle="Établissement d’accueil (transfert)" defaultValue="">
              <option value="">—</option>
              {etablissements.filter((e) => e.code !== d.etablissement).map((e) => <option key={e.code} value={e.code}>{e.nom}</option>)}
            </ChampSelection>
            <Champ id="motif" name="motif" libelle="Motif" requis />
            <Champ id="prevuLe" name="prevuLe" type="datetime-local" libelle="Départ prévu" requis />
            <Champ id="retourPrevu" name="retourPrevu" type="datetime-local" libelle="Retour prévu" aide="Sans objet pour un transfert" />
          </div>
          <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>Demander le mouvement</button>
        </form>
      )}

      {chef && present && (
        <form action={liberer} className="p-encadre cj-pile" aria-labelledby="titre-liberation">
          <h2 id="titre-liberation" className="p-titre-encadre">Prononcer la libération</h2>
          {dehors
            ? <Alerte type="avertissement" titre="Détenu hors de l’établissement">Le retour doit être enregistré avant la libération.</Alerte>
            : <p>La libération lève l’écrou et annule les mouvements non commencés. Elle est journalisée à votre nom.</p>}
          <input type="hidden" name="id" value={d.id} />
          <ChampSelection id="motif-liberation" name="motif" libelle="Motif" requis defaultValue={d.statut === 'PREVENU' ? 'MAINLEVEE_MANDAT' : 'FIN_DE_PEINE'}>
            {Object.entries(MOTIFS_LIBERATION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </ChampSelection>
          <ZoneTexte id="precision" name="precision" libelle="Référence de la décision ou précision" rows={2} />
          <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }} disabled={dehors}>Libérer</button>
        </form>
      )}
    </>
  );
}
