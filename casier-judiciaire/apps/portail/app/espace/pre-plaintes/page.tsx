import Link from 'next/link';
import { Alerte, Badge, Champ, Icone, ListeDescription, TuileIndicateur, classesBouton } from '@casier/design-system';

import { MessageAction } from '@/components/MessageAction';
import { TitreEspace } from '@/components/TitreEspace';
import { fcfa } from '@/lib/contenu';
import { espaces, exigerSession } from '@/lib/espaces';
import { dateHeure, dateLongue } from '@/lib/format';
import { STATUTS_PREPLAINTE, libelleNature } from '@/lib/preplainte';
import type { Preplainte, StatutPreplainte } from '@/lib/types';
import { constaterSignaturePreplainte, fixerRendezVousPreplainte } from '../actions';

const ONGLETS: { statut: StatutPreplainte | 'TOUS'; libelle: string }[] = [
  { statut: 'RECUE', libelle: 'À contacter' }, { statut: 'RENDEZ_VOUS_FIXE', libelle: 'Rendez-vous fixés' },
  { statut: 'PLAINTE_SIGNEE', libelle: 'Signées' }, { statut: 'TOUS', libelle: 'Toutes' },
];

/** Pré-plaintes en ligne : l'officier de police judiciaire fixe le rendez-vous puis constate la signature (lecture seule pour la direction). */
export default async function Preplaintes({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const s = await exigerSession('R15', 'R08');
  const opj = s.roles.includes('R15');
  const { statut } = await searchParams;
  const filtre = ONGLETS.find((o) => o.statut === statut)?.statut ?? 'RECUE';
  const liste = await espaces.preplaintes(s);
  const n = (st: StatutPreplainte) => liste.filter((p) => p.statut === st).length;
  const visibles = filtre === 'TOUS' ? liste : liste.filter((p) => p.statut === filtre);
  return (
    <>
      <TitreEspace titre="Pré-plaintes en ligne"
        chapo="Contactez la victime, fixez le rendez-vous, puis constatez la signature de la plainte. Sans signature sous 30 jours, la pré-plainte expire." />
      <MessageAction session={s} />
      {!opj && <Alerte type="info" titre="Lecture seule">Le traitement des pré-plaintes est réservé aux officiers de police judiciaire.</Alerte>}
      <div className="cj-grille cj-grille--4">
        <TuileIndicateur valeur={n('RECUE')} libelle="À contacter" />
        <TuileIndicateur valeur={n('RENDEZ_VOUS_FIXE')} libelle="Rendez-vous fixés" />
        <TuileIndicateur valeur={n('PLAINTE_SIGNEE')} libelle="Plaintes signées" />
        <TuileIndicateur valeur={n('EXPIREE')} libelle="Expirées" detail="Non signées dans le délai" />
      </div>
      <nav aria-label="Filtrer les pré-plaintes" className="cj-actions">
        {ONGLETS.map((o) => (
          <Link key={o.statut} href={`/espace/pre-plaintes?statut=${o.statut}`} aria-current={o.statut === filtre ? 'page' : undefined}
            className={classesBouton({ variante: o.statut === filtre ? 'primaire' : 'secondaire' })}>{o.libelle}</Link>
        ))}
      </nav>
      {visibles.length === 0 && <Alerte type="succes" titre="Rien dans cette liste">Aucune pré-plainte.</Alerte>}
      {visibles.map((p) => <FichePreplainte key={p.id} p={p} opj={opj} />)}
    </>
  );
}

function FichePreplainte({ p, opj }: { p: Preplainte; opj: boolean }) {
  const st = STATUTS_PREPLAINTE[p.statut];
  const ouverte = p.statut === 'RECUE' || p.statut === 'RENDEZ_VOUS_FIXE';
  return (
    <section className="cj-panneau" aria-labelledby={`p-${p.id}`}>
      <div className="cj-actions" style={{ justifyContent: 'space-between' }}>
        <h2 id={`p-${p.id}`}>{p.numero} · {libelleNature(p.nature)}</h2>
        <Badge ton={st.ton}>{st.libelle}</Badge>
      </div>
      <ListeDescription elements={[
        { terme: 'Victime', valeur: `${p.declarant.prenoms} ${p.declarant.nom}${p.declarant.entreprise ? ` (${p.declarant.entreprise})` : ''} · ${p.declarant.telephone}` },
        { terme: 'Faits', valeur: `${dateLongue(p.dateFaits)}${p.heureFaits ? `, ${p.heureFaits}` : ''} · ${p.lieu}, ${p.ville}` },
        { terme: 'Récit', valeur: p.description },
        ...(p.auteurInfos ? [{ terme: 'Auteur', valeur: p.auteurInfos }] : [{ terme: 'Auteur', valeur: p.auteurConnu ? 'Connu' : 'Inconnu' }]),
        ...(p.biens ? [{ terme: 'Biens', valeur: p.biens }] : []),
        ...(p.prejudiceFcfa != null ? [{ terme: 'Préjudice', valeur: fcfa(p.prejudiceFcfa) }] : []),
        { terme: 'Service choisi', valeur: p.service },
        { terme: 'Déposée le', valeur: `${dateHeure(p.creeLe)}${ouverte ? ` · à signer avant le ${dateLongue(p.expireLe)}` : ''}` },
        ...(p.rendezVousLe ? [{ terme: 'Rendez-vous', valeur: `${dateHeure(p.rendezVousLe)} · ${p.rendezVousLieu}` }] : []),
        ...(p.numeroProcedure ? [{ terme: 'Procédure', valeur: `${p.numeroProcedure}, signée le ${dateHeure(p.signeeLe)}` }] : []),
      ]} />
      {opj && ouverte && (
        <div className="cj-pile">
          <form action={fixerRendezVousPreplainte} className="cj-formulaire-ligne">
            <input type="hidden" name="id" value={p.id} />
            <Champ id={`le-${p.id}`} name="le" type="datetime-local" libelle={p.rendezVousLe ? 'Déplacer le rendez-vous' : 'Date et heure du rendez-vous'} requis />
            <Champ id={`lieu-${p.id}`} name="lieu" libelle="Lieu" requis maxLength={200} defaultValue={p.rendezVousLieu ?? `${p.service}, bureau des plaintes`} />
            <button type="submit" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-end' }}>
              <Icone nom="calendar" taille={20} /><span>Fixer le rendez-vous</span>
            </button>
          </form>
          <form action={constaterSignaturePreplainte} className="cj-formulaire-ligne">
            <input type="hidden" name="id" value={p.id} />
            <Champ id={`proc-${p.id}`} name="numeroProcedure" libelle="N° de procédure de la plainte signée" requis maxLength={60} placeholder="PV-2026-0457" autoComplete="off" />
            <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-end' }}><Icone nom="file-check" taille={20} /><span>Plainte signée</span></button>
          </form>
        </div>
      )}
    </section>
  );
}
