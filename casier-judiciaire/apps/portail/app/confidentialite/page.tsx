import type { Metadata } from 'next';
import Link from 'next/link';

import { PageLegale } from '@/components/PageLegale';

export const metadata: Metadata = { title: 'Confidentialité et données personnelles' };

/** DON-05 : information claire sur les traitements et les droits des personnes. */
export default function Confidentialite() {
  return (
    <PageLegale titre="Confidentialité et données personnelles" chapo="Ce que nous faisons de vos données, et vos droits.">
      <h2>Responsable du traitement</h2>
      <p>Ministère de la Justice, République gabonaise. Le traitement fait l’objet des formalités prévues auprès de l’autorité de protection des données.</p>
      <h2>Données collectées</h2>
      <ul>
        <li>Votre identité et votre filiation, pour vous identifier dans le casier judiciaire.</li>
        <li>Votre téléphone et, si vous le souhaitez, votre adresse e-mail, pour vous informer de l’avancement.</li>
        <li>Les pièces que vous déposez, uniquement si un agent doit vérifier votre identité.</li>
        <li>Les informations de paiement transmises par l’opérateur (référence, montant, date). Nous ne voyons jamais votre code Mobile Money ni votre numéro de carte.</li>
      </ul>
      <h2>Finalité</h2>
      <p>Ces données servent uniquement à traiter votre demande, à émettre votre bulletin et à rendre compte de la gestion du service. Elles ne sont jamais cédées.</p>
      <h2>Durée de conservation</h2>
      <p>Chaque type de donnée (demande, pièce, bulletin émis, journal) a une durée de conservation fixée par le Ministère ; à son terme, la donnée est supprimée automatiquement.</p>
      <h2>Sécurité</h2>
      <p>Les données sont chiffrées, hébergées au Gabon, et chaque consultation de votre casier est enregistrée dans un journal inaltérable.</p>
      <h2>Vérification par un tiers</h2>
      <p>La page de vérification d’un bulletin affiche son authenticité, son statut, vos nom, prénoms et date de naissance, jamais le contenu de votre casier.</p>
      <h2>Vos droits</h2>
      <p>Vous pouvez accéder à vos données et demander leur rectification. Faites-en la demande depuis votre espace ou par le <Link href="/contact">formulaire de contact</Link>.</p>
    </PageLegale>
  );
}
