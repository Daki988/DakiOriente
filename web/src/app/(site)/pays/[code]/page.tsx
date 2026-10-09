import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, Calculator, Calendar, Check, ChevronRight, HeartPulse, KeyRound, MapPin, Scale, ShieldCheck, Wallet } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { RangeBar } from "@/components/motion/Bar";
import { Counter } from "@/components/motion/Counter";
import { CtaBand } from "@/components/ui/CtaBand";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { EtabPhoto } from "@/components/ui/EtabPhoto";
import { PAYS_STYLE } from "@/components/ui/Cards";
import { PhotoCollage } from "@/components/sections/PhotoCollage";
import { VenirAuMaroc } from "@/components/sections/VenirAuMaroc";
import { STATUT_LONG, etablissements, fmt, paysDetailById, paysDetails, vitrine, type PaysCode } from "@/lib/data";

export const generateStaticParams = () => paysDetails.map((p) => ({ code: p.id.toLowerCase() }));
export const dynamicParams = false; // destination unique : le Maroc
const byCode = (c: string) => paysDetailById[c.toUpperCase() as PaysCode];
export const generateMetadata = ({ params }: { params: { code: string } }): Metadata => ({ title: `Étudier au ${byCode(params.code)?.nom}`, description: byCode(params.code)?.accroche });

