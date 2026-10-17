'use server';
import { redirect } from 'next/navigation';

import { connexionReelle } from '@/lib/oidc';
import { PROFILS_DEMO } from '@/lib/profils-demo';
import { fermerSession, ouvrirSessionDemo } from '@/lib/session';

/** ENV-04 : connexion à un compte de démonstration fictif, seulement quand aucun fournisseur d'identité n'est configuré. */
export async function connexionDemo(f: FormData) {
  if (connexionReelle()) redirect('/auth/connexion');
  const p = PROFILS_DEMO.find((x) => x.id === f.get('profil'));
  if (!p) redirect('/connexion');
  await fermerSession();
  await ouvrirSessionDemo(p.id);
  redirect('/espace');
}
