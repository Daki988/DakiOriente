import Link from 'next/link';
import { Alerte, Badge, Champ, Icone, TuileIndicateur, classesBouton } from '@casier/design-system';

import { TitreEspace } from '@/components/TitreEspace';
import { fcfa, libellesProfils } from '@/lib/contenu';
import { demoEspaces } from '@/lib/demo-espaces';
import { espaces, exigerSession } from '@/lib/espaces';
import { dateHeure } from '@/lib/format';
import type { EtapeParcours, ParcoursDossier, PhaseParcours, StatutDemande } from '@/lib/types';

const PHASES: { code: PhaseParcours | 'VERIFICATION'; nom: string }[] = [
  { code: 'DEMANDE', nom: 'Demande' }, { code: 'PAIEMENT', nom: 'Paiement' }, { code: 'TRAITEMENT', nom: 'Traitement' },
  { code: 'DELIVRANCE', nom: 'Délivrance' }, { code: 'IMPRESSION', nom: 'Impression' }, { code: 'VERIFICATION', nom: 'Vérification' },
];
const STATUTS: Record<StatutDemande, { ton: 'succes' | 'info' | 'alerte' | 'erreur'; libelle: string }> = {
  EN_ATTENTE_PAIEMENT: { ton: 'alerte', libelle: 'En attente de paiement' }, EN_TRAITEMENT: { ton: 'info', libelle: 'En traitement' },
  A_TRAITER_PAR_AGENT: { ton: 'info', libelle: 'Chez un agent' }, EN_ATTENTE_PIECE: { ton: 'alerte', libelle: 'Pièce attendue' },
  DELIVREE: { ton: 'succes', libelle: 'Délivré' }, REJETEE: { ton: 'erreur', libelle: 'Rejeté' },
};

function duree(minutes: number) {
  if (minutes < 1) return 'moins d’une minute';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  if (h < 48) return `${h} h ${String(minutes % 60).padStart(2, '0')}`;
  return `${Math.round(h / 24)} jours`;
}

/** Suivi d'un dossier de A à Z (direction centrale, auditeur) : phases, chronologie, auteurs désignés par leur fonction. */
export default async function Suivi({ searchParams }: { searchParams: Promise<{ numero?: string }> }) {
  const s = await exigerSession('R08', 'R12');
  const numero = (await searchParams).numero?.trim().toUpperCase().slice(0, 30) ?? '';
  const parcours = numero ? await espaces.parcours(s, numero) : null;
  const exemples = s.demo ? demoEspaces.exemplesParcours() : [];
  return (
    <>
      <TitreEspace titre="Suivi d’un dossier de A à Z"
        chapo="De la demande à la vérification du bulletin par un employeur : chaque étape, sa date, la fonction de son auteur et le temps écoulé. La consultation est journalisée." />
      <form method="get" className="cj-formulaire-ligne" role="search" aria-label="Rechercher un dossier">
        <Champ id="numero" name="numero" libelle="Numéro de dossier" defaultValue={numero} placeholder="CJ-2026-000087" maxLength={30} required autoComplete="off" />
        <button type="submit" className={classesBouton()} style={{ alignSelf: 'flex-end' }}><Icone nom="search" taille={20} /><span>Suivre</span></button>
      </form>
      {exemples.length > 0 && (
        <p className="p-note"><Icone nom="info" taille={18} /><span>Dossiers de démonstration :{' '}
          {exemples.map((e, i) => <span key={e}>{i > 0 && ', '}<Link href={`/espace/suivi?numero=${e}`}>{e}</Link></span>)}</span></p>
      )}
      {numero && !parcours && <Alerte type="avertissement" titre="Dossier introuvable">Aucun dossier ne porte le numéro {numero}.</Alerte>}
      {parcours && <Parcours p={parcours} />}
    </>
  );
}

function Parcours({ p }: { p: ParcoursDossier }) {
  const d = p.dossier;
  const parPhase = (code: string) => d.etapes.filter((e) => e.phase === code);
  const statut = STATUTS[d.statut];
  const derniere = d.etapes.at(-1);
  return (
    <>
      <section className="cj-panneau" aria-labelledby="titre-dossier">
        <div className="cj-actions" style={{ justifyContent: 'space-between' }}>
          <h2 id="titre-dossier">Dossier {d.numeroDossier}</h2>
          <Badge ton={statut.ton}>{statut.libelle}</Badge>
        </div>
        <div className="cj-grille cj-grille--4">
          <TuileIndicateur valeur={d.delaiDelivranceMinutes === null ? '—' : duree(d.delaiDelivranceMinutes)} libelle="Du paiement au bulletin" />
          <TuileIndicateur valeur={derniere ? duree(derniere.minutes) : '—'} libelle="Durée totale suivie" detail="Depuis le dépôt" />
          <TuileIndicateur valeur={new Set(d.etapes.map((e) => e.acteur)).size} libelle="Intervenants" detail="Fonctions distinctes" />
          <TuileIndicateur valeur={p.verifications} libelle="Vérifications" detail="Par des employeurs ou administrations" />
        </div>
        <p>
          {libellesProfils[d.profil] ?? d.profil} · déposé le {dateHeure(d.deposeLe)}
          {d.payeLe && <> · payé le {dateHeure(d.payeLe)}{d.moyenPaiement ? ` (${d.moyenPaiement})` : ''} · {fcfa(d.montantFcfa)}</>}
          {d.bulletinNumero && <> · bulletin {d.bulletinNumero}</>}
        </p>
        <ol className="p-phases" aria-label="Phases du parcours">
          {PHASES.map((ph) => {
            const etapes = ph.code === 'VERIFICATION' ? [] : parPhase(ph.code);
            const fait = ph.code === 'VERIFICATION' ? p.verifications > 0 : etapes.length > 0;
            const attente = !fait && ph.code === 'TRAITEMENT' && (d.statut === 'EN_ATTENTE_PIECE' || d.statut === 'A_TRAITER_PAR_AGENT');
            return (
              <li key={ph.code} data-etat={fait ? 'fait' : attente ? 'attente' : 'a-venir'}>
                <span className="p-phases__nom">{ph.nom}</span>
                <span className="p-phases__detail">
                  {ph.code === 'VERIFICATION' ? (p.verifications > 0 ? `${p.verifications} vérification${p.verifications > 1 ? 's' : ''}` : 'Pas encore')
                    : fait ? `${dateHeure(etapes[0].horodatage)}` : attente ? 'En cours' : 'À venir'}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
      <section className="cj-panneau" aria-labelledby="titre-chronologie">
        <h2 id="titre-chronologie">Chronologie</h2>
        {d.etapes.length === 0 ? <p>Aucune étape tracée.</p> : (
          <ol className="p-chronologie">
            {d.etapes.map((e, i) => <Etape key={i} e={e} />)}
          </ol>
        )}
        <p className="p-note p-note--discrete"><Icone nom="shield-check" taille={16} />
          <span>Étapes tirées du journal d’audit infalsifiable. Les agents sont désignés par leur fonction, jamais par leur nom.</span></p>
      </section>
    </>
  );
}

function Etape({ e }: { e: EtapeParcours }) {
  return (
    <li>
      <span className="p-chronologie__entete">
        <span className="p-chronologie__date">{dateHeure(e.horodatage)} · {e.minutes < 1 ? 'au dépôt' : `après ${duree(e.minutes)}`}</span>
        <Badge ton="neutre">{e.acteur}</Badge>
      </span>
      <span className="p-chronologie__libelle">{e.libelle}</span>
      {e.precision && <span className="p-chronologie__precision">{e.precision}</span>}
    </li>
  );
}
