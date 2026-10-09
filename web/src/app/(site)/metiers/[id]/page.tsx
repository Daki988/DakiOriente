import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ChevronRight, CircleCheck, GraduationCap, Scale } from "lucide-react";
import { CompatCard } from "@/components/sections/CompatCard";
import { ParcoursFlow } from "@/components/sections/ParcoursFlow";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { MetierCard, domStyle } from "@/components/ui/Cards";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { PAYS_NOM, admissionLabel, competenceLabel, domaineById, etabById, formationById, metierById, metiers, niveauLabel, riasec, serieById } from "@/lib/data";

export const generateStaticParams = () => metiers.map((m) => ({ id: m.id }));
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => ({ title: metierById[params.id]?.nom, description: metierById[params.id]?.description });

export default function MetierPage({ params }: { params: { id: string } }) {
  const m = metierById[params.id];
  const s = domStyle(m.domaine);
  const Icon = s.icon;
  const forms = m.formations.map((f) => formationById[f]).filter(Boolean);
  const avecEcoles = forms.filter((f) => f.etablissements.some((x) => etabById[x]));
  const ecoles = Array.from(new Set(forms.flatMap((f) => f.etablissements.filter((x) => etabById[x]))));
  const paysEcoles = Array.from(new Set(ecoles.map((x) => PAYS_NOM[etabById[x].pays])));
  const seriesCodes = Array.from(new Set(forms.flatMap((f) => Object.values(f.series_recommandees).flat()))).map((x) => serieById[x]?.code).filter(Boolean);
  const niveaux = Array.from(new Set(forms.sort((a, b) => a.duree_annees - b.duree_annees).map((f) => f.diplome.split(" ")[0])));
  const proches = metiers.filter((x) => x.id !== m.id && x.domaine === m.domaine).slice(0, 4);
  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-10" style={{ background: `linear-gradient(135deg, ${s.bg}, #f6f8fe 70%)` }}>
        <Icon size={320} strokeWidth={1} className="absolute -right-10 -top-10 opacity-[.07]" style={{ color: s.solid }} />
        <div className="container relative flex flex-col gap-5">
          <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/metiers">Métiers</Link><ChevronRight size={14} /><span>{m.nom}</span></nav>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl text-white shadow-lift" style={{ background: s.solid }}><Icon size={40} /></span>
              <div><h1 className="h-section">Devenir {m.nom.charAt(0).toLowerCase() + m.nom.slice(1)}</h1><p className="mt-2 max-w-2xl text-lg text-ink-soft">{m.description}</p></div>
            </Reveal>
            <CompatCard riasec={m.riasec} niveau={niveauLabel(m.niveau_min)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-white px-3 py-2 text-ink-soft shadow-sm">{domaineById[m.domaine].libelle}</span>
            <span className="chip bg-white px-3 py-2 text-ink-soft shadow-sm">Niveau : {niveauLabel(m.niveau_min)}</span>
            {m.riasec.map((c) => <span key={c} className="chip bg-brand-600 px-3 py-2 text-white">{c} · {riasec.find((r) => r.code === c)!.profil}</span>)}
          </div>
        </div>
      </section>
      <div className="container mt-2">
        <ParcoursFlow steps={[["Série au lycée", seriesCodes.slice(0, 6).join(", ") || "Toutes séries"], [`${forms.length} formation${forms.length > 1 ? "s" : ""}`, niveaux.slice(0, 3).join(" → ") || "—"], [`${ecoles.length} école${ecoles.length > 1 ? "s" : ""}`, paysEcoles.length ? `au ${paysEcoles.join(", ")}` : "bientôt"], [m.nom, "ton futur métier"]]} />
      </div>
      <div className="container mt-10 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-[28px] font-extrabold tracking-tight">Les formations et où les suivre</h2>
          <Stagger className="flex flex-col gap-4">
            {avecEcoles.map((f) => { const es = f.etablissements.filter((x) => etabById[x]); return (
              <StaggerItem key={f.id} className="card flex flex-col gap-3 rounded-[20px] p-5">
                <div className="flex items-start justify-between gap-3"><Link href={`/formations/${f.id}/`} className="flex flex-col gap-1"><b className="hover:text-brand-600">{f.intitule}</b><span className="text-xs text-ink-mute">{f.diplome} · {f.duree_annees} an{f.duree_annees > 1 ? "s" : ""} après le bac · {admissionLabel(f.mode_admission)}</span></Link><span className="chip shrink-0 bg-[#e8f8ef] text-[#0f8a46]">{es.length} école{es.length > 1 ? "s" : ""} privée{es.length > 1 ? "s" : ""}</span></div>
                <div className="flex flex-wrap gap-2">{es.slice(0, 6).map((x) => <Link key={x} href={`/etablissements/${x}/`} className="flex items-center gap-2 rounded-xl border border-[#eef1f8] bg-white py-1.5 pl-1.5 pr-2.5 transition hover:border-brand-300"><EtabLogo e={etabById[x]} size={32} /><b className="text-xs">{etabById[x].sigle}</b><span className="text-[11px] text-ink-mute">{PAYS_NOM[etabById[x].pays]}</span></Link>)}{es.length > 6 && <span className="self-center text-xs font-bold text-ink-mute">+{es.length - 6}</span>}</div>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><span className="text-xs text-ink-mute">Compétences : {f.competences.slice(0, 3).map(competenceLabel).join(", ")}</span><Link href={`/comparateur/?f=${f.id}`} className="btn-ghost shrink-0 self-start whitespace-nowrap px-3 py-2 text-[13px]"><Scale size={14} /> Comparer ces écoles</Link></div>
              </StaggerItem>); })}
            {forms.filter((f) => !avecEcoles.includes(f)).map((f) => <StaggerItem key={f.id}><Link href={`/formations/${f.id}/`} className="card flex items-center gap-4 p-4 transition hover:shadow-lift"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sun-100 text-[#a55a00]"><GraduationCap size={20} /></span><span className="flex-1"><b className="block text-sm">{f.intitule}</b><span className="text-xs text-ink-mute">{f.diplome} · {f.duree_annees} ans · écoles partenaires bientôt disponibles</span></span><ArrowRight size={16} className="text-brand-600" /></Link></StaggerItem>)}
          </Stagger>
        </section>
        <aside className="flex flex-col gap-5">
          <Reveal className="card flex flex-col gap-2.5 rounded-[22px] p-6"><h3 className="text-lg font-extrabold">Missions</h3>{m.missions.map((x) => <span key={x} className="flex gap-2.5 text-sm text-ink-soft"><CircleCheck size={16} className="mt-0.5 shrink-0 text-[#0f8a46]" />{x}</span>)}</Reveal>
          <Reveal className="card flex flex-col gap-2.5 rounded-[22px] p-6"><h3 className="text-lg font-extrabold">Compétences</h3><div className="flex flex-wrap gap-2">{m.competences.map((c) => <span key={c} className="chip bg-brand-50 text-brand-700">{competenceLabel(c)}</span>)}</div></Reveal>
          <Reveal className="card flex flex-col gap-2.5 rounded-[22px] p-6"><h3 className="text-lg font-extrabold">Où travailler ?</h3>{m.secteurs.map((x) => <span key={x} className="flex items-center gap-2.5 text-sm text-ink-soft"><Building2 size={16} className="shrink-0 text-brand-600" />{x}</span>)}</Reveal>
          {ecoles.length > 0 && <Reveal className="flex flex-col gap-2.5 rounded-[22px] bg-gradient-to-br from-brand-950 to-brand-700 p-6 text-white"><b className="text-lg">Compare les écoles qui mènent à ce métier</b><span className="text-[13px] text-[#c9d6ff]">Frais, admission, visa, logement : côte à côte.</span><Link href={`/comparateur/?m=${m.id}`} className="btn-sun btn-shine mt-1"><Scale size={16} /> Ouvrir le comparateur</Link></Reveal>}
        </aside>
      </div>
      {proches.length > 0 && <section className="container mt-12 flex flex-col gap-4"><h2 className="text-2xl font-extrabold">Métiers proches</h2>
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{proches.map((x) => <StaggerItem key={x.id}><MetierCard m={x} /></StaggerItem>)}</Stagger></section>}
    </>
  );
}
