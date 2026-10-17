import type { ReactNode } from 'react';
import { Alerte } from '@casier/design-system';

import { EntetePage } from './EntetePage';

/** Pages légales (PUB-15) : textes à valider par le Ministère avant la mise en service. */
export function PageLegale({ titre, chapo, children, valide = false }: { titre: string; chapo?: string; children: ReactNode; valide?: boolean }) {
  return (
    <>
      <EntetePage fil={[{ libelle: titre }]} titre={titre} chapo={chapo} />
      <div className="cj-conteneur p-contenu">
        <div className="p-prose">
          {!valide && <Alerte type="avertissement" titre="Projet de texte">Ce texte doit être validé par le Ministère de la Justice, Garde des Sceaux, chargé des Droits humains avant la mise en service.</Alerte>}
          {children}
        </div>
      </div>
    </>
  );
}
