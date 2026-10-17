import Link from 'next/link';
import { Alerte, Carte, Champ, ConteneurTableau, Icone, TuileIndicateur, classesBouton, type NomIcone } from '@casier/design-system';

import { BulletinSpecimen } from '@/components/BulletinSpecimen';
import { tarifs } from '@/lib/api';
import { fcfa } from '@/lib/contenu';

export const dynamic = 'force-dynamic';

const ETAPES: { titre: string; texte: string; icone: NomIcone }[] = [
  { titre: 'Je fais ma demande', texte: 'En ligne, en cinq écrans au plus, avec mon identité numérique ou mes pièces d’identité.', icone: 'file-text' },
  { titre: 'Je paie', texte: 'Par Mobile Money ou carte bancaire. Je reçois un reçu et un code de suivi par SMS.', icone: 'smartphone' },
  { titre: 'Le casier vérifie', texte: 'Quand mon identité est certaine, le bulletin est émis aussitôt ; sinon un agent vérifie sous 24 heures.', icone: 'shield-check' },
  { titre: 'Je télécharge mon bulletin', texte: 'Scellé électroniquement, avec un QR code que tout employeur peut vérifier.', icone: 'download' },
];

const PROFILS: { titre: string; texte: string; href: string; icone: NomIcone }[] = [
  { titre: 'Gabonais résidant au Gabon', texte: 'Demandez votre bulletin n°3 en ligne et recevez-le dans votre espace.', href: '/bulletin-n3', icone: 'house' },
  { titre: 'Gabonais de l’étranger', texte: 'Faites votre demande en ligne ou auprès de votre consulat.', href: '/diaspora', icone: 'plane' },
  { titre: 'Étrangers résidant au Gabon', texte: 'Votre demande est traitée par l’administration centrale.', href: '/etrangers', icone: 'globe' },
  { titre: 'Administrations et employeurs', texte: 'Bulletin n°2 pour les organismes habilités ; vérification d’un bulletin remis.', href: '/administrations', icone: 'building-2' },
];

const QUESTIONS = [
  { q: 'Qu’est-ce que le bulletin n°3 ?', r: 'C’est l’extrait du casier judiciaire que vous pouvez obtenir pour vous-même, par exemple pour un emploi ou un concours. Il ne mentionne que certaines condamnations, selon les règles fixées par le Code de procédure pénale.' },
  { q: 'Puis-je demander le bulletin d’une autre personne ?', r: 'Non. Le bulletin n°3 est strictement personnel : seule la personne concernée peut le demander, après vérification de son identité.' },
  { q: 'Combien de temps faut-il ?', r: '24 heures au plus après le paiement, et souvent immédiatement lorsque votre identité est certaine. Le délai est suspendu si une pièce complémentaire vous est demandée.' },
  { q: 'Comment un employeur vérifie-t-il mon bulletin ?', r: 'En scannant le QR code ou en saisissant le code de vérification imprimé sur le bulletin. La vérification est gratuite et ne demande pas de compte.' },
];

