import { redirect } from "next/navigation";
import { hasSupabase, supabaseService, supabaseSession } from "@/lib/supabase";

export type Role = "super_admin" | "admin" | "atelier";
export type Admin = { email: string; role: Role };

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  atelier: "Atelier",
};
/** Qui peut modifier le catalogue et les prix. */
export const CATALOG_ROLES: Role[] = ["super_admin", "admin"];

/** Utilisateur connecté et son rôle (null si non connecté ; role null si connecté sans droits). */
export async function getAdmin(): Promise<(Omit<Admin, "role"> & { role: Role | null }) | null> {
  if (!hasSupabase) return null;
  const sb = await supabaseSession();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return null;
  const email = user.email.toLowerCase();
  const { data } = await supabaseService().from("admins").select("role").eq("email", email).maybeSingle();
  return { email, role: (data?.role as Role) ?? null };
}

/** À appeler en tête de chaque page et action du back-office. */
export async function requireAdmin(roles?: Role[]): Promise<Admin> {
  const a = await getAdmin();
  if (!a) redirect("/admin/connexion");
  if (!a.role) redirect("/admin/connexion?refus=1");
  if (roles && !roles.includes(a.role)) throw new Error("Vous n’avez pas les droits pour cette action.");
  return a as Admin;
}
