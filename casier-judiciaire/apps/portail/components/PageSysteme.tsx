import type { ReactNode } from 'react';
import Link from 'next/link';
import { Icone, classesBouton, type NomIcone } from '@casier/design-system';

import { config } from '@/lib/config';

/** Pages système (PUB-16) : message clair, numéro de support, lien de retour. Aucun code technique (ERG-05). */
export function PageSysteme({ icone, surtitre, titre, children, action }: {
  icone: NomIcone; surtitre: string; titre: string; children: ReactNode; action?: ReactNode;
}) {
  return (
    <div className="cj-conteneur">
      <div className="p-erreur">
        <span className="p-erreur__pictogramme"><Icone nom={icone} taille={40} /></span>
        <p className="p-surtitre">{surtitre}</p>
        <h1 className="p-titre-section">{titre}</h1>
        <div className="p-chapo">{children}</div>
        <div className="p-page-entete__actions">
          {action ?? <Link href="/" className={classesBouton()}><Icone nom="house" taille={20} /><span>Retour à l’accueil</span></Link>}
          <a href={`tel:${config.supportTelephone.replace(/\s/g, '')}`} className={classesBouton({ variante: 'secondaire' })}>
            <Icone nom="phone" taille={20} /><span>Support : {config.supportTelephone}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
