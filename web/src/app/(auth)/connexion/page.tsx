import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthAside } from "@/components/auth/AuthAside";
import { Login } from "@/components/auth/Login";
import { Brand } from "@/components/ui/Brand";
import { redirectIfSignedIn } from "@/server/session-ui";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConnexionPage({ searchParams }: { searchParams: { suite?: string } }) {
  await redirectIfSignedIn(searchParams.suite);
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(460px,600px)_1fr]">
      <AuthAside />
      <main className="flex min-w-0 flex-col px-4 py-5 sm:px-10 sm:py-8">
        <div className="flex items-center justify-between lg:hidden"><Brand /><Link href="/" className="py-2 text-sm font-bold text-ink-mute">Retour au site</Link></div>
        <div className="flex flex-1 items-start py-8 sm:items-center sm:py-10"><Suspense><Login /></Suspense></div>
      </main>
    </div>
  );
}
