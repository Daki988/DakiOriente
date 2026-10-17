'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Alerte, Badge, Champ, FriseEtat, Icone, classesBouton, type EtatFrise } from '@casier/design-system';

import { suivreAction, type EtatSuivi } from '@/app/suivi/actions';
import { dateHeure } from '@/lib/format';
import type { StatutDemande, SuiviDemande } from '@/lib/types';

const TON: Record<StatutDemande, 'succes' | 'info' | 'alerte' | 'erreur' | 'neutre'> = {
  EN_ATTENTE_PAIEMENT: 'alerte', EN_TRAITEMENT: 'info', A_TRAITER_PAR_AGENT: 'info', EN_ATTENTE_PIECE: 'alerte', DELIVREE: 'succes', REJETEE: 'erreur',
};

/** Frise d'état (PUB-07) : étapes passées, étape courante, puis délivrance à venir. */
function etapes(s: SuiviDemande) {
  const termine = s.statut === 'DELIVREE' || s.statut === 'REJETEE';
  const liste: { libelle: string; date?: string; etat: EtatFrise }[] = s.frise.map((e, i) => {
    const derniere = i === s.frise.length - 1;
    const etat: EtatFrise = !derniere || termine ? 'fait' : e.statut === 'EN_ATTENTE_PIECE' || e.statut === 'EN_ATTENTE_PAIEMENT' ? 'bloque' : 'en-cours';
    return { libelle: e.libelle, date: dateHeure(e.horodatage), etat };
  });
  if (!termine) liste.push({ libelle: 'Bulletin disponible dans votre espace', etat: 'a-venir' });
  return liste;
}

function Resultat({ suivi }: { suivi: SuiviDemande }) {
  return (
    <section className="p-parcours__panneau" aria-labelledby="titre-suivi">
      <div className="p-suivi__entete">
        <div>
          <p className="p-surtitre">Dossier {suivi.numeroDossier}</p>
          <h2 id="titre-suivi">{suivi.libelle}</h2>
        </div>
        <Badge ton={TON[suivi.statut]}>{suivi.statut === 'DELIVREE' ? 'Délivré' : suivi.statut === 'REJETEE' ? 'Rejeté' : 'En cours'}</Badge>
      </div>
      {suivi.statut === 'EN_ATTENTE_PIECE' && (
        <Alerte type="avertissement" titre="Une pièce vous est demandée">
          Le délai de 24 heures est suspendu jusqu’à la réception de la pièce (RG-09). Déposez-la depuis votre espace, en photo depuis votre téléphone.
        </Alerte>
      )}
      {suivi.echeance && suivi.statut !== 'DELIVREE' && suivi.statut !== 'REJETEE' && suivi.statut !== 'EN_ATTENTE_PIECE' && (
        <p className="p-note"><Icone nom="timer" taille={18} /><span>Réponse au plus tard le {dateHeure(suivi.echeance)}.</span></p>
      )}
      <FriseEtat etapes={etapes(suivi)} />
      <div className="p-page-entete__actions">
        {suivi.statut === 'DELIVREE' && (
          <Link href="/connexion" className={classesBouton()}><Icone nom="download" taille={20} /><span>Télécharger mon bulletin</span></Link>
        )}
        {suivi.statut === 'EN_ATTENTE_PIECE' && (
          <Link href="/connexion" className={classesBouton()}><Icone nom="upload" taille={20} /><span>Déposer la pièce</span></Link>
        )}
        {suivi.statut === 'EN_ATTENTE_PAIEMENT' && (
          <Link href={`/paiement-tresor?numero=${encodeURIComponent(suivi.numeroDossier)}`} className={classesBouton()}>
            <Icone nom="landmark" taille={20} /><span>J’ai payé au Trésor : saisir l’identifiant</span>
          </Link>
        )}
        <Link href="/suivi" className={classesBouton({ variante: 'secondaire' })}><span>Suivre un autre dossier</span></Link>
      </div>
    </section>
  );
}

/** Formulaire de suivi : fonctionne aussi avant le chargement du JavaScript (amélioration progressive, PUB-18). */
export function FormulaireSuivi() {
  const [etat, action, enCours] = useActionState<EtatSuivi, FormData>(suivreAction, { numero: '', code: '' });
  if (etat.suivi) return <Resultat suivi={etat.suivi} />;
  return (
    <form action={action} className="p-parcours__panneau" noValidate>
      <h2>Retrouver ma demande</h2>
      {etat.message && <Alerte type={etat.message.type} titre={etat.message.titre}>{etat.message.texte}</Alerte>}
      <div className="p-parcours__champs p-parcours__champs--2">
        <Champ id="numero" name="numero" libelle="Numéro de dossier" aide="Sur votre reçu et dans le SMS de confirmation. Ex. : CJ-2026-000123"
          defaultValue={etat.numero} erreur={etat.erreurs?.numero} autoComplete="off" autoCapitalize="characters" spellCheck={false} requis />
        <Champ id="code" name="code" libelle="Code de suivi" aide="6 chiffres reçus par SMS" inputMode="numeric" autoComplete="one-time-code"
          maxLength={6} erreur={etat.erreurs?.code} requis />
      </div>
      <div className="p-parcours__navigation">
        <Link href="/aide#code-perdu">Code perdu ?</Link>
        <button type="submit" className={classesBouton()} disabled={enCours} aria-disabled={enCours}>
          <Icone nom="search" taille={20} /><span>{enCours ? 'Recherche…' : 'Voir l’état de ma demande'}</span>
        </button>
      </div>
    </form>
  );
}
