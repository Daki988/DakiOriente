import Link from 'next/link';
import { BlocMarque, Icone, classesBouton } from '@casier/design-system';

import { config } from '@/lib/config';
import { session } from '@/lib/session';
import { MenuMobile } from './MenuMobile';
import { NavPrincipale } from './NavPrincipale';

const NAVIGATION = [
  { href: '/#missions', libelle: 'Missions' },
  { href: '/etablissements', libelle: 'Établissements' },
  { href: '/#familles', libelle: 'Familles et visites' },
];

/** En-tête institutionnel : bloc-marque, nom du service, navigation, accès professionnel. Menu mobile refermé automatiquement. */
export async function EnTete() {
  const connecte = !!(await session());
  const acces = connecte ? { href: '/espace', libelle: 'Espace professionnel', icone: 'user' as const } : { href: '/connexion', libelle: 'Accès professionnel', icone: 'lock' as const };
  return (
    <header className="cj-en-tete">
      <div className="cj-conteneur cj-en-tete__barre">
        <div className="cj-en-tete__gauche">
          <BlocMarque embleme={config.embleme} href="/" />
          <Link href="/" className="cj-en-tete__service">
            {config.nomService}
            <small>Administration pénitentiaire</small>
          </Link>
        </div>
        <div className="cj-en-tete__droite">
          <nav aria-label="Navigation principale">
            <NavPrincipale liens={NAVIGATION} />
          </nav>
          <Link href={acces.href} className={classesBouton({ variante: 'secondaire' })}>
            <Icone nom={acces.icone} taille={18} /><span>{acces.libelle}</span>
          </Link>
        </div>
        <MenuMobile>
          <nav aria-label="Menu principal">
            <ul>{NAVIGATION.map((l) => <li key={l.href}><Link href={l.href}>{l.libelle}</Link></li>)}</ul>
          </nav>
          <Link href={acces.href} className={classesBouton({ pleineLargeur: true })}>{acces.libelle}</Link>
        </MenuMobile>
      </div>
    </header>
  );
}
