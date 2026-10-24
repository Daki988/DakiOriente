import { NextResponse, type NextRequest } from 'next/server';

import { connexionReelle, urlDeconnexion } from '@/lib/oidc';
import { fermerSession } from '@/lib/session';

/** Déconnexion : fin de la session du portail puis, en connexion réelle, de la session Keycloak. */
export async function GET(req: NextRequest) {
  const s = await fermerSession();
  if (s && !s.demo && connexionReelle()) return NextResponse.redirect(urlDeconnexion(s.jetonId));
  return NextResponse.redirect(new URL('/', req.url));
}

/** Déconnexion par formulaire (bouton de l'espace). */
export async function POST(req: NextRequest) {
  const s = await fermerSession();
  if (s && !s.demo && connexionReelle()) return NextResponse.redirect(urlDeconnexion(s.jetonId), 303);
  return NextResponse.redirect(new URL('/', req.url), 303);
}
