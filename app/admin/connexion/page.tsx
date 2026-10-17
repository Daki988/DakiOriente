import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/AuthForms";
import { Logo } from "@/components/Logo";
import { hasSupabase } from "@/lib/supabase";

export const metadata: Metadata = { title: "Connexion back-office", robots: { index: false, follow: false } };

export default async function Connexion({ searchParams }: { searchParams: Promise<{ refus?: string; lien?: string }> }) {
  const { refus, lien } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4 py-10">
      <div className="grid w-full max-w-sm gap-6 rounded-3xl bg-white p-6">
        <Logo className="h-12 w-auto justify-self-start" />
        <div className="grid gap-1">
          <h1 className="text-2xl font-extrabold">Back-office</h1>
          <p className="text-sm text-muted">Réservé à l’équipe Neam Print.</p>
        </div>
        {!hasSupabase ? (
          <p className="rounded-xl bg-warn-soft p-3 text-sm text-warn">La base de données n’est pas encore branchée. Voir docs/SUPABASE.md.</p>
        ) : (
          <>
            {refus && <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">Ce compte n’a pas accès au back-office. Demandez au super administrateur de vous ajouter.</p>}
            {lien && <p role="alert" className="rounded-xl bg-warn-soft p-3 text-sm text-warn">Le lien a expiré. Recommencez « Mot de passe oublié ».</p>}
            <LoginForm />
          </>
        )}
      </div>
    </main>
  );
}
