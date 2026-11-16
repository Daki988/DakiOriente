// Page vue par un visiteur d'un pays non autorisé (accès par pays, réglage du back-office).
import type { Metadata } from "next";
import { Globe2, LogIn, Mail } from "lucide-react";
import Link from "@/components/ui/Link";
import { Brand } from "@/components/ui/Brand";
import { nomPays } from "@/lib/pays-origine";
import { reglage } from "@/server/services/acces-pays";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Non disponible dans votre pays", robots: { index: false } };

const liste = (n: string[]) => (n.length > 1 ? `${n.slice(0, -1).join(", ")} et ${n[n.length - 1]}` : n[0] ?? "");

export default async function AccesRestreint() {
  const pays = await reglage().then((r) => r.pays.map(nomPays)).catch(() => [] as string[]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f6f8fe] px-6 py-10 text-center">
      <Brand />
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600"><Globe2 size={40} /></span>
      <div className="max-w-lg">
        <h1 className="text-3xl font-extrabold">Navigoal n&apos;est pas encore disponible dans votre pays</h1>
        {pays.length > 0 && <p className="mt-3 text-ink-mute">La plateforme est ouverte aux élèves, étudiants et parents qui se connectent depuis {liste(pays)}.</p>}
        <p className="mt-2 text-ink-mute">Vous êtes dans l&apos;un de ces pays et voyez ce message ? Désactivez votre VPN ou votre proxy, puis rechargez la page.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <a href="mailto:contact@navigoal.net" className="btn-primary"><Mail size={16} />Nous écrire</a>
        <Link href="/connexion/" className="btn-ghost"><LogIn size={16} />Espace école ou bailleur</Link>
      </div>
    </main>
  );
}
