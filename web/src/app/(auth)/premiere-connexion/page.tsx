import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PremiereConnexion } from "@/components/auth/PremiereConnexion";
import { Brand } from "@/components/ui/Brand";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getSessionUser, HOME, safePath } from "@/server/session-ui";

export const metadata: Metadata = { title: "Première connexion", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { suite?: string } }) {
  const u = await getSessionUser();
  if (!u) redirect("/connexion/");
  if (!u.mustChangePassword) redirect(safePath(searchParams.suite) ?? HOME[u.role]);
  // Établissement : le guide de la plateforme s'ouvre juste après.
  const suite = u.role === "etablissement" ? "/etablissement/guide" : safePath(searchParams.suite) ?? HOME[u.role];
  const [ecole] = u.role === "etablissement" ? await db.select({ nom: schema.establishments.nom }).from(schema.establishmentMembers)
    .innerJoin(schema.establishments, eq(schema.establishments.id, schema.establishmentMembers.establishmentId)).where(eq(schema.establishmentMembers.userId, u.id)).limit(1) : [];
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-brand-50 to-[#f6f8fe] px-4 py-10">
      <Brand />
      <PremiereConnexion nom={ecole?.nom ?? u.firstName} suite={suite} />
    </main>
  );
}
