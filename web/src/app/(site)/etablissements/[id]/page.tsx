import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Calculator, ChevronRight, ExternalLink, KeyRound, MapPin, Scale } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { PhotoGallery } from "@/components/sections/PhotoGallery";
import { STATUT_LONG, domaineById, etabById, etablissements, fmt, labelById, metierById, niveauLabel, paysDetailById, residences, formationById, type Filiere } from "@/lib/data";
import { LabelChip } from "@/components/ui/Cards";
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
  // Filières homologuées, regroupées par composante (universités) ou par domaine
  const groupe = (f: Filiere) => f.composante ?? domaineById[f.domaine ?? ""]?.libelle ?? "Autres filières";
  const groupes = e.filieres.reduce<Record<string, Filiere[]>>((acc, f) => ((acc[groupe(f)] ??= []).push(f), acc), {});
  const shared = (x: typeof e) => x.formations.filter((f) => e.formations.includes(f)).length;
  const similar = etablissements.filter((x) => x.id !== e.id && shared(x) >= 2).sort((a, b) => shared(b) - shared(a)).slice(0, 4);
  const res = residences.filter((r) => r.etablissements_desservis.includes(e.id));
  const fid = formationParDefaut(e.id);
  const D = fid ? devis(e.id, fid) : null;
  const typ = C.scolarite_annuelle[e.type] ?? C.scolarite_annuelle.universite;
  const B = P.budget;
  const facts: [string, string][] = [["Label", labelById[e.label]?.libelle ?? "—"], ["Statut", STATUT_LONG[e.statut] ?? "Privé"], ["Ville", e.ville], ["Création", e.annee_creation ? String(e.annee_creation) : "—"], ["Filières homologuées", String(e.filieres.length)], ["Étudiants étrangers", "Accueillis ✓"]];
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
              <div className="flex flex-wrap gap-2"><LabelChip label={e.label} /><span className="chip bg-brand-50 text-brand-700">{e.type_libelle}</span><span className="chip bg-sun-100 text-[#a55a00]"><MapPin size={12} className="mr-1 inline" />{e.ville}, Maroc</span></div>
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
            <div className="card flex flex-col gap-2 rounded-[22px] border-[#cdeedd] bg-[#f3fbf6] p-5">
              <div className="flex items-center gap-2 font-extrabold text-[#0f8a46]"><BadgeCheck size={18} /> {labelById[e.label]?.libelle}</div>
              <p className="text-sm text-ink-soft">{labelById[e.label]?.description}{e.reconnaissance_en_cours ? " Reconnaissance par l'État en cours d'attribution." : ""}</p>
              {e.reconnaissance && <p className="text-xs text-ink-mute">Source : {e.reconnaissance}.</p>}
            </div>
            {(live?.description ?? e.description) && <div className="card flex flex-col gap-2 rounded-[22px] p-6"><h2 className="text-lg font-extrabold">Présentation</h2><p className="whitespace-pre-line leading-relaxed text-ink-soft">{live?.description ?? e.description}</p>{e.adresse && <p className="flex items-start gap-1.5 text-sm text-ink-mute"><MapPin size={15} className="mt-0.5 shrink-0" />{e.adresse}</p>}</div>}
            {confirmed.length > 0 && (
              <div className="card flex flex-col gap-3 rounded-[22px] p-6">
                <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Frais confirmés par l&apos;établissement</h2><span className="chip bg-[#e8f8ef] text-[#0f8a46]">Vérifié</span></div>
                {confirmed.map((p) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f4fb] pb-2 text-sm last:border-0"><span className="font-semibold">{p.title}{p.startDate ? <span className="text-ink-mute"> · rentrée {p.startDate}</span> : null}</span><span className="text-ink-soft">{p.tuitionMin != null ? `${fmt(p.tuitionMin)}${p.tuitionMax && p.tuitionMax !== p.tuitionMin ? ` – ${fmt(p.tuitionMax)}` : ""} ${p.currency ?? ""}/an` : "sur demande"}{p.applicationFee ? ` · dossier ${fmt(p.applicationFee)} ${p.currency ?? ""}` : ""}</span></div>)}
              </div>
            )}
            <div><h2 className="text-[28px] font-extrabold tracking-tight">Filières homologuées et débouchés</h2><p className="text-ink-mute">Filières accréditées par l&apos;État, avec la fin de leur accréditation et le texte qui la fixe. Chacune est reliée aux métiers qu&apos;elle prépare.</p></div>
            {Object.entries(groupes).map(([g, fs]) => (
              <div key={g} className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5"><span className="chip bg-brand-50 px-3 py-1.5 text-[13px] text-brand-700">{g}</span><span className="text-[13px] text-ink-mute">{fs.length} filière{fs.length > 1 ? "s" : ""}</span></div>
                <Stagger className="flex flex-col gap-3">
                  {fs.map((f, k) => {
                    const F = f.formation ? formationById[f.formation] : undefined;
                    const info = [f.diplome ?? "Diplôme à préciser par l'établissement", f.duree_annees ? `${f.duree_annees} an${f.duree_annees > 1 ? "s" : ""}` : null, f.niveau ? niveauLabel(f.niveau) : null, f.ville].filter(Boolean).join(" · ");
                    return (
                      <StaggerItem key={`${f.intitule}-${k}`} className="flex flex-col gap-3 rounded-2xl border border-[#eef1f8] bg-white p-4 md:flex-row md:items-center md:gap-4">
                        <div className="flex flex-col gap-1 md:w-[320px] md:shrink-0">
                          {F ? <Link href={`/formations/${F.id}/?etab=${e.id}`} className="text-[15px] font-bold hover:text-brand-600">{f.intitule}</Link> : <b className="text-[15px]">{f.intitule}</b>}
                          {f.options && <span className="text-xs text-ink-soft">Options : {f.options}</span>}
                          <span className="text-xs text-ink-mute">{info}</span>
                          <span className="text-[11px] font-semibold text-[#0f8a46]" title={f.homologation.texte}>Accréditée jusqu&apos;en {f.homologation.fin}</span>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">{F && F.metiers.length > 0 && <><span className="text-[11px] font-extrabold text-ink-mute">MÈNE AUX MÉTIERS</span><div className="flex flex-wrap gap-1.5">{F.metiers.slice(0, 3).map((m) => metierById[m] && <Link key={m} href={`/metiers/${m}/`} className="chip bg-[#f1edff] text-[#6a3df0] hover:bg-[#e4dcff]">{metierById[m].nom}</Link>)}</div></>}</div>
                        {F && <Link href={`/comparateur/?f=${F.id}&e=${e.id}`} className="btn-ghost shrink-0 self-start px-3 py-2 text-[13px] md:self-center"><Scale size={14} /> Comparer</Link>}
                      </StaggerItem>
                    );
                  })}
                </Stagger>
              </div>
            ))}
            <p className="text-xs text-ink-mute">Sources : listes du ministère de l&apos;Enseignement supérieur et arrêtés d&apos;accréditation publiés au Bulletin officiel. Frais et calendrier à confirmer auprès de l&apos;établissement.</p>
          </section>
          <section id="admission" className="scroll-mt-32"><Reveal className="card flex flex-col gap-3 rounded-[22px] p-6">
            <h3 className="text-lg font-extrabold">Admission des étudiants internationaux</h3>
            {ADMISSION.map((t, k) => <div key={k} className="flex items-start gap-3"><span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand-50 text-[13px] font-extrabold text-brand-600">{k + 1}</span><span className="pt-1 text-sm text-ink-soft">{t}</span></div>)}
            <Link href="/pays/ma/#venir" className="text-[13px] font-bold text-brand-600">Visa selon ta nationalité et carte de séjour →</Link>
          </Reveal></section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <div id="frais" className="card flex scroll-mt-28 flex-col gap-3.5 rounded-3xl p-6 shadow-[0_30px_60px_-24px_rgba(26,71,245,.4)]">
            <div className="flex items-center justify-between"><b>Budget annuel estimé</b><span className="chip bg-sun-100 text-[#a55a00]">estimation</span></div>
            {([["Frais de scolarité", `${fmt(typ.min)} – ${fmt(typ.max)} ${C.devise}`], ["Vie (10 mois)", `${fmt(B.total_mensuel.min * 10)} – ${fmt(B.total_mensuel.max * 10)} ${B.devise}`], ["Visa & séjour", "selon la nationalité"]] as const).map(([a, b]) => <div key={a} className="flex justify-between gap-3 text-sm"><span className="text-ink-mute">{a}</span><b className="text-right">{b}</b></div>)}
            {D && <div className="rounded-2xl bg-brand-50 p-3 text-[13px]"><span className="text-ink-mute">Coût total sur {D.years} an{D.years > 1 ? "s" : ""} (tout compris) :</span><b className="block text-brand-700">{fmt(D.total[0])} – {fmt(D.total[1])} {D.devise}</b></div>}
            <Link href={`/devis/?etab=${e.id}`} className="btn-primary btn-shine py-2.5"><Calculator size={17} /> Obtenir le devis complet</Link>
            <span className="text-center text-xs text-ink-mute">Frais exacts transmis par l&apos;établissement sous 72 h via Navigoal</span>
          </div>
          {similar.length > 0 && <div className="card flex flex-col gap-2.5 rounded-[22px] p-5">
            <b>Établissements comparables</b>
            {similar.map((x) => <Link key={x.id} href={`/etablissements/${x.id}/`} className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 transition hover:border-brand-200"><EtabLogo e={x} size={42} /><span className="min-w-0 flex-1"><b className="block text-[13px]">{x.sigle}</b><span className="text-xs text-ink-mute">{x.ville}</span></span><span className="chip shrink-0 bg-[#e8f8ef] text-[#0f8a46]">{shared(x)} en commun</span></Link>)}
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
            <Link href="/pays/ma/" className="text-[13px] font-bold text-brand-600">Lire la fiche Maroc →</Link>
            {e.site_web && <a href={e.site_web} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1.5 text-[13px] font-bold text-ink-soft hover:text-brand-600">Site officiel <ExternalLink size={14} /></a>}
          </div>
        </aside>
      </div>
    </>
  );
}
