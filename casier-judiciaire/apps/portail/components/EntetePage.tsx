import type { ReactNode } from 'react';
import { FilAriane } from '@casier/design-system';

/** En-tête commun des pages intérieures : fil d'Ariane, titre, chapeau, action principale et visuel (section 7). */
export function EntetePage({ fil, surtitre, titre, chapo, actions, visuel }: {
  fil: { libelle: string; href?: string }[]; surtitre?: string; titre: ReactNode; chapo?: ReactNode; actions?: ReactNode; visuel?: ReactNode;
}) {
  return (
    <div className="p-page-entete">
      <div className="cj-conteneur">
        <FilAriane elements={[{ libelle: 'Accueil', href: '/' }, ...fil]} />
        <div className={'p-page-entete__grille' + (visuel ? ' p-page-entete__grille--visuel' : '')}>
          <div>
            {surtitre && <p className="p-surtitre">{surtitre}</p>}
            <h1>{titre}</h1>
            {chapo && <p className="p-chapo">{chapo}</p>}
            {actions && <div className="p-page-entete__actions">{actions}</div>}
          </div>
          {visuel && <div className="p-page-entete__visuel">{visuel}</div>}
        </div>
      </div>
    </div>
  );
}
