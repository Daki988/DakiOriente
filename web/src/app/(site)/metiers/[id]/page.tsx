import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ChevronRight, CircleCheck, GraduationCap } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { MetierCard, domStyle } from "@/components/ui/Cards";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { admissionLabel, competenceLabel, domaineById, etabById, formationById, metierById, metiers, niveauLabel, riasec } from "@/lib/data";

export const generateStaticParams = () => metiers.map((m) => ({ id: m.id }));
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => ({ title: metierById[params.id]?.nom, description: metierById[params.id]?.description });

export default function MetierPage({ params }: { params: { id: string } }) {
  const m = metierById[params.id];
  const s = domStyle(m.domaine);
  const Icon = s.icon;
  const etabs = Array.from(new Set(m.formations.flatMap((f) => formationById[f].etablissements))).slice(0, 9);
  const proches = metiers.filter((x) => x.id !== m.id && x.domaine === m.domaine).slice(0, 4);
  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-10" style={{ background: `linear-gradient(135deg, ${s.bg}, #f6f8fe 70%)` }}>
        <Icon size={320} strokeWidth={1} className="absolute -right-10 -top-10 opacity-[.07]" style={{ color: s.solid }} />
        <div className="container relative flex flex-col gap-5">
          <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/metiers">Métiers</Link><ChevronRight size={14} /><span>{m.nom}</span></nav>
          <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl text-white shadow-lift" style={{ background: s.solid }}><Icon size={40} /></span>
            <div><h1 className="h-section">{m.nom}</h1><p className="mt-2 max-w-2xl text-lg text-ink-soft">{m.description}</p></div>
          </Reveal>
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-white px-3 py-2 text-ink-soft shadow-sm">{domaineById[m.domaine].libelle}</span>
            <span className="chip bg-white px-3 py-2 text-ink-soft shadow-sm">Niveau : {niveauLabel(m.niveau_min)}</span>
            {m.riasec.map((c) => <span key={c} className="chip bg-brand-600 px-3 py-2 text-white">{c} · {riasec.find((r) => r.code === c)!.profil}</span>)}
          </div>
        </div>
      </section>
      <div className="container grid gap-6 lg:grid-cols-3">
        <Reveal className="card flex flex-col gap-3 p-6"><h2 className="text-lg font-extrabold">Missions</h2>{m.missions.map((x) => <span key={x} className="flex gap-2.5 text-ink-soft"><CircleCheck size={18} className="mt-0.5 shrink-0 text-[#0f8a46]" />{x}</span>)}</Reveal>
        <Reveal delay={0.1} className="card flex flex-col gap-3 p-6"><h2 className="text-lg font-extrabold">Compétences</h2><div className="flex flex-wrap gap-2">{m.competences.map((c) => <span key={c} className="chip bg-brand-50 text-brand-700">{competenceLabel(c)}</span>)}</div></Reveal>
        <Reveal delay={0.2} className="card flex flex-col gap-3 p-6"><h2 className="text-lg font-extrabold">Où travailler ?</h2>{m.secteurs.map((x) => <span key={x} className="flex items-center gap-2.5 text-ink-soft"><Building2 size={16} className="text-brand-600" />{x}</span>)}</Reveal>
      </div>
      <section className="container mt-10 flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold">Les formations pour y arriver</h2>
        <Stagger className="grid gap-4 md:grid-cols-2">
          {m.formations.map((fid) => { const f = formationById[fid]; return (
            <StaggerItem key={fid}><Link href={`/formations/${fid}/`} className="card flex items-center gap-4 p-4 transition hover:-translate-y-1 hover:shadow-lift">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sun-100 text-[#a55a00]"><GraduationCap size={22} /></span>
              <span className="flex-1"><b className="block">{f.intitule}</b><span className="text-xs text-ink-mute">{f.diplome} · {f.duree_annees} ans · {admissionLabel(f.mode_admission)} · {f.etablissements.length} établissements</span></span><ArrowRight size={18} className="text-brand-600" />
            </Link></StaggerItem>); })}
        </Stagger>
      </section>
      {etabs.length > 0 && <section className="container mt-10 flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold">Établissements qui y préparent</h2>
        <div className="flex flex-wrap gap-3">{etabs.map((id) => <Link key={id} href={`/etablissements/${id}/`} className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white py-2 pl-2 pr-4 transition hover:border-brand-300 hover:shadow-card"><EtabLogo e={etabById[id]} size={40} /><b className="text-sm">{etabById[id].sigle}</b></Link>)}</div>
      </section>}
      {proches.length > 0 && <section className="container mt-12 flex flex-col gap-4"><h2 className="text-2xl font-extrabold">Métiers proches</h2>
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{proches.map((x) => <StaggerItem key={x.id}><MetierCard m={x} /></StaggerItem>)}</Stagger></section>}
    </>
  );
}
