import type { Metadata } from 'next';

import { PageLegale } from '@/components/PageLegale';
import { config } from '@/lib/config';

export const metadata: Metadata = { title: 'Mentions légales' };

export default function MentionsLegales() {
  return (
    <PageLegale titre="Mentions légales">
      <h2>Éditeur du service</h2>
      <p>Ministère de la Justice, Garde des Sceaux, chargé des Droits humains, République gabonaise. Directeur de la publication : désigné par le Ministère.</p>
      <h2>Hébergement</h2>
      <p>
        {config.modeDemo
          ? 'Démonstration : infrastructure de l’éditeur de la plateforme. Données fictives, réinitialisées chaque nuit.'
          : 'Datacenter national, Libreville. Aucune donnée n’est transmise à un service hébergé hors du Gabon.'}
      </p>
      <h2>Propriété des contenus</h2>
      <p>
        Les armoiries et le drapeau de la République gabonaise sont des symboles officiels de l’État. Les pictogrammes proviennent de la bibliothèque libre
        Lucide (licence ISC) ; les polices Source Serif 4 et Source Sans 3 sont distribuées sous licence libre SIL Open Font License.
      </p>
      <h2>Valeur des documents</h2>
      <p>Seul le bulletin scellé électroniquement et vérifiable sur ce portail fait foi. Une copie imprimée reste vérifiable par son QR code.</p>
    </PageLegale>
  );
}
