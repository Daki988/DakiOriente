import type { Metadata } from 'next';
import { Alerte, Icone } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';
import { FormulaireReclamation } from '@/components/FormulaireReclamation';
import { config } from '@/lib/config';

export const metadata: Metadata = { title: 'Contact et réclamation', description: 'Joindre le support du casier judiciaire numérique et déposer une réclamation.' };

/** PUB-12 : formulaires, horaires, adresses. */
export default async function Contact({ searchParams }: { searchParams: Promise<{ objet?: string }> }) {
  const { objet } = await searchParams;
  return (
    <>
      <EntetePage fil={[{ libelle: 'Contact et réclamation' }]} surtitre="Nous joindre" titre="Contact et réclamation"
        chapo="Une question sur votre demande, un paiement, ou une erreur dans votre casier ? Le support vous répond." />
      <div className="cj-conteneur p-parcours">
        <div id="reclamation"><FormulaireReclamation objetInitial={objet === 'CONTENU_CASIER' ? objet : ''} /></div>
        <aside className="p-encadre cj-pile" aria-label="Coordonnées">
          <h2 className="p-titre-encadre">Coordonnées</h2>
          <ul className="p-liste-coches">
            <li><Icone nom="phone" /><span>Support : <a href={`tel:${config.supportTelephone.replace(/\s/g, '')}`}>{config.supportTelephone}</a></span></li>
            <li><Icone nom="map-pin" /><span>Service central du casier judiciaire, Ministère de la Justice, Garde des Sceaux, chargé des Droits humains, Libreville</span></li>
            <li><Icone nom="clock" /><span>Horaires d’accueil : publiés par le Ministère à l’ouverture du service</span></li>
          </ul>
          <Alerte type="info" titre="Contester le contenu de votre casier">
            Choisissez l’objet « Contestation du contenu du casier » : votre réclamation est transmise au service du casier et vous suivez son traitement.
          </Alerte>
        </aside>
      </div>
    </>
  );
}
