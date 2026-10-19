import { NextResponse, type NextRequest } from 'next/server';

import { config } from '@/lib/config';
import { connexionReelle, urlAutorisation } from '@/lib/oidc';

/** Début de la connexion OIDC ; sans fournisseur d'identité configuré, renvoi vers les comptes de démonstration (ENV-04). */
export async function GET(req: NextRequest) {
  const retour = req.nextUrl.searchParams.get('retour');
  const sur = retour && (retour.startsWith('/espace') || retour === '/demande') ? retour : '/espace';
  if (!connexionReelle()) return NextResponse.redirect(new URL(config.comptesDemo ? '/connexion#demonstration' : '/connexion?indisponible=1', req.url));
  const { url } = urlAutorisation(sur);
  return NextResponse.redirect(url);
}
