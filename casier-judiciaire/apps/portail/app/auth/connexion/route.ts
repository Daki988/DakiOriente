import { NextResponse, type NextRequest } from 'next/server';

import { connexionReelle, urlAutorisation } from '@/lib/oidc';

/** Début de la connexion OIDC ; sans fournisseur d'identité configuré, renvoi vers les comptes de démonstration (ENV-04). */
export async function GET(req: NextRequest) {
  const retour = req.nextUrl.searchParams.get('retour');
  const sur = retour && retour.startsWith('/espace') ? retour : '/espace';
  if (!connexionReelle()) return NextResponse.redirect(new URL('/connexion#demonstration', req.url));
  const { url } = urlAutorisation(sur);
  return NextResponse.redirect(url);
}
