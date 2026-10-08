import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { FadeIn, WordsReveal } from "@/components/motion/Reveal";

export function PageHero({ crumb, title, accent, sub, hand, children }: { crumb: string; title: string; accent?: string; sub: string; hand?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(900px_400px_at_85%_0%,#dae6ff,transparent_60%),radial-gradient(600px_300px_at_0%_100%,#fff3c4,transparent_60%)] pb-10 pt-10">
      <div className="container relative flex flex-col gap-5">
        <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>{crumb}</span></nav>
        <div className="flex items-end justify-between gap-6">
          <div className="flex max-w-3xl flex-col gap-3">
            <h1 className="h-display"><WordsReveal text={title} />{accent && <> <FadeIn className="text-gradient inline-block">{accent}</FadeIn></>}</h1>
            <p className="text-lg text-ink-soft">{sub}</p>
          </div>
          {hand && <p className="hidden w-56 -rotate-6 font-hand text-[26px] leading-tight text-brand-700 lg:block">{hand}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
