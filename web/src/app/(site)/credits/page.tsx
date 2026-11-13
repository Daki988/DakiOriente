import type { Metadata } from "next";
import Link from "@/components/ui/Link";
import { ChevronRight } from "lucide-react";
import credits from "../../../../public/images/credits.json";
import creditsMetiers from "../../../../public/images/credits-metiers.json";
import { metierById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Crédits des photos",
  description: "Auteurs, licences et sources des photos d'illustration utilisées sur Navigoal.",
  alternates: { canonical: "/credits/" },
};

type Ligne = { titre: string; src: string; credit: string; licence: string; page: string };

export default function CreditsPage() {
  const metiers: Ligne[] = Object.entries(creditsMetiers as Record<string, { src: string; credit: string; licence: string; page: string }>)
    .map(([id, c]) => ({ titre: metierById[id]?.nom ?? id, src: c.src, credit: c.credit, licence: c.licence, page: c.page }))
    .sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
  const generales: Ligne[] = (credits as { id: string; src: string; alt: string; credit: string; licence: string; page: string }[])
    .map((c) => ({ titre: c.alt, src: c.src, credit: c.credit, licence: c.licence, page: c.page }));

  const Table = ({ titre, lignes, intro }: { titre: string; lignes: Ligne[]; intro: string }) => (
    <section className="flex flex-col gap-3">
      <div><h2 className="h-section">{titre}</h2><p className="mt-1 text-sm text-ink-mute">{intro}</p></div>
      <ul className="flex flex-col divide-y divide-[#eef1f8] rounded-2xl border border-[#eef1f8] bg-white">
        {lignes.map((l) => (
          <li key={l.src} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
            <span className="font-semibold">{l.titre}</span>
            <span className="text-ink-mute">
              {l.page ? <a href={l.page} target="_blank" rel="noreferrer nofollow" className="font-semibold text-brand-600 hover:underline">{l.credit}</a> : l.credit}
              {l.licence && <> · {l.licence}</>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="container flex flex-col gap-10 py-10">
      <div className="flex flex-col gap-3">
        <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><span>Crédits des photos</span></nav>
        <h1 className="h-display">Crédits des <span className="text-sun-500">photos</span></h1>
        <p className="max-w-3xl text-lg text-ink-soft">Navigoal illustre ses pages avec des photos libres de droits. Chaque image est créditée à son auteur, avec sa licence et un lien vers l&apos;original. Les photos des villes sont créditées sur chaque page de ville, celles des établissements appartiennent aux écoles.</p>
        <p className="text-sm text-ink-mute">Une correction ou un retrait à demander : <a href="mailto:contact@navigoal.net" className="font-bold text-brand-600">contact@navigoal.net</a>.</p>
      </div>
      <Table titre="Métiers" lignes={metiers} intro="Une photo par fiche métier, relevée sur Openverse (Wikimedia Commons, Flickr, Rawpixel…)." />
      <Table titre="Domaines et pages générales" lignes={generales} intro="Illustrations des domaines, de l'accueil et des pages de présentation." />
    </div>
  );
}
