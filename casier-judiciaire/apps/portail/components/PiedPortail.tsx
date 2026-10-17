import Link from 'next/link';
import { BlocMarque, FiletTricolore } from '@casier/design-system';

import { config } from '@/lib/config';

/** Pied de page officiel (VIS-02) et liens vers les pages légales (PUB-15). */
export function PiedPortail() {
  return (
    <footer className="cj-pied">
      <FiletTricolore />
      <div className="cj-conteneur">
        <div className="cj-pied__haut">
          <div>
            <BlocMarque embleme={config.embleme} />
            <p className="cj-pied__texte">
              Service public du casier judiciaire. Le service ne vous demandera jamais de code ni de paiement par téléphone.
            </p>
          </div>
          <div>
            <p className="cj-pied__titre">Démarches</p>
            <ul>
              <li><Link href="/demande">Demander un bulletin n°3</Link></li>
              <li><Link href="/suivi">Suivre une demande</Link></li>
              <li><Link href="/verifier">Vérifier un bulletin</Link></li>
              <li><Link href="/tarifs">Tarifs</Link></li>
            </ul>
          </div>
          <div>
            <p className="cj-pied__titre">Informations</p>
            <ul>
              <li><Link href="/bulletin-n3">Le bulletin n°3</Link></li>
              <li><Link href="/diaspora">Gabonais de l’étranger</Link></li>
              <li><Link href="/etrangers">Étrangers résidant au Gabon</Link></li>
              <li><Link href="/administrations">Administrations et employeurs</Link></li>
              <li><Link href="/chiffres">Le service en chiffres</Link></li>
            </ul>
          </div>
          <div>
            <p className="cj-pied__titre">Nous joindre</p>
            <ul>
              <li><Link href="/aide">Aide et questions fréquentes</Link></li>
              <li><Link href="/contact">Contact et réclamation</Link></li>
              <li><a href={`tel:${config.supportTelephone.replace(/\s/g, '')}`}>{config.supportTelephone}</a></li>
            </ul>
          </div>
        </div>
        <div className="cj-pied__bas">
          <span>République gabonaise · Union – Travail – Justice</span>
          <span>
            <Link href="/mentions-legales">Mentions légales</Link> · <Link href="/confidentialite">Confidentialité</Link> ·{' '}
            <Link href="/accessibilite">Accessibilité : partiellement conforme</Link> · <Link href="/plan-du-site">Plan du site</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
