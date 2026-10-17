import type { Metadata } from 'next';

import { PageLegale } from '@/components/PageLegale';

export const metadata: Metadata = { title: 'Cookies' };

/** PUB-19 : aucun traceur tiers, aucun cookie publicitaire. */
export default function Cookies() {
  return (
    <PageLegale titre="Cookies">
      <p>Le portail n’utilise aucun cookie publicitaire ni aucun traceur d’un service tiers.</p>
      <h2>Cookies strictement nécessaires</h2>
      <p>Un cookie de session est déposé uniquement lorsque vous vous connectez à votre espace. Il est supprimé à la déconnexion ou à l’expiration de la session.</p>
      <h2>Brouillon de demande</h2>
      <p>Pendant une demande, votre saisie est enregistrée sur votre appareil (stockage local du navigateur) pour reprendre après une coupure. Elle est effacée après l’envoi de la demande ou au bout de 24 heures.</p>
      <h2>Mesure d’audience</h2>
      <p>La fréquentation est mesurée par un outil hébergé sur l’infrastructure nationale, sans cookie et sans transmission à un tiers.</p>
    </PageLegale>
  );
}
