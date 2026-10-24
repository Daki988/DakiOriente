import type { Metadata } from 'next';

import { EntetePage } from '@/components/EntetePage';

export const metadata: Metadata = { title: 'Mentions légales et données personnelles' };

export default function MentionsLegales() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Mentions légales' }]} titre="Mentions légales et données personnelles" />
      <div className="cj-conteneur p-contenu">
        <div className="p-prose">
          <h2>Éditeur</h2>
          <p>Ministère de la Justice, Garde des Sceaux, chargé des Droits humains — Direction de l’administration pénitentiaire, Libreville, République gabonaise.</p>
          <h2>Hébergement</h2>
          <p>Les données de production sont hébergées au Gabon, dans un centre de données agréé par l’État.</p>
          <h2>Données des personnes détenues</h2>
          <p>
            Le registre d’écrou est tenu pour l’exécution des décisions de justice. Il n’est accessible qu’aux personnels habilités, chacun dans le
            périmètre de son établissement ; la direction de l’administration pénitentiaire dispose d’une vue nationale.
          </p>
          <p>Aucune donnée n’est supprimée : un écrou est levé par une libération, un mouvement est clos ou annulé. Chaque consultation et chaque action sont journalisées.</p>
          <h2>Vos droits</h2>
          <p>Toute personne peut exercer ses droits d’accès et de rectification auprès de la direction de l’administration pénitentiaire, par courrier.</p>
        </div>
      </div>
    </>
  );
}
