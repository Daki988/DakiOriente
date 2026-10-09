import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { Stepper } from "./Signup";

export function AuthTop({ step }: { step?: 1 | 2 | 3 }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="container flex h-[72px] items-center justify-between gap-4">
        <Brand />
        {step && <Stepper step={step} />}
        <span className="flex items-center gap-3 text-sm text-ink-mute"><span className="hidden sm:inline">Déjà inscrit·e ?</span><Link href="/connexion" className="btn-ghost py-2.5">Se connecter</Link></span>
      </div>
    </header>
  );
}
