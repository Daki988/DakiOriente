import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, ChevronRight, ExternalLink, KeyRound, MapPin, Scale } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { PhotoGallery } from "@/components/sections/PhotoGallery";
import { PAYS_NOM, STATUT_LONG, domaineById, etabById, etablissements, fmt, formationById, metierById, paysDetailById, residences, type Formation } from "@/lib/data";
import { COUTS, devis, formationParDefaut } from "@/lib/devis";
import { establishmentLive } from "@/server/content-ui";

export const generateStaticParams = () => etablissements.map((e) => ({ id: e.id }));
export const revalidate = 300; // reflète les mises à jour faites par l'établissement
export const generateMetadata = ({ params }: { params: { id: string } }): Metadata => ({ title: etabById[params.id]?.nom, description: `${etabById[params.id]?.nom} : formations, métiers, frais, admission des étudiants internationaux et logement.` });

const ADMISSION = ["Dossier en ligne via Navigoal (bac ou relevés de notes, CV, lettre de motivation).", "Étude du dossier et, selon le programme, test ou entretien à distance.", "Admission, paiement des frais de réservation, attestation pour le visa.", "Arrivée : carte de séjour, logement Navilease, intégration."];

export default async function EtabPage({ params }: { params: { id: string } }) {
  const live = await establishmentLive(params.id);
  const confirmed = (live?.programs ?? []).filter((p) => p.feesConfirmed || !p.indicative);
  const e = etabById[params.id];
  const P = paysDetailById[e.pays];
  const C = COUTS[e.pays];
  const forms = e.formations.map((f) => formationById[f]).filter(Boolean);
  const byDom = forms.reduce<Record<string, Formation[]>>((acc, f) => ((acc[f.domaine] ??= []).push(f), acc), {});
  const shared = (x: typeof e) => x.formations.filter((f) => e.formations.includes(f)).length;
  const similar = etablissements.filter((x) => x.id !== e.id && shared(x) >= 2).sort((a, b) => shared(b) - shared(a)).slice(0, 4);
  const res = residences.filter((r) => r.etablissements_desservis.includes(e.id));
  const fid = formationParDefaut(e.id);
  const D = fid ? devis(e.id, fid) : null;
  const typ = C.scolarite_annuelle[e.type] ?? C.scolarite_annuelle.universite;
  const B = P.budget;
  const facts: [string, string][] = [["Statut", STATUT_LONG[e.statut] ?? "Privé"], ["Ville", e.ville], ["Création", e.annee_creation ? String(e.annee_creation) : "—"], ["Formations", `${forms.length} programmes`], ["Langue", "Français" + (e.pays === "MA" ? " / anglais" : "")], ["Étudiants étrangers", "Accueillis ✓"]];
  const compare = `/comparateur/?f=${fid}&e=${[e.id, ...similar.slice(0, 2).map((x) => x.id)].join(",")}`;
  return (
    <>
      <div className="container flex flex-col gap-6 pt-7">
        <nav className="flex items-center gap-1.5 text-[13px] text-ink-mute"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/etablissements">Établissements</Link><ChevronRight size={14} /><span>{e.sigle}</span></nav>
        <Reveal className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex min-w-0 items-center gap-5">
            <EtabLogo e={e} size={88} className="shadow-card" />
            <div className="flex min-w-0 flex-col gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-[44px] sm:leading-[1.05]">{e.nom}</h1>
              <div className="flex flex-wrap gap-2"><span className="chip bg-[#e8f8ef] text-[#0f8a46]">{STATUT_LONG[e.statut] ?? "Privé"}</span><span className="chip bg-brand-50 text-brand-700">{e.type_libelle}</span><span className="chip bg-sun-100 text-[#a55a00]"><MapPin size={12} className="mr-1 inline" />{e.ville}, {PAYS_NOM[e.pays]}</span></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href={compare} className="btn-ghost"><Scale size={16} /> Comparer</Link>
            <Link href={`/devis/?etab=${e.id}`} className="btn-ghost"><Calculator size={16} /> Devis parents</Link>
            <Link href={`/espace/candidatures/nouvelle?etab=${e.id}${fid ? `&formation=${fid}` : ""}`} className="btn-primary btn-shine">Candidater <ArrowRight size={16} /></Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}><PhotoGallery e={e} /></Reveal>
        <Reveal delay={0.15} className="card grid grid-cols-2 gap-5 rounded-[20px] px-6 py-5 sm:grid-cols-3 lg:grid-cols-6">
          {facts.map(([a, b]) => <div key={a} className="flex min-w-0 flex-col gap-1"><span className="text-xs font-bold text-ink-mute">{a}</span><b className="text-[15px]">{b}</b></div>)}
        </Reveal>
      </div>

      <div className="container mt-10 grid items-start gap-10 lg:grid-cols-[1fr_380px]">
        <div className="flex min-w-0 flex-col gap-8">
          <nav className="sticky top-[76px] z-10 -mx-1 flex gap-6 overflow-x-auto border-b border-slate-200 bg-[#f6f8fe]/90 px-1 backdrop-blur" aria-label="Sections">
            {[["#formations", "Formations & métiers"], ["#admission", "Admission"], ["#frais", "Frais & bourses"], ["#logement", "Logement"]].map(([h, t], k) => <a key={h} href={h} className={`shrink-0 whitespace-nowrap py-3 text-sm font-bold ${k === 0 ? "border-b-[3px] border-brand-600 text-brand-600" : "text-ink-mute hover:text-brand-600"}`}>{t}</a>)}
          </nav>
          <section id="formations" className="flex scroll-mt-32 flex-col gap-6">
            {live?.description && <div className="card flex flex-col gap-2 rounded-[22px] p-6"><h2 className="text-lg font-extrabold">Présentation</h2><p className="whitespace-pre-line leading-relaxed text-ink-soft">{live.description}</p></div>}
            {confirmed.length > 0 && (
              <div className="card flex flex-col gap-3 rounded-[22px] p-6">
                <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Frais confirmés par l&apos;établissement</h2><span className="chip bg-[#e8f8ef] text-[#0f8a46]">Vérifié</span></div>
                {confirmed.map((p) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f4fb] pb-2 text-sm last:border-0"><span className="font-semibold">{p.title}{p.startDate ? <span className="text-ink-mute"> · rentrée {p.startDate}</span> : null}</span><span className="text-ink-soft">{p.tuitionMin != null ? `${fmt(p.tuitionMin)}${p.tuitionMax && p.tuitionMax !== p.tuitionMin ? ` – ${fmt(p.tuitionMax)}` : ""} ${p.currency ?? ""}/an` : "sur demande"}{p.applicationFee ? ` · dossier ${fmt(p.applicationFee)} ${p.currency ?? ""}` : ""}</span></div>)}
              </div>
            )}
            <div><h2 className="text-[28px] font-extrabold tracking-tight">Formations et débouchés</h2><p className="text-ink-mute">Chaque programme est relié aux métiers qu&apos;il prépare et aux séries du bac qui y donnent accès.</p></div>
            {Object.entries(byDom).map(([d, fs]) => (
              <div key={d} className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5"><span className="chip bg-brand-50 px-3 py-1.5 text-[13px] text-brand-700">{domaineById[d]?.libelle ?? d}</span><span className="text-[13px] text-ink-mute">{fs.length} programme{fs.length > 1 ? "s" : ""}</span></div>
                <Stagger className="flex flex-col gap-3">
                  {fs.map((f) => (
                    <StaggerItem key={f.id} className="flex flex-col gap-3 rounded-2xl border border-[#eef1f8] bg-white p-4 md:flex-row md:items-center md:gap-4">
                      <Link href={`/formations/${f.id}/?etab=${e.id}`} className="flex flex-col gap-1 md:w-[300px] md:shrink-0"><b className="text-[15px] hover:text-brand-600">{f.intitule}</b><span className="text-xs text-ink-mute">{f.diplome} · {f.duree_annees} an{f.duree_annees > 1 ? "s" : ""} · {f.mode_admission === "concours" ? "Sur concours" : "Sur dossier"}</span></Link>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5"><span className="text-[11px] font-extrabold text-ink-mute">MÈNE AUX MÉTIERS</span><div className="flex flex-wrap gap-1.5">{f.metiers.slice(0, 3).map((m) => metierById[m] && <Link key={m} href={`/metiers/${m}/`} className="chip bg-[#f1edff] text-[#6a3df0] hover:bg-[#e4dcff]">{metierById[m].nom}</Link>)}</div></div>
                      <Link href={`/comparateur/?f=${f.id}&e=${e.id}`} className="btn-ghost shrink-0 self-start px-3 py-2 text-[13px] md:self-center"><Scale size={14} /> Comparer</Link>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            ))}
            <p className="text-xs text-ink-mute">Offre indicative, à confirmer par l&apos;établissement.</p>
          </section>
          <section id="admission" className="scroll-mt-32"><Reveal className="card flex flex-col gap-3 rounded-[22px] p-6">
            <h3 className="text-lg font-extrabold">Admission des étudiants internationaux</h3>
            {ADMISSION.map((t, k) => <div key={k} className="flex items-start gap-3"><span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-extrabold text-brand-600">{k + 1}</span><span className="pt-1 text-sm text-ink-soft">{t}</span></div>)}
            <Link href={`/pays/${e.pays.toLowerCase()}/`} className="text-[13px] font-bold text-brand-600">Visa et carte de séjour : lire la fiche {P.nom} →</Link>
          </Reveal></section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <div id="frais" className="card flex scroll-mt-28 flex-col gap-3.5 rounded-3xl p-6 shadow-[0_30px_60px_-24px_rgba(26,71,245,.4)]">
            <div className="flex items-center justify-between"><b>Budget annuel estimé</b><span className="chip bg-sun-100 text-[#a55a00]">estimation</span></div>
            {([["Frais de scolarité", `${fmt(typ.min)} – ${fmt(typ.max)} ${C.devise}`], ["Vie (10 mois)", `${fmt(B.total_mensuel.min * 10)} – ${fmt(B.total_mensuel.max * 10)} ${B.devise}`], ["Visa & séjour", "voir fiche pays"]] as const).map(([a, b]) => <div key={a} className="flex justify-between gap-3 text-sm"><span className="text-ink-mute">{a}</span><b className="text-right">{b}</b></div>)}
            {D && <div className="rounded-2xl bg-brand-50 p-3 text-[13px]"><span className="text-ink-mute">Coût total sur {D.years} an{D.years > 1 ? "s" : ""} (tout compris) :</span><b className="block text-brand-700">{fmt(D.total[0])} – {fmt(D.total[1])} {D.devise}</b></div>}
            <Link href={`/devis/?etab=${e.id}`} className="btn-primary btn-shine py-2.5"><Calculator size={17} /> Obtenir le devis complet</Link>
            <span className="text-center text-xs text-ink-mute">Frais exacts transmis par l&apos;établissement sous 72 h via Navigoal</span>
          </div>
          {similar.length > 0 && <div className="card flex flex-col gap-2.5 rounded-[22px] p-5">
            <b>Établissements comparables</b>
            {similar.map((x) => <Link key={x.id} href={`/etablissements/${x.id}/`} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200"><EtabLogo e={x} size={42} /><span className="min-w-0 flex-1"><b className="block text-[13px]">{x.sigle}</b><span className="text-xs text-ink-mute">{x.ville.split("/")[0].trim()}, {PAYS_NOM[x.pays]}</span></span><span className="chip shrink-0 bg-[#e8f8ef] text-[#0f8a46]">{shared(x)} en commun</span></Link>)}
            <Link href={compare} className="btn-ghost py-2.5"><Scale size={16} /> Ouvrir le comparateur</Link>
          </div>}
          <div id="logement" className="card flex scroll-mt-28 flex-col gap-2.5 rounded-[22px] bg-gradient-to-br from-white to-[#fff7dd] p-5">
            <div className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Logements à proximité</b></div>
            {res.map((r) => <div key={r.id} className="rounded-xl border border-[#f3e6bd] bg-white p-3 text-[13px]"><b>{r.nom}</b><span className="block text-ink-mute">{r.gestionnaire}</span></div>)}
            <span className="text-[13px] text-ink-mute">Studios et colocations vérifiés · dès {fmt(B.lignes[0].min)} {B.devise}/mois</span>
            <Link href="/navilease" className="btn-primary py-2.5">Voir sur Navilease</Link>
          </div>
          <div className="card flex flex-col gap-2 rounded-[22px] p-5">
            <b>Étudier au {P.nom}</b><span className="text-[13px] text-ink-mute">Visa, coût de la vie, reconnaissance des diplômes.</span>
            <Link href={`/pays/${e.pays.toLowerCase()}/`} className="text-[13px] font-bold text-brand-600">Lire la fiche pays →</Link>
            {e.site_web && <a href={e.site_web} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-ink-soft hover:text-brand-600">Site officiel <ExternalLink size={14} /></a>}
          </div>
        </aside>
      </div>
    </>
  );
}
