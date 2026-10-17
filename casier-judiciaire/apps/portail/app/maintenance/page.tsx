import type { Metadata } from 'next';

import { PageSysteme } from '@/components/PageSysteme';

export const metadata: Metadata = { title: 'Maintenance', robots: { index: false } };

export default function Maintenance() {
  return (
    <PageSysteme icone="settings" surtitre="Maintenance" titre="Le service est en cours de maintenance">
      <p>Nous améliorons le service. Il sera de nouveau disponible très bientôt. Les demandes déjà payées continuent d’être traitées dans les délais.</p>
    </PageSysteme>
  );
}
