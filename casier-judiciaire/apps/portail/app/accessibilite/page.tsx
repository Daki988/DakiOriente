import type { Metadata } from 'next';
import Link from 'next/link';

import { PageLegale } from '@/components/PageLegale';

export const metadata: Metadata = { title: 'Accessibilité' };

/** ERG-01 : déclaration d'accessibilité. */
export default function Accessibilite() {
  return (
    <PageLegale titre="Déclaration d’accessibilité">
      <p>Le Ministère de la Justice s’engage à rendre le portail accessible à tous, conformément aux règles WCAG 2.1 de niveau AA.</p>
      <h2>État de conformité</h2>
      <p>Partiellement conforme : l’audit d’accessibilité indépendant sera réalisé avant la mise en service. Des tests automatiques sont exécutés à chaque version.</p>
      <h2>Ce qui est déjà en place</h2>
      <ul>
        <li>Navigation complète au clavier, lien d’accès direct au contenu, focus visible.</li>
        <li>Contrastes conformes, textes agrandissables, mise en page adaptée au téléphone.</li>
        <li>Formulaires avec libellés, aides et messages d’erreur qui indiquent quoi corriger.</li>
        <li>Pages essentielles lisibles sans JavaScript, animations réduites si vous le demandez à votre appareil.</li>
      </ul>
      <h2>Signaler un problème</h2>
      <p>Si vous ne parvenez pas à utiliser une page, <Link href="/contact">écrivez-nous</Link> : nous vous apporterons une réponse ou une autre façon d’accéder au service.</p>
    </PageLegale>
  );
}
