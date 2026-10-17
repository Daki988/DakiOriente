import type { Metadata } from 'next';

import { EntetePage } from '@/components/EntetePage';
import { QuestionnaireBulletin } from '@/components/QuestionnaireBulletin';

export const metadata: Metadata = {
  title: 'De quel document ai-je besoin ?',
  description: 'Deux questions pour savoir quel extrait de casier judiciaire demander et comment.',
};

export default function QuelBulletin() {
  return (
    <>
      <EntetePage fil={[{ libelle: 'De quel document ai-je besoin ?' }]} surtitre="Orientation"
        titre="De quel document ai-je besoin ?" chapo="Répondez à deux questions : nous vous indiquons la bonne démarche." />
      <div className="cj-conteneur p-contenu p-etroit">
        <QuestionnaireBulletin />
      </div>
    </>
  );
}
