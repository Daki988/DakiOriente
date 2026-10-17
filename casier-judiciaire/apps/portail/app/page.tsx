import Link from 'next/link';
import { Carte, EmblemeNeutre, FiletTricolore, LOGO_MINISTERE, Icone, Pastille, classesBouton, type NomIcone } from '@casier/design-system';

import { BulletinSpecimen } from '@/components/BulletinSpecimen';
import { tarifs } from '@/lib/api';
import { config } from '@/lib/config';
import { fcfa } from '@/lib/contenu';

export const dynamic = 'force-dynamic';

const ETAPES: { titre: string; texte: string }[] = [
  { titre: 'Je fais ma demande', texte: 'En ligne, en cinq écrans, avec ma CNIE ou mes pièces d’identité.' },
  { titre: 'Je paie', texte: 'Par Mobile Money ou carte bancaire. Je reçois un code de suivi par SMS.' },
  { titre: 'Le casier vérifie', texte: 'Le bulletin est émis aussitôt si mon identité est certaine, sinon sous 24 heures.' },
  { titre: 'Je télécharge mon bulletin', texte: 'Scellé électroniquement, avec un QR code vérifiable par tous.' },
];

const PROFILS: { titre: string; href: string; icone: NomIcone }[] = [
  { titre: 'Gabonais résidant au Gabon', href: '/bulletin-n3', icone: 'house' },
  { titre: 'Gabonais de l’étranger', href: '/diaspora', icone: 'plane' },
  { titre: 'Étrangers résidant au Gabon', href: '/etrangers', icone: 'globe' },
  { titre: 'Administrations et employeurs', href: '/administrations', icone: 'building-2' },
];

const QUESTIONS = [
  { q: 'Qu’est-ce que le bulletin n°3 ?', r: 'C’est l’extrait du casier judiciaire que vous pouvez obtenir pour vous-même, par exemple pour un emploi ou un concours. Il ne mentionne que certaines condamnations, selon les règles du Code de procédure pénale.' },
  { q: 'Puis-je demander le bulletin d’une autre personne ?', r: 'Non. Le bulletin n°3 est strictement personnel : seule la personne concernée peut le demander, après vérification de son identité.' },
  { q: 'Combien de temps faut-il ?', r: '24 heures au plus après le paiement, souvent immédiatement. Le délai est suspendu si une pièce complémentaire vous est demandée.' },
  { q: 'Comment un employeur vérifie-t-il mon bulletin ?', r: 'En scannant le QR code ou en saisissant le code imprimé sur le bulletin. C’est gratuit et sans compte. Le contenu du casier n’est jamais affiché.' },
];

