'use server';
import { redirect } from 'next/navigation';

import { connexionReelle } from '@/lib/oidc';
import { PROFILS_DEMO } from '@/lib/profils-demo';
import { fermerSession, ouvrirSession } from '@/lib/session';

/** ENV-04 : connexion à un compte de démonstration fictif, seulement quand aucun fournisseur d'identité n'est configuré. */
export async function connexionDemo(f: FormData) {
  if (connexionReelle()) redirect('/auth/connexion');
  const p = PROFILS_DEMO.find((x) => x.id === f.get('profil'));
  if (!p) redirect('/connexion');
  await fermerSession();
  await ouvrirSession({ sujet: p.sujet, nom: p.nom, roles: [...p.roles], juridiction: 'juridiction' in p ? p.juridiction : undefined, demo: true });
  redirect('/espace');
}
