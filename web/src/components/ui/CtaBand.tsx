import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, House, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";

export function CtaBand({ title = <>Construis ton avenir avec <span className="text-sun-400">Navigoal</span></>, sub = "Orientation, formations, candidatures et logement : tout ton parcours au même endroit." }: { title?: ReactNode; sub?: string }) {
  const feats = [
    [GraduationCap, "Formations vérifiées"], [Building2, "Établissements partenaires"], [House, "Logements Navilease"], [Sparkles, "Recommandations IA"],
  ] as const;
  return (
    <Reveal className="container mt-24">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-brand-950 via-brand-800 to-brand-600 px-6 py-12 text-white sm:px-14">
        <div className="absolute -right-20 -top-28 h-96 w-96 animate-float rounded-full bg-[radial-gradient(circle,rgba(255,194,31,.35),transparent_70%)]" />
        <div className="relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
          <div className="flex max-w-xl flex-col gap-4">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-[34px]">{title}</h2>
            <p className="leading-relaxed text-[#c9d6ff]">{sub}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/espace" className="btn-sun btn-shine">Créer mon compte gratuitement <ArrowRight size={18} /></Link>
              <Link href="/orientation" className="btn border border-white/35 text-white hover:bg-white/10">Passer le test d&apos;orientation</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {feats.map(([Icon, t]) => (
              <div key={t} className="flex w-28 flex-col items-center gap-2 text-center">
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10"><Icon size={24} /></div>
                <span className="text-[13px] font-semibold">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
