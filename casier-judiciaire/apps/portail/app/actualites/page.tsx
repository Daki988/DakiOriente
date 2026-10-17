import type { Metadata } from 'next';
import { Icone } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';

export const metadata: Metadata = { title: 'Actualités', description: 'Communiqués du Ministère de la Justice sur le casier judiciaire numérique.' };

/** PUB-11 : communiqués publiés depuis le back-office (PUB-17). */
export default function Actualites() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Actualités' }]} surtitre="Actualités" titre="Communiqués du Ministère"
        chapo="Les annonces officielles sur le service : ouverture, nouveaux services, évolutions des tarifs." />
      <div className="cj-conteneur p-contenu">
        <div className="p-vide">
          <Icone nom="inbox" taille={40} />
          <p><strong>Aucun communiqué publié pour l’instant.</strong></p>
          <p>Les communiqués du Ministère de la Justice apparaîtront ici.</p>
        </div>
      </div>
    </>
  );
}
