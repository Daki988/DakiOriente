import Link from 'next/link';
import { BlocMarque, Icone, classesBouton } from '@casier/design-system';

import { config } from '@/lib/config';
import { navigation } from '@/lib/contenu';
import { NavPrincipale } from './NavPrincipale';

/** En-tête institutionnel (VIS-02) : bloc-marque, nom du service, navigation, actions. Menu mobile sans JavaScript. */
export function EnTetePortail() {
  return (
    <header className="cj-en-tete">
      <div className="cj-conteneur cj-en-tete__barre">
        <div className="cj-en-tete__gauche">
          <BlocMarque embleme={config.embleme} href="/" />
          <Link href="/" className="cj-en-tete__service">
            {config.nomService}
            <small>Bulletin n°3 en ligne · Vérification des bulletins</small>
          </Link>
        </div>
        <div className="cj-en-tete__actions">
          <Link href="/suivi" className={classesBouton({ variante: 'tertiaire' })}>
            <Icone nom="search" taille={20} /><span>Suivre ma demande</span>
          </Link>
          <Link href="/connexion" className={classesBouton({ variante: 'secondaire' })}>
            <Icone nom="log-in" taille={20} /><span>Se connecter</span>
          </Link>
        </div>
        <details className="cj-menu-mobile">
          <summary><Icone nom="menu" taille={20} /><span>Menu</span></summary>
          <div className="cj-menu-mobile__panneau">
            <nav aria-label="Menu principal">
              <ul>
                {navigation.map((l) => <li key={l.href}><Link href={l.href}>{l.libelle}</Link></li>)}
                <li><Link href="/verifier">Vérifier un bulletin</Link></li>
              </ul>
            </nav>
            <div className="cj-pile">
              <Link href="/demande" className={classesBouton({ pleineLargeur: true })}>Demander mon bulletin</Link>
              <Link href="/suivi" className={classesBouton({ variante: 'secondaire', pleineLargeur: true })}>Suivre ma demande</Link>
              <Link href="/connexion" className={classesBouton({ variante: 'secondaire', pleineLargeur: true })}>Se connecter</Link>
            </div>
          </div>
        </details>
      </div>
      <nav className="cj-en-tete__nav" aria-label="Navigation principale">
        <div className="cj-conteneur">
          <NavPrincipale liens={navigation} />
        </div>
      </nav>
    </header>
  );
}
