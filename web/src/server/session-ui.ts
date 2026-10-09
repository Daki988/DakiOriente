// Session côté pages (composants serveur) : utilisateur connecté et garde par rôle.
import { redirect } from "next/navigation";
import { currentUser, type Role } from "./auth/session";

export type ClientUser = { id: string; firstName: string; lastName: string; role: Role; status: string; email: string | null; phone: string | null; country: string | null; city: string | null; birthYear: number | null };

export async function getSessionUser(): Promise<ClientUser | null> {
  try {
    const u = await currentUser();
    if (!u) return null;
    return { id: u.id, firstName: u.firstName, lastName: u.lastName, role: u.role, status: u.status, email: u.email, phone: u.phone, country: u.country, city: u.city, birthYear: u.birthYear };
  } catch {
    return null; // base indisponible : pages publiques servies sans session
  }
}

export const HOME: Record<Role, string> = { eleve: "/espace", etudiant: "/espace", parent: "/parent", etablissement: "/etablissement", bailleur: "/bailleur", conseiller: "/conseiller", admin: "/admin" };

/** À appeler en tête des layouts d'espace : redirige vers la connexion ou vers l'espace du rôle. */
export async function requireRole(roles: Role[], path: string) {
  const u = await getSessionUser();
  if (!u) redirect(`/connexion/?suite=${encodeURIComponent(path)}`);
  if (!roles.includes(u.role)) redirect(HOME[u.role]);
  return u;
}
