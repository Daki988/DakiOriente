import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronRight, ExternalLink, GraduationCap, KeyRound, MapPin } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { domStyle } from "@/components/ui/Cards";
import { PAYS_NOM, admissionLabel, etabById, etablissements, formationById, niveauLabel, residences, statutLabel } from "@/lib/data";

export const generateStaticParams = () => etablissements.map((e) => ({ id: e.id }));
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => ({ title: etabById[params.id]?.nom });

export default function EtabPage({ params }: { params: { id: string } }) {
  const e = etabById[params.id];
  const forms = e.formations.map((f) => formationById[f]).filter(Boolean).sort((a, b) => a.niveau.localeCompare(b.niveau));
  const res = residences.filter((r) => r.etablissements_desservis.includes(e.id));
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-950 via-brand-700 to-brand-500 pb-20 pt-8 text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 animate-blob bg-white/10" />
        <div className="container relative flex flex-col gap-6">
          <nav className="flex items-center gap-1.5 text-[13px] text-brand-200"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/etablissements">Établissements</Link><ChevronRight size={14} /><span className="text-white">{e.sigle}</span></nav>
          <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <EtabLogo e={e} size={96} className="shadow-lift" />
            <div className="flex flex-col gap-2"><h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{e.nom}</h1>
              <div className="flex flex-wrap gap-x-3 gap-y-1 font-semibold text-brand-100"><span className="flex items-center gap-1"><MapPin size={16} />{e.ville}, {PAYS_NOM[e.pays]}</span>·<span>{e.type_libelle}</span>·<span>{statutLabel(e.statut)}</span>{e.annee_creation && <>·<span className="flex items-center gap-1"><Calendar size={16} />Depuis {e.annee_creation}</span></>}</div></div>
          </Reveal>
        </div>
      </section>
      <div className="container relative -mt-10 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <div className="card flex items-center justify-between p-5"><b>{forms.length} formations proposées</b><span className="text-xs text-ink-mute">Offre indicative, à confirmer par l&apos;établissement</span></div>
          <Stagger className="grid gap-4 md:grid-cols-2">
            {forms.map((f) => { const s = domStyle(f.domaine); const I = s.icon; return (
              <StaggerItem key={f.id}><Link href={`/formations/${f.id}/?etab=${e.id}`} className="card flex h-full items-center gap-3.5 p-4 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: s.bg, color: s.fg }}><I size={20} /></span>
                <span className="flex-1"><b className="block text-sm leading-snug">{f.intitule}</b><span className="text-xs text-ink-mute">{f.diplome} · {niveauLabel(f.niveau)} · {admissionLabel(f.mode_admission)}</span></span><ArrowRight size={16} className="shrink-0 text-brand-600" />
              </Link></StaggerItem>); })}
          </Stagger>
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="card flex flex-col gap-3 p-5">
            <b>Informations</b>
            <span className="flex items-center gap-2 text-sm text-ink-soft"><MapPin size={16} className="text-brand-600" />{e.ville}, {PAYS_NOM[e.pays]}</span>
            <span className="flex items-center gap-2 text-sm text-ink-soft"><GraduationCap size={16} className="text-brand-600" />{e.type_libelle} · {statutLabel(e.statut)}</span>
            {e.site_web && <a href={e.site_web} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-1 py-2.5">Site officiel <ExternalLink size={15} /></a>}
            <Link href="/espace#candidatures" className="btn-primary btn-shine py-2.5">Candidater via Navigoal</Link>
          </div>
          <div className="card flex flex-col gap-3 bg-gradient-to-br from-white to-[#fff7dd] p-5">
            <div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Se loger à proximité</b></div>
            {res.length ? res.map((r) => <div key={r.id} className="rounded-xl border border-[#f3e6bd] bg-white p-3 text-[13px]"><b>{r.nom}</b><span className="block text-ink-mute">{r.gestionnaire}</span></div>) : <p className="text-[13px] text-ink-mute">Logements privés vérifiés disponibles sur Navilease.</p>}
            <Link href="/navilease" className="text-[13px] font-bold text-brand-600">Voir les logements Navilease →</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
