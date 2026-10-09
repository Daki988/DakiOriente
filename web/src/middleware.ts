import { NextResponse, type NextRequest } from "next/server";

// Espaces réservés : redirection vers la connexion si aucune session (le contrôle des rôles est fait côté serveur).
const PROTECTED = ["/espace", "/parent", "/etablissement", "/bailleur", "/admin", "/conseiller", "/messages", "/notifications", "/paiement", "/compte"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/")) && !req.cookies.get("ng_session")) {
    const to = req.nextUrl.clone();
    to.pathname = "/connexion/";
    to.search = `?suite=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(to);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next|logos|photos|images|favicon).*)"] };
