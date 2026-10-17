import Link from 'next/link';
import { Alerte, Icone, classesBouton, type NomIcone } from '@casier/design-system';

import { config } from '@/lib/config';
import { dateHeure, dateLongue } from '@/lib/format';
import type { ResultatVerification as Resultat, StatutVerification } from '@/lib/types';

const PRESENTATION: Record<StatutVerification, { classe: string; icone: NomIcone; titre: string; texte: string }> = {
  VALIDE: { classe: 'valide', icone: 'circle-check', titre: 'Bulletin authentique et valide',
    texte: 'Ce bulletin a bien été émis par le casier judiciaire national et il est en cours de validité.' },
  EXPIRE: { classe: 'expire', icone: 'clock', titre: 'Bulletin authentique, mais expiré',
    texte: 'Ce bulletin a bien été émis par le casier judiciaire national, mais sa durée de validité est dépassée. Demandez un bulletin récent.' },
  REVOQUE: { classe: 'revoque', icone: 'shield-alert', titre: 'Bulletin révoqué : il n’a plus de valeur',
    texte: 'Ce bulletin a été annulé par le greffier en chef. Il ne doit pas être accepté (BUL-10).' },
  INCONNU: { classe: 'inconnu', icone: 'circle-x', titre: 'Aucun bulletin ne correspond',
    texte: 'Ce code ne correspond à aucun bulletin émis. Vérifiez la saisie ; si le code est exact, le document n’est pas authentique.' },
};

const TYPES = { B1: 'Bulletin n°1', B2: 'Bulletin n°2', B3: 'Bulletin n°3' } as const;

/**
 * Résultat de vérification (BUL-07) : authenticité, type, dates, statut et identité minimale pour rapprocher
 * le document de la personne. Jamais le contenu du casier.
 */
export function ResultatVerification({ resultat }: { resultat: Resultat }) {
  const p = PRESENTATION[resultat.statut];
  return (
    <section className={`p-resultat p-resultat--${p.classe}`} aria-labelledby="titre-resultat">
      <div className="p-resultat__entete">
        <span className="p-resultat__pictogramme"><Icone nom={p.icone} taille={36} /></span>
        <div>
          <h2 id="titre-resultat" className="p-resultat__titre">{p.titre}</h2>
          <p>{p.texte}</p>
        </div>
      </div>
      {resultat.authentique && (
        <dl>
          <dt>Document</dt><dd>{resultat.type ? TYPES[resultat.type] : '—'} · {resultat.numero}</dd>
          <dt>Nom</dt><dd className="p-identite">{resultat.nom}</dd>
          <dt>Prénoms</dt><dd className="p-identite">{resultat.prenoms}</dd>
          <dt>Date de naissance</dt><dd>{dateLongue(resultat.dateNaissance)}</dd>
          <dt>Émis le</dt><dd>{dateHeure(resultat.dateEmission)}</dd>
          <dt>{resultat.statut === 'EXPIRE' ? 'Expiré depuis le' : 'Valable jusqu’au'}</dt><dd>{dateLongue(resultat.dateExpiration)}</dd>
        </dl>
      )}
      {resultat.authentique && resultat.statut !== 'REVOQUE' && (
        <Alerte type="info" titre="Rapprochez ces informations du document et de la personne">
          Le nom, les prénoms, la date de naissance et le numéro doivent être identiques sur le bulletin remis et sur la pièce d’identité.
          Cette page n’affiche jamais le contenu du casier judiciaire.
        </Alerte>
      )}
      {!resultat.authentique && (
        <Alerte type="avertissement" titre="Vous pensez avoir reçu un faux document ?">
          Ne l’acceptez pas et signalez-le au service du casier judiciaire, au {config.supportTelephone}.
        </Alerte>
      )}
      <p className="p-resultat__horodatage">Vérification effectuée le {dateHeure(new Date().toISOString())}.</p>
      <div className="p-page-entete__actions">
        <Link href="/verifier" className={classesBouton({ variante: 'secondaire' })}>
          <Icone nom="refresh-cw" taille={20} /><span>Vérifier un autre bulletin</span>
        </Link>
      </div>
    </section>
  );
}
