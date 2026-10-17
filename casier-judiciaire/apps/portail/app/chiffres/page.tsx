import type { Metadata } from 'next';
import { Alerte, TuileIndicateur } from '@casier/design-system';

import { EntetePage } from '@/components/EntetePage';

export const metadata: Metadata = { title: 'Le service en chiffres', description: 'Objectifs et statistiques du casier judiciaire numérique, sans donnée nominative.' };

/**
 * PUB-13 : statistiques agrégées, jamais sous le seuil de 10 personnes (DON-09). Avant l'ouverture, seuls les
 * objectifs du service sont affichés : aucun chiffre inventé.
 */
export default function Chiffres() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'Le service en chiffres' }]} surtitre="Transparence" titre="Le service en chiffres"
        chapo="Délais, volumes et taux de délivrance automatique, publiés chaque mois sans aucune donnée nominative." />
      <div className="cj-conteneur p-contenu">
        <Alerte type="info" titre="Statistiques publiées à l’ouverture du service">
          Voici les engagements du service. Les résultats mesurés seront publiés ici chaque mois.
        </Alerte>
        <h2 className="p-titre-section">Nos engagements</h2>
        <div className="p-chiffres p-chiffres--cartes">
          <TuileIndicateur valeur="24 h" libelle="Délai maximal de délivrance" detail="Immédiat lorsque l’identité est certaine" />
          <TuileIndicateur valeur="≈ 3 s" libelle="Vérification d’un bulletin" detail="Sans compte, par QR code ou code court" />
          <TuileIndicateur valeur="100 %" libelle="Des consultations journalisées" detail="Journal inaltérable" />
          <TuileIndicateur valeur="99,5 %" libelle="Disponibilité visée" detail="En heures ouvrées" />
        </div>
      </div>
    </>
  );
}
