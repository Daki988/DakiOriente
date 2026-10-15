import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { Stepper } from "./Signup";

/** En-tête des pages d'inscription, de vérification et de mot de passe oublié. */
export function AuthTop({ step, login = true }: { step?: 1 | 2 | 3; login?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3 sm:h-[72px]">
        <Brand />
        {step && <Stepper step={step} />}
        {login && <span className="flex items-center gap-3 text-sm text-ink-mute"><span className="hidden sm:inline">Déjà inscrit·e ?</span><Link href="/connexion" className="btn-ghost min-h-[40px] px-4 py-2">Se connecter</Link></span>}
      </div>
    </header>
  );
}