export default async function Accueil() {
  const liste = await tarifs().catch(() => []);
  const b3 = liste.find((t) => t.acte === 'BULLETIN_N3' && t.profil === 'GABONAIS_NE_AU_GABON');

  return (
    <>
      <section className="p-ouverture" aria-labelledby="titre-ouverture">
        <div className="cj-conteneur p-ouverture__grille">
          <div>
            <p className="p-ouverture__surtitre"><Icone nom="landmark" taille={16} />Service public en ligne</p>
            <h1 id="titre-ouverture">Votre extrait de casier judiciaire <em>en 24 heures</em>, sans vous déplacer</h1>
            <p className="p-ouverture__chapo">
              Demandez votre bulletin n°3, suivez votre dossier et vérifiez l’authenticité d’un bulletin, depuis votre téléphone.
            </p>
            <div className="p-ouverture__actions">
              <Link href="/demande" className={classesBouton({ taille: 'l' })}>
                <Icone nom="file-text" taille={20} /><span>Demander mon bulletin</span>
              </Link>
              <Link href="/suivi" className={classesBouton({ variante: 'inverse', taille: 'l' })}>
                <Icone nom="search" taille={20} /><span>Suivre ma demande</span>
              </Link>
              <Link href="/verifier" className={classesBouton({ variante: 'inverse', taille: 'l' })}>
                <Icone nom="qr-code" taille={20} /><span>Vérifier un bulletin</span>
              </Link>
            </div>
            <ul className="p-garanties">
              <li><Icone nom="id-card" taille={18} />Identité numérique (CNIE)</li>
              <li><Icone nom="smartphone" taille={18} />Mobile Money ou carte</li>
              <li><Icone nom="badge-check" taille={18} />Bulletin scellé et vérifiable</li>
            </ul>
          </div>
          <div className="p-visuel">
            <img className="p-visuel__carte" src="/cartes/gabon-provinces-sombre.svg" alt="" />
            <p className="p-visuel__delai" aria-hidden="true">24 h<small>maximum</small></p>
            <BulletinSpecimen />
          </div>
        </div>
      </section>

      <section className="p-section--surface" aria-label="Le service en chiffres">
        <div className="cj-conteneur p-chiffres">
          <TuileIndicateur valeur="24 h" libelle="au plus pour délivrer" detail="contre 15 à 30 jours aujourd’hui" />
          <TuileIndicateur valeur="3 s" libelle="pour vérifier un bulletin" detail="sans compte, par QR code" />
          <TuileIndicateur valeur={b3 ? fcfa(b3.montantFcfa) : '—'} libelle="le bulletin n°3" detail={b3?.provisoire ? 'Tarif provisoire' : 'Tarif en vigueur'} />
          <TuileIndicateur valeur="100 %" libelle="des consultations tracées" detail="journal inaltérable" />
        </div>
      </section>

      <section className="p-section" aria-labelledby="titre-etapes">
        <div className="cj-conteneur">
          <div className="p-entete-section">
            <p className="p-surtitre">Comment ça marche</p>
            <h2 id="titre-etapes" className="p-titre-section">Quatre étapes, de la demande au bulletin scellé</h2>
          </div>
          <ol className="p-etapes">
            {ETAPES.map((e) => (
              <li key={e.titre} className="p-etape">
                <div className="p-etape__haut"><span className="p-etape__numero" aria-hidden="true" /><Icone nom={e.icone} className="p-etape__icone" /></div>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="p-section p-section--attenuee" aria-labelledby="titre-profils">
        <div className="cj-conteneur">
          <div className="p-entete-section">
            <p className="p-surtitre">Pour qui ?</p>
            <h2 id="titre-profils" className="p-titre-section">Une démarche adaptée à votre situation</h2>
          </div>
          <div className="cj-grille cj-grille--4">
            {PROFILS.map((p) => <Carte key={p.href} titre={p.titre} href={p.href} icone={p.icone}>{p.texte}</Carte>)}
          </div>
        </div>
      </section>

      <section className="p-section" aria-labelledby="titre-verifier">
        <div className="cj-conteneur">
          <div className="p-verifier">
            <div className="cj-pile">
              <p className="p-surtitre" style={{ color: 'var(--cj-marque-jaune)' }}>Employeurs, administrations, particuliers</p>
              <h2 id="titre-verifier" className="p-titre-section">Un bulletin vous est remis ? Vérifiez-le en quelques secondes</h2>
              <p className="p-chapo">
                Scannez le QR code du bulletin avec votre téléphone, ou saisissez le code de vérification imprimé en bas du document.
              </p>
            </div>
            <form className="p-verifier__formulaire" action="/verifier" method="get">
              <Champ id="code" name="code" libelle="Code de vérification" aide="12 caractères, par exemple DEMO-VALI-DE26"
                autoComplete="off" spellCheck={false} className="cj-champ__saisie--code" requis />
              <button type="submit" className={classesBouton({ pleineLargeur: true })}>
                <Icone nom="shield-check" taille={20} /><span>Vérifier le bulletin</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="p-section p-section--attenuee" aria-labelledby="titre-tarifs">
        <div className="cj-conteneur cj-grille cj-grille--2" style={{ alignItems: 'start' }}>
          <div className="cj-pile">
            <p className="p-surtitre">Tarifs</p>
            <h2 id="titre-tarifs" className="p-titre-section">Combien coûte un bulletin ?</h2>
            <p className="p-chapo">Le montant affiché est celui du référentiel en vigueur à la date de votre paiement.</p>
            <Link href="/tarifs" className={classesBouton({ variante: 'secondaire' })} style={{ alignSelf: 'flex-start' }}>
              <span>Voir tous les tarifs</span><Icone nom="arrow-right" taille={20} />
            </Link>
          </div>
          <div className="cj-pile">
            {liste.length > 0 && liste.some((t) => t.provisoire) && (
              <Alerte type="avertissement" titre="Tarifs provisoires">
                Le barème n’est pas encore fixé par un texte. Les montants peuvent évoluer.
              </Alerte>
            )}
            <ConteneurTableau libelle="Tarifs principaux">
              <table className="cj-tableau">
                <caption className="cj-visuellement-masque">Tarifs principaux</caption>
                <thead><tr><th scope="col">Acte</th><th scope="col" className="cj-nombre">Montant</th></tr></thead>
                <tbody>
                  {liste.slice(0, 4).map((t) => (
                    <tr key={t.acte + t.profil}><td>{t.libelle}</td><td className="cj-nombre">{fcfa(t.montantFcfa)}</td></tr>
                  ))}
                  {liste.length === 0 && <tr><td colSpan={2}>Tarifs momentanément indisponibles.</td></tr>}
                </tbody>
              </table>
            </ConteneurTableau>
          </div>
        </div>
      </section>

      <section className="p-section" aria-labelledby="titre-faq">
        <div className="cj-conteneur" style={{ maxWidth: 880 }}>
          <div className="p-entete-section">
            <p className="p-surtitre">Questions fréquentes</p>
            <h2 id="titre-faq" className="p-titre-section">Vos questions, nos réponses</h2>
          </div>
          <div className="cj-faq">
            {QUESTIONS.map((x) => (
              <details key={x.q}>
                <summary>{x.q}<Icone nom="chevron-down" /></summary>
                <div><p>{x.r}</p></div>
              </details>
            ))}
          </div>
          <p style={{ marginTop: 'var(--cj-espace-6)' }}><Link href="/aide">Toutes les questions et les tutoriels</Link></p>
        </div>
      </section>
    </>
  );
}
