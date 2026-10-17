import type { Metadata } from 'next';

import { PageLegale } from '@/components/PageLegale';

export const metadata: Metadata = { title: 'Conditions générales d’utilisation' };

export default function Cgu() {
  return (
    <PageLegale titre="Conditions générales d’utilisation">
      <h2>Objet</h2>
      <p>Le portail permet de demander le bulletin n°3 de son casier judiciaire, de suivre sa demande et de vérifier l’authenticité d’un bulletin.</p>
      <h2>Demande personnelle</h2>
      <p>Le bulletin n°3 ne peut être demandé que par la personne concernée. Toute demande au nom d’autrui ou toute fausse déclaration est passible de poursuites.</p>
      <h2>Paiement</h2>
      <p>Le tarif appliqué est celui en vigueur à la date du paiement. Le remboursement en cas de rejet suit la politique fixée par le Ministère.</p>
      <h2>Disponibilité</h2>
      <p>Le service est accessible en continu, sauf maintenance annoncée sur le portail.</p>
      <h2>Sécurité</h2>
      <p>Le service ne demande jamais de code ni de paiement par téléphone. Toute sollicitation de ce type doit être signalée au support.</p>
    </PageLegale>
  );
}
