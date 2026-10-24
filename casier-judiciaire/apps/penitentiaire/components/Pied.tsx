import Link from 'next/link';
import { BlocMarque, FiletTricolore } from '@casier/design-system';

import { config } from '@/lib/config';

/** Pied de page officiel et liens vers les services de la Justice. */
export function Pied() {
  return (
    <footer className="cj-pied">
      <FiletTricolore />
      <div className="cj-conteneur">
        <div className="cj-pied__haut">
          <div>
            <BlocMarque embleme={config.embleme} />
            <p className="cj-pied__texte">
              Direction de l’administration pénitentiaire. Les informations sur une personne détenue ne sont jamais communiquées par téléphone.
            </p>
          </div>
          <div>
            <p className="cj-pied__titre">Le service</p>
            <ul>
              <li><Link href="/#missions">Missions</Link></li>
              <li><Link href="/etablissements">Établissements</Link></li>
              <li><Link href="/#familles">Familles et visites</Link></li>
            </ul>
          </div>
          <div>
            <p className="cj-pied__titre">Services de la Justice</p>
            <ul>
              <li><a href={config.portailCasier}>Casier judiciaire en ligne</a></li>
              <li><a href={`${config.portailCasier}/pre-plainte`}>Pré-plainte en ligne</a></li>
            </ul>
          </div>
          <div>
            <p className="cj-pied__titre">Professionnels</p>
            <ul>
              <li><Link href="/connexion">Accès professionnel</Link></li>
            </ul>
          </div>
        </div>
        <div className="cj-pied__bas">
          <span>République gabonaise · Union – Travail – Justice</span>
          <span><Link href="/mentions-legales">Mentions légales et données personnelles</Link></span>
        </div>
      </div>
    </footer>
  );
}
