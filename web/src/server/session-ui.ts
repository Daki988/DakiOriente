// Session côté pages (composants serveur) : utilisateur connecté et garde par rôle.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser, SESSION_COOKIE, type Role } from "./auth/session";
import { cheminInterne } from "@/lib/redirection";

export type ClientUser = {
  id: string; firstName: string; lastName: string; role: Role; status: string; email: string | null; phone: string | null;
  country: string | null; city: string | null; birthYear: number | null; emailVerified: boolean; phoneVerified: boolean;
  mustChangePassword: boolean;
};

export async function getSessionUser(): Promise<ClientUser | null> {
  try {
    const u = await currentUser();
    if (!u) return null;
    return {
      id: u.id, firstName: u.firstName, lastName: u.lastName, role: u.role, status: u.status, email: u.email, phone: u.phone, country: u.country, city: u.city,
      birthYear: u.birthYear, emailVerified: !!u.emailVerifiedAt, phoneVerified: !!u.phoneVerifiedAt, mustChangePassword: u.mustChangePassword,
    };
  } catch {
    return null; // base indisponible : pages publiques servies sans session
  }
}

export const HOME: Record<Role, string> = { eleve: "/espace", etudiant: "/espace", parent: "/parent", etablissement: "/etablissement", bailleur: "/bailleur", conseiller: "/conseiller", admin: "/admin" };

/** Chemin interne sûr (pas de redirection ouverte vers un autre site). */
export const safePath = (p?: string | null) => cheminInterne(p);

/** À appeler en tête des layouts d'espace : redirige vers la connexion (session absente ou expirée) ou vers l'espace du rôle. */
export async function requireRole(roles: Role[], path: string) {
  const u = await getSessionUser();
  if (!u) {
    const stale = !!cookies().get(SESSION_COOKIE)?.value; // cookie présent mais session expirée ou révoquée
    redirect(`/connexion/?suite=${encodeURIComponent(path)}${stale ? "&session=expiree" : ""}`);
  }
  // Accès créé par Navigoal : mot de passe provisoire à remplacer avant tout.
  if (u.mustChangePassword) redirect(`/premiere-connexion/?suite=${encodeURIComponent(path)}`);
  if (!roles.includes(u.role)) redirect(HOME[u.role]);
  return u;
}

/** Pages de connexion et d'inscription : un utilisateur déjà connecté est renvoyé vers son espace. */
export async function redirectIfSignedIn(suite?: string | null) {
  const u = await getSessionUser();
  if (u) redirect(safePath(suite) ?? HOME[u.role]);
}
