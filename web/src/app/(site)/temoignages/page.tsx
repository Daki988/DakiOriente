import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { TemoignagesListe } from "@/components/sections/TemoignagesListe";
import { AVERTISSEMENT } from "@/components/ui/Temoignages";
import { temoignages } from "@/lib/temoignages";

export const metadata: Metadata = {
  title: "Ils racontent leur métier : témoignages de professionnels",
  description: `${temoignages.length} professionnels, d'Afrique et d'ailleurs, présentent leur quotidien et racontent leurs anecdotes : médecin, ingénieur, juriste, enseignant…`,
  alternates: { canonical: "/temoignages/" },
};

export default function TemoignagesPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-sun-100 to-[#f6f8fe] pb-8 pt-10">
        <div className="container flex flex-col gap-3">
          <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/metiers/">Métiers</Link><ChevronRight size={14} /><span>Témoignages</span></nav>
          <h1 className="h-section">Ils racontent leur métier</h1>
          <p className="max-w-3xl text-lg text-ink-soft">{temoignages.length} professionnels, d&apos;Afrique et d&apos;ailleurs, présentent leur quotidien et racontent leurs anecdotes. Choisis un domaine, puis ouvre la fiche du métier.</p>
        </div>
      </section>
      <section className="container mt-8">
        <TemoignagesListe />
        <p className="mt-8 flex gap-2 rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-mute"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0f8a46]" /><span>{AVERTISSEMENT} <a href="mailto:contact@navigoal.net?subject=T%C3%A9moignage" className="font-bold text-brand-600">contact@navigoal.net</a></span></p>
      </section>
    </>
  );
}
