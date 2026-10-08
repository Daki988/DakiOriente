import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { PaysCard } from "@/components/ui/Cards";
import { CtaBand } from "@/components/ui/CtaBand";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { pays } from "@/lib/data";

export const metadata: Metadata = { title: "Pays", description: "Gabon, Maroc, Sénégal : formations, établissements et logement étudiant." };

export default function PaysPage() {
  return (
    <>
      <PageHero crumb="Pays" title="Explore les opportunités" accent="par pays" sub="Lancement au Gabon, au Maroc et au Sénégal. D'autres pays arrivent bientôt." hand="Étudier, se former, évoluer partout en Afrique." />
      <div className="container flex flex-col gap-10">
        <Stagger className="grid gap-6 md:grid-cols-3">{(["GA", "MA", "SN"] as const).map((c) => <StaggerItem key={c}><PaysCard code={c} /></StaggerItem>)}</Stagger>
        <div className="grid gap-6 md:grid-cols-3">
          {pays.map((p, k) => (
            <Reveal key={p.id} delay={k * 0.1} className="card flex flex-col gap-3 p-6">
              <b className="text-lg">{p.nom} en bref</b>
              <span className="text-sm text-ink-soft">Capitale : <b>{p.capitale}</b> · Monnaie : <b>{p.monnaie}</b></span>
              <div className="text-xs font-bold uppercase text-ink-mute">Villes universitaires</div>
              <div className="flex flex-wrap gap-1.5">{p.villes_universitaires.map((v) => <span key={v} className="chip bg-[#f6f8fe] text-ink-soft">{v}</span>)}</div>
              <div className="text-xs font-bold uppercase text-ink-mute">Paiement sur Navigoal</div>
              <div className="flex flex-wrap gap-1.5">{p.paiement_mobile.map((v) => <span key={v} className="chip bg-brand-50 text-brand-700">{v}</span>)}</div>
            </Reveal>
          ))}
        </div>
      </div>
      <CtaBand />
    </>
  );
}
