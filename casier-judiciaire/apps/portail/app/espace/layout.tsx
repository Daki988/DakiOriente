import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CarteUtilisateur, Icone, classesBouton } from '@casier/design-system';

import { NavEspaceCourante } from '@/components/NavEspaceCourante';
import { exigerSession } from '@/lib/espaces';
import { libelleProfil, liensEspace } from '@/lib/navigation-espace';

export const metadata: Metadata = { title: 'Mon espace', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Gabarit des espaces connectés (DSH) : identité, navigation selon le rôle, déconnexion. */
export default async function GabaritEspace({ children }: { children: ReactNode }) {
  const s = await exigerSession();
  return (
    <div className="cj-conteneur cj-espace">
      <aside className="cj-espace__lateral" aria-label="Votre espace">
        <CarteUtilisateur nom={s.nom} profil={libelleProfil(s.roles) + (s.demo ? ' · démonstration' : '')}
          action={
            // Lien et non formulaire : la redirection vers le fournisseur d'identité est hors de « form-action 'self' » (SEC-04).
            <a href="/auth/deconnexion" className={classesBouton({ variante: 'tertiaire' })} aria-label="Se déconnecter" title="Se déconnecter">
              <Icone nom="log-out" taille={20} />
            </a>
          } />
        <NavEspaceCourante liens={liensEspace(s.roles)} />
      </aside>
      <div className="cj-espace__principal">{children}</div>
    </div>
  );
}
