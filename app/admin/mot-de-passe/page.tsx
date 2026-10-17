import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/components/admin/AuthForms";
import { Logo } from "@/components/Logo";
import { getAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Choisir un mot de passe", robots: { index: false, follow: false } };

export default async function MotDePasse() {
  const me = await getAdmin();
  if (!me) redirect("/admin/connexion?lien=expire");
  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4 py-10">
      <div className="grid w-full max-w-sm gap-6 rounded-3xl bg-white p-6">
        <Logo className="h-12 w-auto justify-self-start" />
        <div className="grid gap-1">
          <h1 className="text-2xl font-extrabold">Choisir un mot de passe</h1>
          <p className="text-sm text-muted">Compte : {me.email}</p>
        </div>
        <NewPasswordForm />
      </div>
    </main>
  );
}