/** PUB-01 : accueil épuré — une accroche, trois démarches, quatre étapes, les profils et une FAQ courte. */
export default async function Accueil() {
  const liste = await tarifs().catch(() => []);
  const b3 = liste.find((t) => t.acte === 'BULLETIN_N3' && t.profil === 'GABONAIS_NE_AU_GABON');

  return (
    <>
      <section className="p-accueil" aria-labelledby="titre-accueil">
        <div className="cj-conteneur p-accueil__contenu">
          <span className="p-accueil__embleme">
            {config.embleme === 'ministere'
              ? <img src={LOGO_MINISTERE} alt="" width={119} height={80} className="p-accueil__logo" />
              : config.embleme === 'officiel'
                ? <img src="/emblemes/armoiries.svg" alt="" width={72} height={69} />
                : <EmblemeNeutre taille={64} />}
          </span>
          <Pastille>Ministère de la Justice · Service public en ligne</Pastille>
          <h1 id="titre-accueil">Votre extrait de casier judiciaire, <em>en ligne</em></h1>
          <p className="p-accueil__chapo">
            Demandez votre bulletin n°3 depuis votre téléphone. Il vous est délivré en 24 heures au plus, scellé et vérifiable par QR code.
          </p>
          <div className="p-accueil__actions">
            <Link href="/demande" className={classesBouton({ taille: 'l' })}>
              <Icone nom="file-text" taille={20} /><span>Demander mon bulletin</span>
            </Link>
            <Link href="/suivi" className={classesBouton({ variante: 'secondaire', taille: 'l' })}>
              <Icone nom="search" taille={20} /><span>Suivre ma demande</span>
            </Link>
          </div>
          <p className="p-accueil__lien">
            <Link href="/verifier">Vous avez reçu un bulletin ? Vérifiez son authenticité<Icone nom="arrow-right" taille={16} /></Link>
          </p>
          <p className="p-accueil__lien">
            <Link href="/paiement-tresor">Vous avez payé au Trésor public ? Saisissez votre identifiant de paiement<Icone nom="arrow-right" taille={16} /></Link>
          </p>
          <ul className="p-reperes" aria-label="Le service en bref">
            <li><strong>24 h</strong> maximum</li>
            <li><strong>{b3 ? fcfa(b3.montantFcfa) : '—'}</strong> {b3?.provisoire ? 'tarif provisoire' : 'le bulletin'}</li>
            <li><strong>Gratuit</strong> pour vérifier</li>
          </ul>
        </div>
      </section>
      <FiletTricolore />

      <section className="p-section" aria-labelledby="titre-demarches">
        <div className="cj-conteneur">
          <div className="p-entete-centre">
            <Pastille>Vos démarches</Pastille>
            <h2 id="titre-demarches" className="p-titre-section">Trois démarches, un seul portail</h2>
            <p className="p-chapo">Sans vous déplacer au greffe, depuis un téléphone ou un ordinateur.</p>
          </div>
          <div className="cj-grille cj-grille--3">
            <Carte accent titre="Demander un bulletin n°3" href="/demande" icone="file-text"
              suite={<span>{b3 ? fcfa(b3.montantFcfa) : 'Tarif à venir'} · 24 h</span>}>
              Pour un emploi, un concours ou une démarche. Avec votre CNIE ou vos pièces d’identité.
            </Carte>
            <Carte accent titre="Suivre une demande" href="/suivi" icone="search" suite={<span>Sans compte</span>}>
              Avec le numéro de dossier et le code reçus par SMS après votre demande.
            </Carte>
            <Carte accent titre="Vérifier un bulletin" href="/verifier" icone="qr-code" suite={<span>Gratuit</span>}>
              Employeurs et administrations : scannez le QR code ou saisissez le code du bulletin.
            </Carte>
          </div>
        </div>
      </section>

      <section className="p-section p-section--attenuee" aria-labelledby="titre-etapes">
        <div className="cj-conteneur p-deux-colonnes">
          <div className="cj-pile">
            <Pastille>Comment ça marche</Pastille>
            <h2 id="titre-etapes" className="p-titre-section">Votre bulletin en quatre étapes</h2>
            <ol className="p-etapes-liste">
              {ETAPES.map((e) => (
                <li key={e.titre}>
                  <span className="p-etapes-liste__numero" aria-hidden="true" />
                  <div><h3>{e.titre}</h3><p>{e.texte}</p></div>
                </li>
              ))}
            </ol>
            <Link href="/bulletin-n3" className={classesBouton({ variante: 'tertiaire' })} style={{ alignSelf: 'flex-start' }}>
              <span>Tout savoir sur le bulletin n°3</span><Icone nom="arrow-right" taille={18} />
            </Link>
          </div>
          <div className="p-visuel-specimen"><BulletinSpecimen /></div>
        </div>
      </section>

      <section className="p-section" aria-labelledby="titre-profils">
        <div className="cj-conteneur">
          <div className="p-entete-centre">
            <Pastille>Pour qui ?</Pastille>
            <h2 id="titre-profils" className="p-titre-section">Une démarche adaptée à votre situation</h2>
            <p className="p-chapo">Vous hésitez ? <Link href="/quel-bulletin">Répondez à deux questions</Link> pour trouver la bonne démarche.</p>
          </div>
          <ul className="p-profils">
            {PROFILS.map((p) => (
              <li key={p.href}>
                <Link href={p.href}>
                  <Icone nom={p.icone} taille={22} />
                  <span>{p.titre}</span>
                  <Icone nom="arrow-right" taille={18} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="p-section" aria-labelledby="titre-faq">
        <div className="cj-conteneur p-etroit">
          <div className="p-entete-centre">
            <Pastille>FAQ</Pastille>
            <h2 id="titre-faq" className="p-titre-section">Questions fréquentes</h2>
          </div>
          <div className="cj-faq p-faq-carte">
            {QUESTIONS.map((x) => (
              <details key={x.q}>
                <summary>{x.q}<Icone nom="chevron-down" /></summary>
                <div><p>{x.r}</p></div>
              </details>
            ))}
          </div>
          <p className="p-centre"><Link href="/aide">Toutes les questions et le glossaire</Link></p>
        </div>
      </section>
    </>
  );
}
