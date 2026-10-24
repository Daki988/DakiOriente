import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CarteUtilisateur, Icone, classesBouton } from '@casier/design-system';

import { NavEspaceCourante } from '@/components/NavEspaceCourante';
import { exigerSession, nomEtablissement } from '@/lib/donnees';
import { libelleProfil, liensEspace } from '@/lib/navigation';

export const metadata: Metadata = { title: 'Espace professionnel', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Gabarit de l'espace professionnel : identité, établissement de rattachement, navigation selon le rôle, déconnexion. */
export default async function GabaritEspace({ children }: { children: ReactNode }) {
  const s = await exigerSession();
  const rattachement = s.juridiction ? nomEtablissement(s.juridiction) : 'Tous les établissements';
  return (
    <div className="cj-conteneur cj-espace">
      <aside className="cj-espace__lateral" aria-label="Votre espace">
        <CarteUtilisateur nom={s.nom} profil={`${libelleProfil(s.roles)} · ${rattachement}${s.demo ? ' · démonstration' : ''}`}
          action={
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
