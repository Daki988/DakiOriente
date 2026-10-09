import Link from "next/link";
import { Compass } from "lucide-react";
import { Brand } from "@/components/ui/Brand";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f6f8fe] px-6 text-center">
      <Brand />
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600"><Compass size={40} /></span>
      <div><h1 className="text-3xl font-extrabold">Page introuvable</h1><p className="mt-2 text-ink-mute">Cette page n&apos;existe pas ou a été déplacée.</p></div>
      <div className="flex flex-wrap justify-center gap-3"><Link href="/" className="btn-primary">Retour à l&apos;accueil</Link><Link href="/recherche" className="btn-ghost">Rechercher</Link></div>
    </main>
  );
}
