import type { Metadata } from 'next';
import Link from 'next/link';
import { Icone, classesBouton } from '@casier/design-system';

import { PageSysteme } from '@/components/PageSysteme';

export const metadata: Metadata = { title: 'Session expirée', robots: { index: false } };

export default function SessionExpiree() {
  return (
    <PageSysteme icone="timer" surtitre="Session expirée" titre="Votre session a expiré"
      action={<Link href="/connexion" className={classesBouton()}><Icone nom="log-in" taille={20} /><span>Se reconnecter</span></Link>}>
      <p>Pour protéger vos données, vous avez été déconnecté après une période d’inactivité. Une demande en cours de saisie reste enregistrée sur cet appareil.</p>
    </PageSysteme>
  );
}
