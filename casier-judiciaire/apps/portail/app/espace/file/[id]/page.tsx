import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Alerte, Champ, ChoixCarte, Icone, ListeDescription, ZoneTexte, classesBouton } from '@casier/design-system';

import { TitreEspace } from '@/components/TitreEspace';
import { espaces, exigerSession } from '@/lib/espaces';
import { libellesProfils } from '@/lib/contenu';
import { dateHeure, dateLongue } from '@/lib/format';
import { deciderIdentite, demanderPiece, rejeterDemande } from '../../actions';

/** IDT-06 : l'agent décide de l'identité (fiche existante ou absence au casier) ; le contenu du bulletin reste calculé par le moteur. */
export default async function Dossier({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigerSession('R06');
  const { id } = await params;
  const d = await espaces.dossier(s, decodeURIComponent(id));
  if (!d) notFound();
  const candidats = await espaces.candidats(s, d);
  const i = d.identite;
  return (
    <>
      <p><Link href="/espace/file"><Icone nom="arrow-left" taille={16} /> Retour à la file</Link></p>
      <TitreEspace titre={`Dossier ${d.numeroDossier}`} chapo={d.motif ?? undefined} />
      {(d.alerte || d.enRetard) && <Alerte type="avertissement" titre="Échéance proche">Réponse attendue avant le {dateHeure(d.echeance)}.</Alerte>}

      <section className="cj-panneau" aria-labelledby="t-identite">
        <h2 id="t-identite">Identité déclarée</h2>
        <ListeDescription elements={[
          { terme: 'Nom', valeur: i.nom }, { terme: 'Prénoms', valeur: i.prenoms },
          { terme: 'Date de naissance', valeur: dateLongue(i.dateNaissance) }, { terme: 'Lieu de naissance', valeur: i.lieuNaissance },
          { terme: 'Père', valeur: i.nomPere ?? '—' }, { terme: 'Mère', valeur: i.nomMere ?? '—' },
          { terme: 'Profil', valeur: libellesProfils[d.profil] ?? d.profil }, { terme: 'CNIE', valeur: i.numeroCnie ?? '—' },
        ]} />
        {d.explicationRapprochement && <p className="p-note"><Icone nom="info" taille={18} /><span>{d.explicationRapprochement}</span></p>}
      </section>

      <section className="cj-panneau" aria-labelledby="t-decision">
        <h2 id="t-decision">Décision sur l’identité</h2>
        <form action={deciderIdentite} className="cj-pile">
          <input type="hidden" name="id" value={d.id} />
          <fieldset className="cj-pile" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="cj-champ__libelle">Le demandeur correspond à :</legend>
            {candidats.map((c) => (
              <ChoixCarte key={c.reference} name="personneId" value={c.reference} icone="user-check" required
                titre={`${c.nom} ${c.prenoms} — fiche existante`}
                description={`Né le ${dateLongue(c.dateNaissance)} à ${c.lieuNaissance ?? '—'}${c.nomPere ? `, père ${c.nomPere}` : ''}`} />
            ))}
            <ChoixCarte name="personneId" value="" icone="circle-check" required titre="Aucune fiche : absence au casier"
              description="Le demandeur n’est pas la personne des fiches proches. Le bulletin portera « néant » si aucune condamnation." />
          </fieldset>
          <ZoneTexte id="motivation" name="motivation" libelle="Motivation" requis rows={3} maxLength={1000}
            aide="Éléments vérifiés (pièces, filiation, date de naissance). La motivation est journalisée." />
          <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-start' }}>
            <Icone nom="check" taille={20} /><span>Enregistrer la décision</span>
          </button>
        </form>
      </section>

      <div className="cj-grille cj-grille--2">
        <section className="cj-panneau" aria-labelledby="t-piece">
          <h2 id="t-piece">Demander une pièce</h2>
          <form action={demanderPiece} className="cj-pile">
            <input type="hidden" name="id" value={d.id} />
            <Champ id="piece" name="piece" libelle="Pièce demandée" requis maxLength={300} placeholder="Copie intégrale de l’acte de naissance" />
            <p className="p-note p-note--discrete">Le délai de 24 heures est suspendu jusqu’au dépôt (RG-09).</p>
            <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>Demander la pièce</button>
          </form>
        </section>
        <section className="cj-panneau" aria-labelledby="t-rejet">
          <h2 id="t-rejet">Rejeter la demande</h2>
          <form action={rejeterDemande} className="cj-pile">
            <input type="hidden" name="id" value={d.id} />
            <ZoneTexte id="motif" name="motif" libelle="Motif communiqué à l’usager" requis rows={2} maxLength={1000} />
            <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>Rejeter</button>
          </form>
        </section>
      </div>
    </>
  );
}
