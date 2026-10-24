import Link from 'next/link';
import { BlocMarque, Icone, classesBouton } from '@casier/design-system';

import { config } from '@/lib/config';
import { navigation } from '@/lib/contenu';
import { session } from '@/lib/session';
import { MenuMobile } from './MenuMobile';
import { NavPrincipale } from './NavPrincipale';

/** En-tête institutionnel sur une ligne (VIS-02) : bloc-marque, nom du service, navigation, connexion. Menu mobile utilisable sans JavaScript, refermé automatiquement avec. */
export async function EnTetePortail() {
  const connecte = !!(await session());
  const acces = connecte ? { href: '/espace', libelle: 'Mon espace', icone: 'user' as const } : { href: '/connexion', libelle: 'Se connecter', icone: 'log-in' as const };
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
          <Link href={acces.href} className={classesBouton({ variante: 'secondaire' })}>
            <Icone nom={acces.icone} taille={18} /><span>{acces.libelle}</span>
          </Link>
        </div>
        <MenuMobile>
            <nav aria-label="Menu principal">
              <ul>
                {navigation.map((l) => <li key={l.href}><Link href={l.href}>{l.libelle}</Link></li>)}
                <li><Link href="/paiement-tresor">Payer au Trésor public</Link></li>
                <li><Link href="/diaspora">Gabonais de l’étranger</Link></li>
                <li><Link href="/administrations">Administrations et employeurs</Link></li>
              </ul>
            </nav>
            <div className="cj-pile">
              <Link href="/demande" className={classesBouton({ pleineLargeur: true })}>Demander mon bulletin</Link>
              <Link href={acces.href} className={classesBouton({ variante: 'secondaire', pleineLargeur: true })}>{acces.libelle}</Link>
            </div>
        </MenuMobile>
      </div>
    </header>
  );
}
