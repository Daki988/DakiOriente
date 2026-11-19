"use client";
import { Quote, Star } from "lucide-react";
import Link from "@/components/ui/Link";
import { useEffect, useState } from "react";

type T = { id: string; note: number; texte: string; nom: string; profil: string; pays: string | null };
type D = { nombre: number; moyenne: number | null; temoignages: T[] };

/**
 * « Ils parlent de Navigoal » : témoignages publiés (relus par l'équipe) et note moyenne donnée depuis les profils.
 * Rien n'est affiché tant qu'aucun témoignage n'est publié ; la moyenne n'apparaît qu'à partir de 5 notes.
 */
export function TemoignagesNavigoal({ className = "" }: { className?: string }) {
  const [d, setD] = useState<D | null>(null);
  useEffect(() => { fetch("/api/temoignages/").then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => setD(null)); }, []);
  if (!d || d.temoignages.length === 0) return null;
  return (
    <section id="temoignages" className={`container scroll-mt-28 ${className}`}>
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="eyebrow">Témoignages</span>
        <h2 className="h-section">Ils parlent de Navigoal</h2>
        {d.moyenne != null && d.nombre >= 5 && (
          <p className="flex items-center gap-1.5 text-sm text-ink-soft"><Star size={16} className="fill-sun-400 text-sun-400" /><b className="text-ink">{d.moyenne.toLocaleString("fr-FR")}</b> sur 5 · {d.nombre} avis d&apos;utilisateurs</p>
        )}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {d.temoignages.slice(0, 6).map((t) => (
          <figure key={t.id} className="card flex flex-col gap-3 rounded-[22px] p-5">
            <div className="flex items-center justify-between">
              <span className="flex" aria-label={`${t.note} sur 5`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} className={n <= t.note ? "fill-sun-400 text-sun-400" : "text-slate-300"} aria-hidden />)}</span>
              <Quote size={22} className="text-brand-100" aria-hidden />
            </div>
            <blockquote className="text-[15px] leading-relaxed text-ink-soft">« {t.texte} »</blockquote>
            <figcaption className="mt-auto text-sm"><b>{t.nom}</b><span className="text-ink-mute"> · {t.profil}{t.pays ? `, ${t.pays}` : ""}</span></figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-ink-mute">Témoignages laissés par des utilisateurs depuis leur profil et relus par l&apos;équipe Navigoal. <Link href="/compte/#avis" className="font-bold text-brand-600 hover:underline">Donner mon avis</Link></p>
    </section>
  );
}
