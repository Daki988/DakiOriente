import { NextResponse, type NextRequest } from 'next/server';

import { echanger, oidc } from '@/lib/oidc';
import { ouvrirSession } from '@/lib/session';

/** Retour du fournisseur d'identité : contrôle de l'état, échange du code, ouverture de la session serveur. */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const etat = req.nextUrl.searchParams.get('state');
  if (!code || !etat) return NextResponse.redirect(new URL('/connexion?erreur=1', req.url));
  try {
    const { session, retour } = await echanger(code, etat);
    await ouvrirSession(session);
    return NextResponse.redirect(new URL(retour, oidc.portail));
  } catch {
    return NextResponse.redirect(new URL('/connexion?erreur=1', req.url));
  }
}