export default function PaysDetailPage({ params }: { params: { code: string } }) {
  const P = byCode(params.code);
  const code = P.id;
  const etabs = etablissements.filter((e) => e.pays === code);
  const B = P.budget;
  const mx = Math.max(...B.lignes.map((l) => l.max));
  const F = P.frais_prive;
  const chiffres: [string, string][] = [["Population", P.chiffres.population], ["Capitale", P.chiffres.capitale], ["Monnaie", P.chiffres.monnaie], ["Langues", P.chiffres.langues.slice(0, 2).join(", ")], ["Établissements privés", `${etabs.length} sur Navigoal`]];
  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(900px_500px_at_85%_20%,#dae6ff,transparent_60%),radial-gradient(700px_400px_at_0%_100%,#fff3c4,transparent_60%)] pb-16 pt-10">
        <div className="container grid items-center gap-10 lg:grid-cols-[1fr_1.05fr]">
          <div className="flex min-w-0 flex-col gap-5">
            <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/pays">Pays</Link><ChevronRight size={14} /><span>{P.nom}</span></nav>
            <Reveal className="flex items-center gap-3">{PAYS_STYLE[code].flag}<span className="chip bg-sun-100 text-[#a55a00]">Écoles privées aux diplômes homologués</span></Reveal>
            <Reveal delay={0.05}><h1 className="h-display">Étudier au <span className="text-brand-600">{P.nom}</span></h1></Reveal>
            <Reveal delay={0.1}><p className="text-lg leading-relaxed text-ink-soft">{P.accroche}</p></Reveal>
            <Reveal delay={0.15} className="flex flex-wrap gap-3">
              <Link href={`/etablissements/?pays=${code}`} className="btn-primary btn-shine">Voir les {etabs.length} établissements <ArrowRight size={18} /></Link>
              <Link href={`/comparateur/?pays=${code}`} className="btn-ghost"><Scale size={16} /> Comparer des écoles</Link>
            </Reveal>
          </div>
          <PhotoCollage ids={vitrine(code).slice(0, 4).map((e) => e.id)} />
        </div>
      </section>

      <div className="container relative -mt-6">
        <Reveal className="card grid grid-cols-2 gap-5 rounded-[22px] p-6 sm:grid-cols-3 lg:grid-cols-5">
          {chiffres.map(([a, b]) => <div key={a} className="flex flex-col gap-1"><span className="text-xs font-bold text-ink-mute">{a}</span><b className="text-[17px]">{b}</b></div>)}
        </Reveal>
      </div>

      <div className="container mt-14 grid items-start gap-10 lg:grid-cols-[1fr_420px]">
        <div className="flex min-w-0 flex-col gap-10">
          <section className="flex flex-col gap-4">
            <span className="eyebrow">Pourquoi le {P.nom} ?</span>
            <Stagger className="grid gap-3.5 sm:grid-cols-2">
              {P.pourquoi.map((t) => <StaggerItem key={t} className="card flex h-full items-start gap-3 rounded-[18px] p-[18px]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f8ef] text-[#0f8a46]"><Check size={20} strokeWidth={3} /></span><span className="text-sm leading-relaxed text-ink-soft">{t}</span></StaggerItem>)}
            </Stagger>
          </section>
          <section className="flex flex-col gap-4">
            <span className="eyebrow">Système d&apos;études</span>
            <Reveal className="card flex flex-col gap-3 rounded-[22px] p-6">
              <p className="leading-relaxed text-ink-soft">{P.systeme}</p>
              <div className="flex items-start gap-2.5 rounded-2xl bg-brand-50 p-3.5 text-sm leading-relaxed"><ShieldCheck size={20} className="shrink-0 text-brand-600" /><span><b>Reconnaissance des diplômes :</b> {P.reconnaissance}</span></div>
              <div className="flex items-start gap-2.5 text-sm"><Calendar size={18} className="shrink-0 text-[#a55a00]" /><span><b>Calendrier :</b> {P.calendrier}</span></div>
            </Reveal>
          </section>
          <section id="venir" className="flex scroll-mt-28 flex-col gap-4">
            <span className="eyebrow">Visa et séjour</span>
            <VenirAuMaroc />
            <Reveal className="card flex flex-col gap-4 rounded-[22px] p-6">
              {P.visa.map((t, k) => <div key={k} className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[15px] font-extrabold text-white">{k + 1}</span><p className="flex-1 pt-2 text-sm leading-relaxed text-ink-soft">{t}</p></div>)}
            </Reveal>
          </section>
          {P.bourses.length > 0 && <section className="flex flex-col gap-4">
            <span className="eyebrow">Bourses et aides</span>
            <Reveal className="card flex flex-col gap-2.5 rounded-[22px] p-6">{P.bourses.map((t) => <span key={t} className="flex items-start gap-2.5 text-sm text-ink-soft"><Check size={16} className="mt-0.5 shrink-0 text-[#0f8a46]" />{t}</span>)}</Reveal>
          </section>}
        </div>

        <aside className="flex flex-col gap-6">
          <Reveal className="card flex flex-col gap-4 rounded-3xl p-6 shadow-[0_30px_60px_-24px_rgba(26,71,245,.35)]">
            <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold">Budget mensuel étudiant</h3><span className="chip bg-sun-100 text-[#a55a00]">indicatif</span></div>
            {B.lignes.map((l, k) => (
              <div key={l.poste} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3 text-[13px] font-bold"><span>{l.poste}</span><span className="shrink-0">{fmt(l.min)} – {fmt(l.max)} {B.devise}</span></div>
                <RangeBar from={l.min} to={l.max} max={mx} delay={k * 0.1} />
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-950 to-brand-700 px-4 py-3.5 text-white"><span className="font-bold">Total estimé</span><b className="text-xl"><Counter to={B.total_mensuel.min} /> – <Counter to={B.total_mensuel.max} /> {B.devise}</b></div>
            <span className="text-xs text-ink-mute">{B.note}</span>
          </Reveal>
          <Reveal className="card flex flex-col gap-2.5 rounded-3xl p-6">
            <h3 className="text-lg font-extrabold">Frais de scolarité (privé)</h3>
            <div className="text-[26px] font-extrabold text-brand-600">{fmt(F.min)} – {fmt(F.max)} {F.devise}<span className="text-sm text-ink-mute"> {F.unite}</span></div>
            <span className="text-[13px] leading-relaxed text-ink-mute">{F.note}</span>
            <Link href={`/devis/?etab=${vitrine(code)[0]?.id ?? ""}`} className="btn-primary btn-shine mt-1 py-2.5"><Calculator size={17} /> Simuler le coût total des études</Link>
          </Reveal>
          <Reveal className="card flex flex-col gap-2.5 rounded-3xl p-6">
            <h3 className="text-lg font-extrabold">Bon à savoir</h3>
            {([[Briefcase, P.travail], [HeartPulse, P.sante], [Wallet, "Paiement : " + P.paiement.join(", ")]] as const).map(([I, t]) => <span key={t} className="flex items-start gap-2.5 text-[13px] text-ink-soft"><I size={16} className="mt-0.5 shrink-0 text-brand-600" />{t}</span>)}
          </Reveal>
          <Reveal className="card flex flex-col gap-2.5 rounded-3xl bg-gradient-to-br from-white to-[#fff7dd] p-6">
            <div className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Se loger avec Navilease</b></div>
            <span className="text-[13px] text-ink-mute">Studios et colocations vérifiés près des écoles, paiement protégé depuis ton pays.</span>
            <Link href="/navilease" className="btn-primary py-2.5">Voir les logements</Link>
          </Reveal>
        </aside>
      </div>

      <section className="container mt-14 flex flex-col gap-4">
        <span className="eyebrow">Villes étudiantes</span>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {P.villes.slice(0, 5).map((v) => { const n = etabs.filter((e) => e.ville.includes(v.nom.split(" ")[0])).length; return (
            <StaggerItem key={v.nom} className="card flex h-full flex-col gap-2 rounded-[20px] p-5">
              <span className="flex items-center gap-2"><MapPin size={18} className="text-brand-600" /><b>{v.nom}</b></span>
              <span className="text-[13px] leading-relaxed text-ink-mute">{v.profil}</span>
              {n > 0 && <Link href={`/etablissements/?pays=${code}&q=${encodeURIComponent(v.nom.split(" ")[0])}`} className="mt-auto text-xs font-bold text-brand-600">{n} établissement{n > 1 ? "s" : ""} →</Link>}
            </StaggerItem>); })}
        </Stagger>
      </section>

      <section className="container mt-14 flex flex-col gap-5">
        <div className="flex items-end justify-between gap-4"><div className="flex flex-col gap-2"><span className="eyebrow">Établissements</span><h2 className="h-section">Écoles et universités privées homologuées</h2></div><Link href={`/etablissements/?pays=${code}`} className="btn-ghost hidden sm:inline-flex">Tout voir <ArrowRight size={16} /></Link></div>
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {vitrine(code).slice(0, 8).map((e) => (
            <StaggerItem key={e.id}><Link href={`/etablissements/${e.id}/`} className="card group block h-full overflow-hidden rounded-[20px] transition hover:-translate-y-1 hover:shadow-lift">
              <EtabPhoto e={e} rounded="rounded-none" className="h-[130px] transition duration-700 group-hover:scale-105" />
              <div className="relative flex flex-col gap-1.5 px-4 pb-4 pt-7"><EtabLogo e={e} size={48} className="absolute -top-6 left-3.5 shadow-sm" /><b className="text-sm leading-snug">{e.nom}</b><span className="text-xs text-ink-mute">{e.ville} · {STATUT_LONG[e.statut] ?? "Privé"}</span></div>
            </Link></StaggerItem>
          ))}
        </Stagger>
      </section>
      <CtaBand title={<>Prêt·e à partir au <span className="text-sun-400">{P.nom}</span> ?</>} sub="Compare les écoles, prépare ton visa et réserve ton logement : Navigoal t'accompagne de ton pays jusqu'à ta rentrée." />
    </>
  );
}
