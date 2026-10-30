"use client";
import Link from "@/components/ui/Link";
import { QuestionWhatsApp } from "@/components/ui/QuestionWhatsApp";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BadgeCheck, Briefcase, Building2, Calculator, Check, ChevronRight, CircleCheck, Clock, GraduationCap, Heart, KeyRound, MapPin, School, ShieldAlert, Sparkles, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { LireUrl } from "@/hooks/useFiltres";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { EtabPhoto } from "@/components/ui/EtabPhoto";
import { LabelChip, domStyle } from "@/components/ui/Cards";
import { Prix } from "@/components/ui/Devise";
import { villeHref, villesOffre } from "@/lib/catalogue";
import { COUTS } from "@/lib/devis";
import { PAYS_NOM, admissionLabel, compatibilite, competenceLabel, domaineById, etabById, formationById, labelById, metierById, niveauLabel, paysDetailById, serieById, type Etablissement, type PaysCode } from "@/lib/data";
import { PROFILE_KEY } from "./OrientationTest";

const TABS = ["Présentation", "Conditions d'admission", "Programme", "Frais", "Débouchés"] as const;
type Tab = (typeof TABS)[number];
const FAV = "navigoal.favoris.formations";

export function FormationDetail({ id }: { id: string }) {
  const f = formationById[id];
  // Établissement et ville demandés par l'URL, lus dans le navigateur (la page reste rendue côté serveur).
  const [params, setParams] = useState(() => new URLSearchParams());
  const onUrl = useCallback((qs: string) => setParams(new URLSearchParams(qs)), []);
  const etabs = useMemo(() => f.etablissements.map((x) => etabById[x]).filter(Boolean).sort((a, b) => b.photos.length - a.photos.length || b.filieres.length - a.filieres.length), [f]);
  const demande = params.get("etab");
  const e: Etablissement | undefined = etabs.find((x) => x.id === demande) ?? etabs[0];
  const villes = e ? villesOffre(e, f.id) : [];
  const ville = villes.includes(params.get("ville") ?? "") ? params.get("ville")! : villes[0];
  const [tab, setTab] = useState<Tab>("Présentation");
  const [villeListe, setVilleListe] = useState("");
  const [nListe, setNListe] = useState(10);
  const [fav, setFav] = useState(false);
  const [profil, setProfil] = useState<string[]>(["I", "C"]);
  useEffect(() => {
    try { const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); if (p?.top) setProfil(p.top); } catch { /* ignore */ }
    try { setFav((JSON.parse(localStorage.getItem(FAV) || "[]") as string[]).includes(id)); } catch { /* ignore */ }
  }, [id]);
  const toggleFav = () => { const n = !fav; setFav(n); try { const l = JSON.parse(localStorage.getItem(FAV) || "[]") as string[]; localStorage.setItem(FAV, JSON.stringify(n ? [...new Set([...l, id])] : l.filter((x) => x !== id))); } catch { /* ignore */ } };
  const score = compatibilite(profil, id);
  const filieres = e ? [...e.filieres, ...e.filieres_echues].filter((x) => x.formation === f.id) : [];
  const progs = e?.site?.programmes.filter((p) => p.formation === f.id) ?? [];
  const campus = e?.campus?.find((c) => c.ville === ville);
  const label = campus?.label ?? e?.label;
  const C = COUTS.MA;
  const typ = e ? C.scolarite_annuelle[e.type] ?? C.scolarite_annuelle.universite : null;
  const B = paysDetailById.MA.budget;
  const series = (Object.entries(f.series_recommandees) as [PaysCode, string[]][]).filter(([, l]) => l?.length);
  const candidater = e ? `/espace/candidatures/nouvelle?etab=${e.id}&formation=${f.id}${ville && e.campus ? `&campus=${encodeURIComponent(ville)}` : ""}` : "/inscription";
  const statut = filieres[0]?.homologation;
  const villesListe = Object.entries(etabs.reduce<Record<string, number>>((a, x) => { for (const v of villesOffre(x, f.id)) a[v] = (a[v] ?? 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
  const listeEtabs = villeListe ? etabs.filter((x) => villesOffre(x, f.id).includes(villeListe)) : etabs;

  const infos: [typeof Building2, string, ReactNode][] = [
    [Building2, "Établissement", e ? <Link key="e" href={`/etablissements/${e.id}/`} className="hover:text-brand-600">{e.nom}</Link> : "—"],
    [MapPin, "Localisation", ville ? <Link key="v" href={villeHref(ville)} className="hover:text-brand-600">{ville}, Maroc{e?.campus ? " (campus)" : ""}</Link> : "—"],
    [Clock, "Durée", `${f.duree_annees} an${f.duree_annees > 1 ? "s" : ""}`],
    [GraduationCap, "Niveau", `${niveauLabel(f.niveau)} · ${f.diplome}`],
    [Users, "Admission", admissionLabel(f.mode_admission)],
  ];

  if (!e) return <div className="container py-20 text-center text-ink-mute">Cette formation n&apos;est proposée par aucun établissement pour l&apos;instant. <Link href="/formations" className="font-bold text-brand-600">Voir les formations</Link></div>;

  return (
    <>
      <LireUrl onUrl={onUrl} />
      <section className="relative">
        <div className="relative h-[200px] overflow-hidden sm:h-[260px]">
          <EtabPhoto e={e} rounded="rounded-none" className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/75 via-brand-950/25 to-brand-950/60" />
          <div className="container absolute inset-x-0 top-5"><nav className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-white/90" aria-label="Fil d'Ariane"><Link href="/">Accueil</Link><ChevronRight size={14} /><Link href="/formations">Formations</Link><ChevronRight size={14} /><span className="line-clamp-1">{f.intitule}</span></nav></div>
        </div>
        <div className="container relative -mt-16">
          <div className="card flex flex-col gap-5 rounded-[24px] p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
              <EtabLogo e={e} size={72} className="shadow-card" />
              <div className="flex min-w-0 flex-col gap-2">
                <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-extrabold leading-tight tracking-tight sm:text-[34px]">{f.intitule}</motion.h1>
                <Link href={`/etablissements/${e.id}/`} className="font-semibold text-ink-soft hover:text-brand-600">{e.nom}</Link>
                <div className="flex flex-wrap gap-1.5 text-[13px]">
                  <span className="chip bg-[#f6f8fe] text-ink-soft"><MapPin size={12} />{ville}{villes.length > 1 ? ` · ${villes.length} campus` : ""}</span>
                  <span className="chip bg-brand-50 text-brand-700"><GraduationCap size={12} />{niveauLabel(f.niveau)}</span>
                  <span className="chip bg-[#f6f8fe] text-ink-soft"><Clock size={12} />{f.duree_annees} ans</span>
                  {label && <LabelChip label={label} court />}
                  <span className="chip bg-[#e8f8ef] text-[#0f8a46]" title={`Estimation selon ton profil d'intérêts ${profil.join("+")}`}><Sparkles size={12} />{score} % compatible</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Link href={candidater} className="btn-primary btn-shine">Candidater maintenant <ArrowRight size={16} /></Link>
              <motion.button whileTap={{ scale: 0.95 }} onClick={toggleFav} aria-pressed={fav} className={`btn border ${fav ? "border-[#ffc5cf] bg-[#ffecef] text-[#d42a50]" : "border-brand-200 bg-white text-brand-700"}`}>
                <Heart size={16} fill={fav ? "currentColor" : "none"} />{fav ? "Dans mes favoris" : "Ajouter aux favoris"}
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mt-6 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:gap-5 sm:px-0" role="tablist">
            {TABS.map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`relative min-h-[44px] shrink-0 px-2 py-3 text-sm font-bold transition sm:px-0 ${tab === t ? "text-brand-600" : "text-ink-mute hover:text-ink"}`}>
                {t}{tab === t && <motion.span layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-brand-600" />}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="flex flex-col gap-5">
              {tab === "Présentation" && (
                <div className="card flex flex-col gap-4 p-6 sm:p-7">
                  <h2 className="text-xl font-extrabold">Présentation de la formation</h2>
                  <p className="leading-relaxed text-ink-soft">{f.intitule} : {f.diplome.toLowerCase()} du domaine « {domaineById[f.domaine].libelle.toLowerCase()} », préparé en {f.duree_annees} an{f.duree_annees > 1 ? "s" : ""} (niveau {niveauLabel(f.niveau)}). Elle prépare notamment aux métiers de {f.metiers.slice(0, 3).map((m) => metierById[m]?.nom.toLowerCase()).filter(Boolean).join(", ")}.</p>
                  <p className="leading-relaxed text-ink-soft">Au Maroc, elle est proposée par <b className="text-ink">{etabs.length} établissement{etabs.length > 1 ? "s" : ""}</b> privé{etabs.length > 1 ? "s" : ""} référencé{etabs.length > 1 ? "s" : ""} sur Navigoal.</p>
                  <h3 className="mt-1 text-lg font-extrabold">Objectifs</h3>
                  {f.competences.map((c) => <span key={c} className="flex items-start gap-2.5 text-ink-soft"><CircleCheck size={18} className="mt-0.5 shrink-0 text-[#0f8a46]" />Maîtriser : {competenceLabel(c).toLowerCase()}</span>)}
                </div>
              )}
              {tab === "Conditions d'admission" && (
                <div className="card flex flex-col gap-4 p-6 sm:p-7">
                  <h2 className="text-xl font-extrabold">Conditions d&apos;admission</h2>
                  <p className="text-ink-soft">Mode d&apos;admission habituel : <b className="text-ink">{admissionLabel(f.mode_admission)}</b>. Les conditions précises (notes, quotas, calendrier) sont fixées par chaque établissement.</p>
                  {e.site?.admission && ((e.site.admission.conditions?.length ?? 0) + (e.site.admission.etapes?.length ?? 0) > 0) && (
                    <div className="flex flex-col gap-1.5 rounded-2xl bg-[#f6f8fe] p-4 text-sm text-ink-soft">
                      <b className="text-ink">Selon {e.sigle || e.nom} (site officiel)</b>
                      {[...(e.site.admission.conditions ?? []), ...(e.site.admission.etapes ?? [])].slice(0, 8).map((t) => <span key={t} className="flex items-start gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[#0f8a46]" />{t}</span>)}
                      {e.site.admission.dates && <span><b>Calendrier :</b> {e.site.admission.dates}</span>}
                    </div>
                  )}
                  {series.length > 0 && <div className="flex flex-col gap-3"><b className="text-sm">Séries du baccalauréat conseillées</b>{series.map(([p, l]) => <div key={p} className="flex flex-wrap items-center gap-1.5 text-sm"><span className="w-full text-xs text-ink-mute sm:w-36">Bac obtenu {p === "MA" ? "au Maroc" : `au ${PAYS_NOM[p]}`}</span>{l.map((x) => serieById[x] && <span key={x} title={serieById[x].intitule} className="chip bg-[#f6f8fe] text-ink-soft">{serieById[x].code}</span>)}</div>)}</div>}
                  <div className="rounded-xl bg-sun-50 p-4 text-sm text-[#8a5a00]">Pièces habituelles : pièce d&apos;identité ou passeport, relevés de notes, diplôme du baccalauréat (ou attestation), photo d&apos;identité. <Link href="/ressources/checklist-candidature/" className="font-bold underline">Voir la checklist de candidature</Link></div>
                </div>
              )}
              {tab === "Programme" && (
                <div className="card flex flex-col gap-4 p-6 sm:p-7">
                  <h2 className="text-xl font-extrabold">Programme à {e.sigle || e.nom}</h2>
                  {filieres.length + progs.length === 0 && <p className="text-ink-soft">Le détail des filières de cette formation n&apos;est pas encore publié pour cet établissement. Consulte sa fiche ou son site officiel.</p>}
                  {filieres.map((x, k) => (
                    <div key={`${x.intitule}-${k}`} className="flex flex-col gap-1 rounded-2xl border border-[#eef1f8] p-4">
                      <b>{x.intitule}</b>
                      {x.options && <span className="text-sm text-ink-soft">Options : {x.options}</span>}
                      <span className="text-xs text-ink-mute">{[x.diplome, x.duree_annees ? `${x.duree_annees} an${x.duree_annees > 1 ? "s" : ""}` : null, x.campus?.length ? `campus : ${x.campus.join(", ")}` : x.ville].filter(Boolean).join(" · ")}</span>
                      {x.homologation.statut === "echue" ? <span className="text-xs font-semibold text-[#a55a00]">Accréditation échue ({x.homologation.fin}) · diplôme d&apos;établissement</span>
                        : x.homologation.statut === "recente" ? <span className="text-xs font-semibold text-brand-700"><span className="chip mr-1 bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700">Accrédité</span>échéance {x.homologation.fin}, renouvellement à confirmer</span>
                        : <span className="text-xs font-semibold text-[#0f8a46]">Accréditée par l&apos;État jusqu&apos;en {x.homologation.fin}</span>}
                    </div>
                  ))}
                  {progs.map((p, k) => <div key={`${p.intitule}-${k}`} className="flex flex-col gap-1 rounded-2xl border border-[#eef1f8] p-4"><b>{p.intitule}</b>{p.specialites.length > 0 && <span className="text-sm text-ink-soft">Spécialités : {p.specialites.join(", ")}</span>}<span className="text-xs text-ink-mute">Présenté sur le site de l&apos;établissement{p.campus?.length ? ` · campus : ${p.campus.join(", ")}` : ""}</span></div>)}
                  <div><b className="text-sm">Compétences travaillées</b><div className="mt-2 flex flex-wrap gap-2">{f.competences.map((c) => <span key={c} className="chip bg-brand-50 text-brand-700">{competenceLabel(c)}</span>)}</div></div>
                </div>
              )}
              {tab === "Frais" && (
                <div className="card flex flex-col gap-4 p-6 sm:p-7">
                  <h2 className="text-xl font-extrabold">Frais de scolarité et budget</h2>
                  {(e.site?.frais.length ?? 0) > 0 ? (
                    <div className="flex flex-col gap-2 rounded-2xl border border-[#cdeedd] bg-[#f3fbf6] p-4 text-sm">
                      <b className="text-[#0f8a46]">Frais publiés par {e.sigle || "l'établissement"} (par cycle)</b>
                      {e.site!.frais.map((x) => <div key={x.cycle} className="flex flex-col justify-between gap-1 border-b border-[#dff3e7] pb-2 last:border-0 sm:flex-row sm:gap-3"><span className="text-ink-soft">{x.cycle}</span><b className="sm:text-right">{x.scolarite_annuelle_mad ? <Prix mad={x.scolarite_annuelle_mad} suffixe="/an" /> : "—"}{x.inscription_mad ? <span className="block text-xs font-semibold text-ink-mute">+ inscription <Prix mad={x.inscription_mad} /></span> : null}</b></div>)}
                    </div>
                  ) : typ && (
                    <div className="flex flex-col gap-1 rounded-2xl bg-[#f6f8fe] p-4 text-sm"><span className="text-ink-mute">Fourchette habituelle ({typ.libelle.toLowerCase()}, estimation) :</span><b className="text-lg"><Prix mad={typ.min} /> – <Prix mad={typ.max} suffixe="/an" /></b><span className="text-xs text-ink-mute">Frais exacts à confirmer par l&apos;établissement.</span></div>
                  )}
                  <div className="flex flex-col gap-1.5 text-sm"><b>Coût de la vie étudiante au Maroc (par mois)</b>{B.lignes.map((l) => <div key={l.poste} className="flex justify-between gap-3"><span className="text-ink-soft">{l.poste}</span><b className="text-right"><Prix mad={l.min} /> – <Prix mad={l.max} /></b></div>)}<span className="text-xs text-ink-mute">{B.note}</span></div>
                  <Link href={`/devis/?etab=${e.id}&f=${f.id}`} className="btn-primary self-start"><Calculator size={16} /> Calculer le coût total</Link>
                </div>
              )}
              {tab === "Débouchés" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {f.metiers.filter((m) => metierById[m]).map((m) => (
                    <Link key={m} href={`/metiers/${m}/`} className="card flex min-h-[64px] items-center gap-3 p-4 transition hover:-translate-y-1 hover:shadow-lift">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: domStyle(metierById[m].domaine).solid }}><Briefcase size={20} /></span>
                      <span className="min-w-0 flex-1"><b className="block">{metierById[m].nom}</b><span className="line-clamp-1 text-xs text-ink-mute">{metierById[m].description}</span></span><ArrowUpRight size={18} className="shrink-0 text-ink-mute" />
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <section id="etablissements" className="flex scroll-mt-28 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">Établissements qui proposent cette formation <span className="text-ink-mute">({listeEtabs.length}{villeListe ? ` à ${villeListe}` : ""})</span></h2>
              <select value={villeListe} onChange={(ev) => { setVilleListe(ev.target.value); setNListe(10); }} aria-label="Filtrer par ville" className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold"><option value="">Toutes les villes ({etabs.length})</option>{villesListe.map(([v, n]) => <option key={v} value={v}>{v} ({n})</option>)}</select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {listeEtabs.slice(0, nListe).map((x) => {
                const vs = villesOffre(x, f.id);
                const actif = x.id === e.id;
                return (
                  <div key={x.id} className={`card flex flex-col gap-2.5 p-4 transition ${actif ? "border-brand-400 ring-2 ring-brand-100" : "hover:shadow-lift"}`}>
                    <Link href={`/formations/${f.id}/?etab=${x.id}`} scroll={false} className="flex items-center gap-3">
                      <EtabLogo e={x} size={46} />
                      <span className="min-w-0"><b className="line-clamp-2 text-sm">{x.nom}</b><span className="text-xs text-ink-mute">{x.type_libelle}</span></span>
                    </Link>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <LabelChip label={x.label} court />
                      {vs.map((v) => <Link key={v} href={`/formations/${f.id}/?etab=${x.id}${x.campus ? `&ville=${encodeURIComponent(v)}` : ""}`} scroll={false} className={`chip min-h-[30px] ${actif && v === ville ? "bg-brand-600 text-white" : "bg-[#f6f8fe] text-ink-soft hover:bg-brand-50"}`}><MapPin size={11} />{v}</Link>)}
                    </div>
                  </div>
                );
              })}
            </div>
            {nListe < listeEtabs.length && <button onClick={() => setNListe(nListe + 20)} className="btn-ghost self-center">Afficher plus ({listeEtabs.length - nListe} restants)</button>}
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <div className="card flex flex-col gap-4 rounded-[22px] p-5">
            <h2 className="text-lg font-extrabold">Informations clés</h2>
            {infos.map(([I, a, b]) => <div key={a} className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><I size={17} /></span><span className="min-w-0 text-sm"><span className="block text-xs text-ink-mute">{a}</span><b>{b}</b></span></div>)}
            <div className="flex items-start gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${label === "autorise" ? "bg-sun-100 text-[#a55a00]" : "bg-[#e8f8ef] text-[#0f8a46]"}`}>{label === "autorise" ? <ShieldAlert size={17} /> : <BadgeCheck size={17} />}</span><span className="text-sm"><span className="block text-xs text-ink-mute">Label</span><b>{label ? labelById[label].libelle : "—"}</b>{statut && <span className="block text-xs text-ink-mute">{statut.statut === "echue" ? `Accréditation échue (${statut.fin})` : `Filière accréditée · échéance ${statut.fin}`}</span>}</span></div>
            <Link href={candidater} className="btn-primary btn-shine w-full">Candidater <ArrowRight size={16} /></Link>
          </div>
          <div className="card flex flex-col gap-2.5 bg-gradient-to-br from-white to-[#fff7dd] p-5">
            <div className="flex items-center gap-2.5"><span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-sun-400"><KeyRound size={18} /></span><b>Se loger à {ville}</b></div>
            <p className="text-[13px] text-ink-soft">Logements vérifiés près de {e.sigle || "l'établissement"} : loyer d&apos;un studio ou d&apos;une colocation entre <Prix mad={B.lignes[0].min} /> et <Prix mad={B.lignes[0].max} /> par mois.</p>
            <Link href={`/navilease/logements/?etablissement=${e.id}`} className="btn-ghost py-2.5">Logements Navilease</Link>
            {ville && <Link href={villeHref(ville)} className="flex items-center gap-1.5 text-[13px] font-bold text-brand-600"><School size={14} />Vivre et étudier à {ville} →</Link>}
          </div>
        </aside>
      </div>
      <QuestionWhatsApp sujet={`la formation ${f.intitule}${e ? ` (${e.sigle || e.nom})` : ""}`} cta={{ href: candidater, label: "Candidater" }} />
    </>
  );
}
