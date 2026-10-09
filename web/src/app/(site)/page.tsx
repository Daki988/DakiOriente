import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/sections/Hero";
import { LogosMarquee, MetiersCarousel, NavileaseTeaser, Parcours, QuickLinks } from "@/components/sections/HomeSections";
import { SectionTitle } from "@/components/ui/Section";
import { LabelCard, PaysCard, domStyle } from "@/components/ui/Cards";
import { NewsCard } from "@/components/ui/NewsCard";
import { CtaBand } from "@/components/ui/CtaBand";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { domaines, metiers } from "@/lib/data";
import { ACTUALITES } from "@/lib/content";

const DOMAINES_HOME = ["dom-sante", "dom-numerique", "dom-ingenierie", "dom-btp", "dom-energie-mines", "dom-agri-env", "dom-finance", "dom-droit"];

export default function Home() {
  return (
    <>
      <Hero />
      <QuickLinks />
      <LogosMarquee />

      <section className="container mt-24">
        <SectionTitle center eyebrow="Ton parcours" title={<>De « je ne sais pas » à « je suis installé·e »</>} sub="Navigoal t'accompagne à chaque étape, sur ton téléphone, même avec peu de données." />
        <Parcours />
      </section>

      <section className="container mt-24 flex flex-col gap-8">
        <SectionTitle eyebrow="Étudier au Maroc" title="Des diplômes homologués par l'État, pour les étudiants de toute l'Afrique" action={<Link href="/pays/ma/" className="btn-ghost">Visa, budget, villes <ArrowRight size={16} /></Link>} />
        <Stagger className="grid gap-6 md:grid-cols-3">
          <StaggerItem><PaysCard code="MA" /></StaggerItem>
          <StaggerItem><LabelCard label="reconnu_etat" /></StaggerItem>
          <StaggerItem><LabelCard label="diplomes_homologues" /></StaggerItem>
        </Stagger>
      </section>

      <section className="container mt-24 flex flex-col gap-8">
        <SectionTitle eyebrow="Domaines" title="Que veux-tu faire plus tard ?" action={<Link href="/metiers" className="btn-ghost">Tous les métiers <ArrowRight size={16} /></Link>} />
        <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {DOMAINES_HOME.map((id) => {
            const d = domaines.find((x) => x.id === id)!;
            const s = domStyle(id);
            const Icon = s.icon;
            const n = metiers.filter((m) => m.domaine === id).length;
            return (
              <StaggerItem key={id}>
                <Link href={`/metiers/?domaine=${id}`} className="card group flex h-full flex-col gap-3 rounded-[20px] p-5 transition hover:-translate-y-1 hover:shadow-lift">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[14px] transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-110" style={{ background: s.bg, color: s.fg }}><Icon size={24} /></span>
                  <span className="font-extrabold">{d.libelle.split(",")[0]}</span>
                  <span className="text-xs text-ink-mute">{n} métiers · voir les formations</span>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      <section className="mt-24">
        <div className="container"><SectionTitle eyebrow="Métiers" title="Des métiers qui recrutent en Afrique" /></div>
        <div className="mt-8"><MetiersCarousel /></div>
      </section>

      <NavileaseTeaser />

      <section className="container mt-24 flex flex-col gap-8">
        <SectionTitle eyebrow="Actualités" title="Bourses, concours, conseils" action={<Link href="/actualites" className="btn-ghost">Toutes les actualités <ArrowRight size={16} /></Link>} />
        <Stagger className="grid gap-6 md:grid-cols-3">
          {ACTUALITES.slice(0, 3).map((a) => <StaggerItem key={a.slug}><NewsCard a={a} /></StaggerItem>)}
        </Stagger>
      </section>

      <CtaBand />
    </>
  );
}
