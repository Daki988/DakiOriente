import Link from 'next/link';
import { BlocMarque, Icone, classesBouton } from '@casier/design-system';

import { config } from '@/lib/config';
import { navigation } from '@/lib/contenu';
import { NavPrincipale } from './NavPrincipale';

/** En-tête institutionnel sur une ligne (VIS-02) : bloc-marque, nom du service, navigation, connexion. Menu mobile sans JavaScript. */
export function EnTetePortail() {
  return (
    <header className="cj-en-tete">
      <div className="cj-conteneur cj-en-tete__barre">
        <div className="cj-en-tete__gauche">
          <BlocMarque embleme={config.embleme} href="/" />
          <Link href="/" className="cj-en-tete__service">
            {config.nomService}
            <small>Bulletin n°3 en ligne</small>
          </Link>
        </div>
        <div className="cj-en-tete__droite">
          <nav aria-label="Navigation principale"><NavPrincipale liens={navigation} /></nav>
          <Link href="/connexion" className={classesBouton({ variante: 'secondaire' })}>
            <Icone nom="log-in" taille={18} /><span>Se connecter</span>
          </Link>
        </div>
        <details className="cj-menu-mobile">
          <summary><Icone nom="menu" taille={20} /><span>Menu</span></summary>
          <div className="cj-menu-mobile__panneau">
            <nav aria-label="Menu principal">
              <ul>
                {navigation.map((l) => <li key={l.href}><Link href={l.href}>{l.libelle}</Link></li>)}
                <li><Link href="/diaspora">Gabonais de l’étranger</Link></li>
                <li><Link href="/administrations">Administrations et employeurs</Link></li>
              </ul>
            </nav>
            <div className="cj-pile">
              <Link href="/demande" className={classesBouton({ pleineLargeur: true })}>Demander mon bulletin</Link>
              <Link href="/connexion" className={classesBouton({ variante: 'secondaire', pleineLargeur: true })}>Se connecter</Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
