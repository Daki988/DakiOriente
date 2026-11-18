"use client";
import Link from "@/components/ui/Link";
import { motion } from "framer-motion";
import { BadgeCheck, Bus, Calculator, Calendar, CalendarClock, Coins, Check, CloudSun, Copy, FileDown, GraduationCap, Handshake, HeartPulse, Info, Lightbulb, Mail, MessageCircle, Plane, Scale, Share2, Shield, ShieldCheck, SlidersHorizontal, Users, UsersRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LireUrl } from "@/hooks/useFiltres";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Reveal } from "@/components/motion/Reveal";
import { DONUT_COLORS, Donut } from "./Donut";
import { DevisPdf } from "./DevisPdf";
import { useDestination } from "@/components/ui/Destination";
import { auPays, destinationById, vitrine, STATUT_LONG, VILLES_ETUDES, etabById, etablissements, fmt, formationById, labelById, paysDetailById, libelleFilieres } from "@/lib/data";
import { paysOrigine, paysOrigineById, visaDestination } from "@/lib/pays-origine";
import { COUTS, HYP, LOGEMENT_LABEL, PERSO_DEFAUT, RUBRIQUES, SOURCES, devis, formationParDefaut, type Logement, type Pair, type Perso } from "@/lib/devis";
import { residencesEtudiantes } from "@/lib/residences";
import { useDevise } from "@/components/ui/Devise";
import { MARGE_PRUDENCE, convertirDe, devisePays, formatMontant, symbole } from "@/lib/devises";

const field = "w-full min-w-0 max-w-full truncate rounded-xl border-[1.5px] border-slate-200 bg-white px-3.5 py-3 text-sm font-bold outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

export function DevisSimulateur() {
  // Choix initiaux lus dans l'URL côté navigateur (LireUrl) : la page reste rendue côté serveur.
  const [luUrl, setLuUrl] = useState(false);
  const [eid, setEid] = useState("ma-esa-casa");
  const [fid, setFid] = useState(() => formationParDefaut("ma-esa-casa"));
  const { pays, devise, taux, setPays } = useDevise();
  const { destination } = useDestination();
  const [origine, setOrigine] = useState("");
  // Pays devinés (profil, navigateur) seulement après lecture de l'URL, qui reste prioritaire.
  useEffect(() => { if (luUrl && !origine && pays && paysOrigineById[pays]) setOrigine(pays); }, [pays, luUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  // Le pays de départ fixe la devise de tout le site : c'est de là que les parents enverront l'argent.
  useEffect(() => { if (origine && origine !== pays) setPays(origine === "MA" ? null : origine); }, [origine]); // eslint-disable-line react-hooks/exhaustive-deps
  const choisirOrigine = (o: string) => { setOrigine(o); if (o) setPays(o === "MA" ? null : o); };
  const [dirhamsSeuls, setDirhamsSeuls] = useState(false);
  const [logement, setLogement] = useState<Logement>("studio");
  // Devis personnalisé (null = devis standard) : logement, niveau de vie, transport, assurance, retours, options, aides.
  const [perso, setPerso] = useState<Perso | null>(null);
  const majPerso = (x: Partial<Perso>) => setPerso((p) => ({ ...(p ?? PERSO_DEFAUT), ...x }));
  // Lignes décochées par le parent : retirées du total, de l'échéancier et du PDF.
  const [exclus, setExclus] = useState<string[]>([]);
  const basculer = (cle: string) => setExclus((xs) => (xs.includes(cle) ? xs.filter((x) => x !== cle) : [...xs, cle]));
  const [garde, setGarde] = useState<{ titre: string; total: Pair; mois: Pair; aides: Pair | null } | null>(null);
  const onUrl = useCallback((qs: string) => {
    if (luUrl) return; // seule la première lecture compte : ensuite, c'est le simulateur qui écrit l'URL
    const p = new URLSearchParams(qs);
    // Sans école dans l'adresse : une école vitrine de la destination choisie
    const defaut = destination !== "tous" && destination !== "MA" ? vitrine(destination)[0]?.id ?? "ma-esa-casa" : "ma-esa-casa";
    const e = etabById[p.get("etab") ?? ""] ? p.get("etab")! : defaut;
    const f = p.get("f");
    setEid(e); setFid(f && etabById[e].formations.includes(f) ? f : formationParDefaut(e));
    if (paysOrigineById[p.get("o") ?? ""]) setOrigine(p.get("o")!);
    setLogement(p.get("l") === "colocation" ? "colocation" : "studio");
    if (p.get("x")) setExclus(p.get("x")!.split(",").filter((x) => /^[a-z_]{2,30}$/.test(x)).slice(0, 20));
    if (p.get("perso") === "1") setPerso({
      logement: p.get("pl") || PERSO_DEFAUT.logement,
      niveau: (["econome", "normal", "confortable"] as const).find((x) => x === p.get("pn")) ?? "normal",
      transport: p.get("pt") === "taxi" ? "taxi" : "tram", assurance: p.get("pa") === "complete" ? "complete" : "base",
      retours: Math.max(0, Math.min(3, Number(p.get("pr")) || 0)), ordinateur: p.get("po") === "1", soutien: p.get("ps") === "1",
      aide: Math.max(0, Number(p.get("pd")) || 0),
    });
    setLuUrl(true);
  }, [luUrl, destination]);
  const [eleve, setEleve] = useState("");
  const [payeur, setPayeur] = useState("");
  const e = etabById[eid];
  const F = formationById[fid];
  const P = paysDetailById[e.pays];
  const C = COUTS[e.pays];
  const residencesVille = useMemo(() => residencesEtudiantes.filter((r) => r.ville === e.ville && r.logements.some((l) => l.loyer_min)), [e.ville]);
  const persoActif = !!perso && !!C.personnalisation;
  const D = useMemo(() => devis(eid, fid, origine, logement, persoActif ? { ...perso!, residences: residencesVille } : undefined, exclus), [eid, fid, origine, logement, perso, persoActif, residencesVille, exclus]);
  const cv = (v: number) => v;
  // Devise de lecture : celle du pays de départ (ou du profil), la monnaie du pays d'études restant affichée en dessous.
  const base = D.devise;
  const nomBase = base === "MAD" ? "dirhams (MAD)" : `${symbole(base)} (${base})`;
  const devBrute = origine ? devisePays(origine) : devise;
  const devLocale = devBrute && convertirDe(1000, base, devBrute, taux) != null ? devBrute : null;
  const dev = !dirhamsSeuls && devLocale ? devLocale : null;
  const loc = (v: number) => (dev ? convertirDe(v, base, dev, taux) ?? v : v);
  const unit = dev ? symbole(dev) : symbole(base);
  const nb = (v: number) => fmt(Math.round(v));
  /** Fourchette dans la devise de lecture, avec l'équivalent en dirhams en dessous. */
  const Plage = ({ v, className = "" }: { v: readonly number[]; className?: string }) => dev
    ? <span className={`inline-flex flex-col items-end leading-tight ${className}`}><span>{nb(loc(v[0]))} – {nb(loc(v[1]))}</span><span className="text-[11px] font-semibold text-ink-mute">{nb(v[0])} – {nb(v[1])} {symbole(base)}</span></span>
    : <span className={className}>{nb(v[0])} – {nb(v[1])}</span>;
  const mois = [D.total[0] / (D.years * 12), D.total[1] / (D.years * 12)];
  /** Taux affiché (devise de lecture pour 1 unité de la monnaie d'études), pour saisir une aide dans la monnaie des parents. */
  const tauxLecture = dev ? (convertirDe(1000, base, dev, taux) ?? 1000) / 1000 : 1;
  const [aideSaisie, setAideSaisie] = useState("");
  useEffect(() => { if (perso && !aideSaisie && perso.aide) setAideSaisie(String(Math.round(perso.aide * tauxLecture))); }, [perso, tauxLecture]); // eslint-disable-line react-hooks/exhaustive-deps
  const totalParQuand = (q: "avant" | "mois" | "an"): Pair => (D.postes ?? []).filter((x) => x.quand === q).reduce<Pair>((a, x) => [a[0] + x.v[0], a[1] + x.v[1]], [0, 0]);
  /** Une ligne du détail, avec sa case à cocher (imprévus et transferts : calculés, sans case). */
  const ligneDevis = (x: (typeof D.detail)[number]) => {
    const auto = x.cle === "imprevus" || x.cle === "transferts";
    return (
      <li key={x.cle} className={`flex items-start justify-between gap-3 ${x.inclus ? "" : "text-ink-mute"}`}>
        <label className={`flex min-w-0 items-start gap-2.5 ${auto ? "" : "cursor-pointer"}`}>
          {auto ? <span className="mt-0.5 h-5 w-5 shrink-0" /> : <input type="checkbox" checked={x.inclus} onChange={() => basculer(x.cle)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" aria-label={`Inclure : ${x.libelle}`} />}
          <span className={x.inclus ? "" : "line-through"}>{x.libelle}{!x.inclus && <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-bold no-underline">non inclus</span>}</span>
        </label>
        <Plage v={x.inclus ? x.v : [0, 0]} className={`shrink-0 whitespace-nowrap text-right font-semibold ${x.inclus ? "" : "opacity-50"}`} />
      </li>);
  };
  const copierLien = () => { try { void navigator.clipboard.writeText(window.location.href); } catch { /* presse-papiers indisponible */ } };

  useEffect(() => { if (!etabById[eid].formations.includes(fid)) setFid(formationParDefaut(eid)); }, [eid, fid]);
  useEffect(() => {
    if (!luUrl) return;
    const q = new URLSearchParams({ etab: eid, f: fid, l: logement });
    if (origine) q.set("o", origine);
    if (exclus.length) q.set("x", exclus.join(","));
    if (perso) {
      q.set("perso", "1"); q.set("pl", perso.logement); q.set("pn", perso.niveau); q.set("pt", perso.transport); q.set("pa", perso.assurance);
      if (perso.retours) q.set("pr", String(perso.retours)); if (perso.ordinateur) q.set("po", "1"); if (perso.soutien) q.set("ps", "1"); if (perso.aide) q.set("pd", String(perso.aide));
    }
    window.history.replaceState(window.history.state, "", `/devis/?${q.toString()}`);
  }, [eid, fid, origine, logement, perso, exclus, luUrl]);

  const [faits, setFaits] = useState<number[]>([]);
  useEffect(() => { try { setFaits(JSON.parse(localStorage.getItem(`navigoal-demarches-${e.pays}`) || "[]")); } catch { setFaits([]); } }, [e.pays]);
  const toggle = (k: number) => { const n = faits.includes(k) ? faits.filter((x) => x !== k) : [...faits, k]; setFaits(n); try { localStorage.setItem(`navigoal-demarches-${e.pays}`, JSON.stringify(n)); } catch { /* ignore */ } };

  const nbMetiers = new Set(e.formations.flatMap((f) => formationById[f]?.metiers ?? [])).size;
  const qual = [
    [ShieldCheck, "Reconnaissance", labelById[e.label]?.description ?? "Établissement autorisé"],
    [Calendar, "Ancienneté", e.annee_creation ? `Créé en ${e.annee_creation}` : "Date de création à confirmer"],
    [GraduationCap, "Programmes", `${libelleFilieres(e)}, reliées à ${nbMetiers} métiers`],
    [Handshake, "Ouverture internationale", "Accueil des étudiants étrangers, accompagnement visa et logement via Navigoal"],
  ] as const;
  const env = [[Shield, "Sécurité", C.environnement.securite], [HeartPulse, "Santé", C.environnement.sante], [Bus, "Transports", C.environnement.transports], [Users, "Communauté", C.environnement.communaute], [CloudSun, "Climat", C.environnement.climat]] as const;
  const cats = Object.entries(D.cats);
  const resume = `Devis Navigoal : ${F.intitule} à ${e.sigle} (${e.ville}) — ${dev ? `${nb(loc(D.total[0]))} à ${nb(loc(D.total[1]))} ${unit} (soit ` : ""}${fmt(cv(D.total[0]))} à ${fmt(cv(D.total[1]))} ${symbole(base)}${dev ? ")" : ""} sur ${D.years} an${D.years > 1 ? "s" : ""}, tout compris.`;
  const url = typeof window !== "undefined" ? window.location.href : "";
  const parVille = VILLES_ETUDES.map((v) => { const xs = etablissements.filter((x) => x.ville === v).sort((a, b) => a.sigle.localeCompare(b.sigle)); return [xs[0] ? `${v} (${destinationById[xs[0].pays]?.nom})` : v, xs] as const; }).filter(([, xs]) => xs.length);

  return (
    <>
      <LireUrl onUrl={onUrl} />
      <div className="overflow-x-clip print:hidden">
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-700 to-brand-400 pb-24 pt-10 text-white">
          <div className="absolute -right-32 -top-32 h-[420px] w-[420px] animate-float rounded-full bg-[radial-gradient(circle,rgba(255,194,31,.35),transparent_70%)]" />
          <div className="container relative flex flex-col gap-4">
            <span className="chip self-start bg-white/15 text-white"><UsersRound size={14} className="mr-1.5 inline" />Espace parents</span>
            <h1 className="h-display">Combien coûtent vraiment <span className="text-sun-400">ses études</span> ?</h1>
            <p className="max-w-[720px] text-[17px] text-[#c9d6ff]">Un devis complet sur toute la durée de la formation : scolarité, vie quotidienne, installation, visa et carte de séjour. Pour décider sereinement, avant de vous engager.</p>
          </div>
        </section>

        <div className="container relative -mt-16">
          <Reveal className="card grid grid-cols-1 gap-3 rounded-3xl p-4 shadow-[0_30px_60px_-24px_rgba(11,21,51,.35)] sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.6fr_.9fr]">
            <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Votre enfant part de</span>
              <select value={origine} onChange={(ev) => choisirOrigine(ev.target.value)} className={field}><option value="">Choisir un pays…</option><optgroup label="Afrique">{paysOrigine.filter((p) => p.continent === "afrique").map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</optgroup><optgroup label="Autres pays">{paysOrigine.filter((p) => p.continent === "autre").map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</optgroup></select></label>
            <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Établissement</span>
              <select value={eid} onChange={(ev) => setEid(ev.target.value)} className={field}>{parVille.map(([v, xs]) => <optgroup key={v} label={v}>{xs.map((x) => <option key={x.id} value={x.id}>{x.sigle}</option>)}</optgroup>)}</select></label>
            <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Formation</span>
              <select value={fid} onChange={(ev) => setFid(ev.target.value)} className={field}>{e.formations.filter((f) => formationById[f]).map((f) => <option key={f} value={f}>{formationById[f].intitule} ({formationById[f].duree_annees} ans)</option>)}</select></label>
            <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Logement</span>
              {persoActif
                ? <select value={perso!.logement} onChange={(ev) => majPerso({ logement: ev.target.value })} className={field}>
                    {(["colocation", "studio", "standing"] as const).map((l) => <option key={l} value={l}>{C.personnalisation!.logement_mensuel[l].libelle}</option>)}
                    {residencesVille.length > 0 && <optgroup label={`Résidences universitaires à ${e.ville}`}>{residencesVille.flatMap((r) => r.logements.map((l, i) => l.loyer_min ? <option key={`${r.id}:${i}`} value={`res:${r.id}:${i}`}>{r.nom.replace(/^Twenty Campus /, "Twenty ")} · {l.type.replace(/\s*\(.*\)$/, "")} · {fmt(l.loyer_min)} {symbole(base)}</option> : null))}</optgroup>}
                  </select>
                : <select value={logement} onChange={(ev) => setLogement(ev.target.value as Logement)} className={field}>{(["studio", "colocation"] as const).map((l) => <option key={l} value={l}>{LOGEMENT_LABEL[l]}</option>)}</select>}</label>
          </Reveal>
          {C.personnalisation && (!perso
            ? <button type="button" onClick={() => setPerso({ ...PERSO_DEFAUT, logement: logement === "colocation" ? "colocation" : "studio" })} className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 text-[14px] font-bold text-brand-700 shadow-sm hover:bg-brand-50"><SlidersHorizontal size={17} />Personnaliser mon devis (logement, niveau de vie, voyages, bourse…)</button>
            : <div className="card mt-3 flex flex-col gap-4 rounded-3xl p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3"><b className="flex items-center gap-2 text-[16px]"><SlidersHorizontal size={18} className="text-brand-600" />Devis personnalisé</b>
                  <button type="button" onClick={() => { setPerso(null); setAideSaisie(""); }} className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[13px] font-bold text-ink-mute hover:bg-slate-100"><X size={15} /><span className="sm:hidden">Standard</span><span className="hidden sm:inline">Revenir au devis standard</span></button></div>
                <p className="-mt-2 text-[13px] text-ink-mute">Choisissez ce que vous voulez inclure ; le logement se règle dans la liste « Logement » ci-dessus (studio, standing ou résidence universitaire).</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Niveau de vie</span>
                    <select value={perso.niveau} onChange={(ev) => majPerso({ niveau: ev.target.value as Perso["niveau"] })} className={field}>{(["econome", "normal", "confortable"] as const).map((n) => <option key={n} value={n}>{C.personnalisation!.vie_mensuelle_hors_logement[n].libelle}</option>)}</select></label>
                  <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Déplacements sur place</span>
                    <select value={perso.transport} onChange={(ev) => majPerso({ transport: ev.target.value as Perso["transport"] })} className={field}>{(["tram", "taxi"] as const).map((t) => <option key={t} value={t}>{C.personnalisation!.transport_mensuel[t].libelle}</option>)}</select></label>
                  <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Assurance santé</span>
                    <select value={perso.assurance} onChange={(ev) => majPerso({ assurance: ev.target.value as Perso["assurance"] })} className={field}>{(["base", "complete"] as const).map((a) => <option key={a} value={a}>{a === "base" ? "De base" : "Complète (hospitalisation, rapatriement)"}</option>)}</select></label>
                  <label className="flex min-w-0 flex-col gap-1.5"><span className="text-xs font-bold text-ink-mute">Retours au pays (vacances)</span>
                    <select value={perso.retours} onChange={(ev) => majPerso({ retours: Number(ev.target.value) })} className={field}>{[0, 1, 2].map((n) => <option key={n} value={n}>{n === 0 ? "Aucun (aller à l'arrivée, retour à la fin)" : `${n} aller-retour${n > 1 ? "s" : ""} par an`}</option>)}</select></label>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 text-[14px] font-bold"><input type="checkbox" checked={perso.ordinateur} onChange={(ev) => majPerso({ ordinateur: ev.target.checked })} className="h-5 w-5 accent-brand-600" />Ordinateur portable neuf</label>
                  <label className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 text-[14px] font-bold"><input type="checkbox" checked={perso.soutien} onChange={(ev) => majPerso({ soutien: ev.target.checked })} className="h-5 w-5 accent-brand-600" />Soutien scolaire ou cours de langue</label>
                  <label className="flex min-w-0 flex-col gap-1.5 sm:min-w-[260px]"><span className="text-xs font-bold text-ink-mute">Bourse ou réduction obtenue, par an ({unit})</span>
                    <input inputMode="numeric" value={aideSaisie} placeholder="0" onChange={(ev) => { const t = ev.target.value.replace(/[^\d]/g, "").slice(0, 10); setAideSaisie(t); majPerso({ aide: Math.round((Number(t) || 0) / tauxLecture) }); }} className={field} aria-label="Bourse ou réduction par an" /></label>
                </div>
                <p className="text-[12px] text-ink-mute">Loyers des résidences : tarifs publiés sur leurs sites officiels. Autres montants : estimations Navigoal pour un étudiant étranger, à affiner avec l&apos;école et le logement choisis.</p>
              </div>)}
        </div>

        <div className="container mt-7 grid items-start gap-6 lg:grid-cols-[1fr_400px]">
          <div className="flex min-w-0 flex-col gap-6">
            {devLocale && (
              <div className="flex flex-col gap-3 rounded-3xl border border-brand-100 bg-brand-50/70 p-4 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-start gap-2.5"><Coins size={18} className="mt-0.5 shrink-0 text-brand-600" /><span>{dev
                  ? <>Montants en <b className="text-ink">{symbole(dev)} ({dev})</b>{origine ? <>, la monnaie {paysOrigineById[origine] ? `du pays de départ (${paysOrigineById[origine].nom})` : "du pays de départ"}</> : null} : c&apos;est dans cette monnaie que vous enverrez l&apos;argent. La monnaie {destinationById[e.pays]?.de}, en {nomBase}, est indiquée en dessous pour vous familiariser avec les prix sur place. Taux du {new Date(taux.date).toLocaleDateString("fr-FR")} : <b className="whitespace-nowrap text-ink">{formatMontant(base === "MAD" ? 1000 : 100000, base)} ≈ {formatMontant(convertirDe(base === "MAD" ? 1000 : 100000, base, dev, taux)!, dev)}</b>, marge de prudence de {MARGE_PRUDENCE * 100} % incluse.</>
                  : <>Montants affichés en {nomBase} uniquement.</>}</span></span>
                <button type="button" onClick={() => setDirhamsSeuls((x) => !x)} className="shrink-0 self-start rounded-xl border border-brand-200 bg-white px-3 py-2 text-[13px] font-bold text-brand-700 hover:bg-brand-50 sm:self-center">{dev ? `Afficher en ${symbole(base)} seulement` : `Afficher aussi en ${symbole(devLocale)}`}</button>
              </div>
            )}
            <Reveal className="card flex flex-col gap-6 rounded-[26px] p-6 sm:p-7">
              <div className="flex flex-col justify-between gap-4 2xl:flex-row">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-[13px] font-bold uppercase text-ink-mute">Coût total estimé · {D.years} an{D.years > 1 ? "s" : ""} · {F.diplome}</span>
                  <div className="text-[28px] font-extrabold leading-tight tracking-tight sm:text-[40px]"><span className="whitespace-nowrap"><AnimatedNumber value={loc(D.total[0])} /> –</span> <span className="whitespace-nowrap"><AnimatedNumber value={loc(D.total[1])} /> <span className="text-xl">{unit}</span></span></div>
                  {dev && <span className="text-[15px] font-bold text-ink-soft">soit {nb(D.total[0])} – {nb(D.total[1])} {symbole(base)} {auPays(e.pays)}</span>}
                  <span className="text-sm text-ink-mute">environ <b className="text-ink-soft">{dev ? `${nb(loc(mois[0]))} – ${nb(loc(mois[1]))} ${unit}` : `${nb(mois[0])} – ${nb(mois[1])} ${symbole(base)}`}</b> par mois{dev ? <span className="whitespace-nowrap"> ({nb(mois[0])} – {nb(mois[1])} {symbole(base)})</span> : ""}{origine ? "" : " · choisissez le pays de départ pour inclure les billets d'avion et lire les montants dans votre monnaie"}</span>
                </div>
                <div className="flex shrink-0 flex-wrap items-start gap-2 2xl:flex-col 2xl:items-end">
                  <span className="chip bg-sun-100 text-[#a55a00]"><Info size={14} className="mr-1 inline" />Estimation · frais à confirmer par l&apos;école</span>
                  <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><BadgeCheck size={14} className="mr-1 inline" />Devient « frais confirmés » dès réponse de l&apos;école</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-8 sm:flex-row">
                <div className="relative h-[220px] w-[220px] shrink-0">
                  <Donut key={`${eid}${fid}${origine}${logement}`} values={cats.map(([, v]) => v[1])} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs text-ink-mute">par an</span><b className="text-lg"><AnimatedNumber value={loc(D.total[1] / D.years)} /></b><span className="text-[11px] text-ink-mute">{unit} max.</span></div>
                </div>
                <div className="flex w-full flex-col gap-3">
                  <span className="text-xs font-bold text-ink-mute">RÉPARTITION ({unit})</span>
                  {cats.map(([k, v], i) => <div key={k} className="flex justify-between gap-3 text-sm"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded" style={{ background: DONUT_COLORS[i] }} />{k}</span><Plage v={v} className="whitespace-nowrap text-right text-[13px] font-bold sm:text-sm" /></div>)}
                </div>
              </div>
            </Reveal>

            <Reveal className="card flex flex-col gap-4 rounded-3xl p-5 sm:p-6">
              <div className="flex flex-col gap-1"><h3 className="text-lg font-extrabold">Ce que comprend le devis</h3><span className="text-xs text-ink-mute">Sur toute la durée ({D.years} an{D.years > 1 ? "s" : ""}), poste par poste · {dev ? `${unit} (${symbole(base)} en dessous)` : unit}</span>
                <span className="mt-1 text-[13px] text-ink-soft">Cochez ou décochez chaque élément : le total, l&apos;échéancier et le PDF ne gardent que ce qui est coché.{exclus.length > 0 && <> <button type="button" onClick={() => setExclus([])} className="font-bold text-brand-600 underline-offset-2 hover:underline">Tout recocher</button></>}</span></div>
              <div className="flex flex-col gap-3">
                {RUBRIQUES.filter((r) => D.detail.some((x) => x.rubrique === r)).map((rub) => { const tot = D.cats[rub] ?? [0, 0]; return (

                  <div key={rub} className="rounded-2xl border border-[#eef1f8] p-3.5">
                    <div className="flex items-start justify-between gap-3"><b className="flex items-center gap-2 text-[15px]"><span className="h-3 w-3 shrink-0 rounded" style={{ background: DONUT_COLORS[Object.keys(D.cats).indexOf(rub)] ?? "#cbd5e1" }} />{rub}</b><Plage v={tot} className="whitespace-nowrap text-right text-[14px] font-extrabold" /></div>
                    <ul className="mt-2 flex flex-col gap-1.5 border-t border-[#eef1f8] pt-2 text-[13px] text-ink-soft">
                      {D.detail.filter((x) => x.rubrique === rub).map(ligneDevis)}
                    </ul>
                  </div>); })}
                {D.aides && D.aides[1] > 0 && <div className="flex items-start justify-between gap-3 rounded-2xl bg-[#e8f8ef] p-3.5 text-[#0b6e38]"><b className="text-[15px]">Bourse ou réduction déduite</b><b className="whitespace-nowrap">− {nb(loc(D.aides[1]))} {unit}</b></div>}
                <div className="flex items-start justify-between gap-3 rounded-2xl bg-brand-50 p-3.5"><b className="text-[15px]">Total sur {D.years} an{D.years > 1 ? "s" : ""}</b><Plage v={D.total} className="whitespace-nowrap text-right text-[15px] font-extrabold text-brand-700" /></div>
              </div>
            </Reveal>

            {persoActif && D.postes && (
              <Reveal className="card flex flex-col gap-4 rounded-3xl p-5 sm:p-6">
                <div className="flex flex-col gap-1"><h3 className="text-lg font-extrabold">Quand payer quoi</h3><span className="text-xs text-ink-mute">1re année, sans inflation ni marge d&apos;imprévus · montants en {dev ? `${unit} (${symbole(base)} en dessous)` : unit}</span></div>
                <div className="grid gap-3 md:grid-cols-3">
                  {([["avant", "Avant le départ", Plane], ["mois", "Chaque mois sur place", CalendarClock], ["an", "Chaque année", Calendar]] as const).map(([q, t, I]) => (
                    <div key={q} className="flex flex-col gap-2 rounded-2xl bg-[#f6f8fe] p-3.5">
                      <b className="flex items-center gap-2 text-[14px]"><I size={16} className="text-brand-600" />{t}</b>
                      <div className="text-[18px] font-extrabold text-brand-700"><Plage v={totalParQuand(q)} className="items-start" /></div>
                      <ul className="flex flex-col gap-1.5 text-[12.5px] text-ink-soft">{D.postes!.filter((x) => x.quand === q).map((x) => <li key={x.libelle} className="flex justify-between gap-2"><span className="min-w-0">{x.libelle}</span><Plage v={x.v} className="shrink-0 whitespace-nowrap text-right font-bold" /></li>)}</ul>
                    </div>))}
                </div>
                {D.aides && D.aides[1] > 0 && <p className="flex items-start gap-2 rounded-2xl bg-[#e8f8ef] p-3 text-[13px] text-[#0b6e38]"><BadgeCheck size={17} className="mt-0.5 shrink-0" /><span>Bourse ou réduction déduite du total : <b className="whitespace-nowrap">{nb(loc(D.aides[1]))} {unit}{dev ? ` (${nb(D.aides[1])} ${symbole(base)})` : ""}</b> sur {D.years} an{D.years > 1 ? "s" : ""}. Faites-la confirmer par écrit par l&apos;organisme ou l&apos;école.</span></p>}
              </Reveal>
            )}

            <Reveal className="card flex flex-col gap-3 rounded-3xl p-6">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center"><h3 className="text-lg font-extrabold">Échéancier année par année</h3><span className="text-xs text-ink-mute">inflation {Math.round(HYP.inflation_annuelle * 100)} %/an incluse · montants en {dev ? `${unit} (${symbole(base)} en dessous)` : unit}</span></div>
              <div className="-mx-2 overflow-x-auto">
                <table className={`w-full ${dev ? "min-w-[760px]" : "min-w-[640px]"} border-collapse whitespace-nowrap ${dev ? "text-[13px] [&_td]:px-1.5 [&_th]:px-1.5" : "text-sm"}`}>
                  <thead><tr className="text-left text-xs font-extrabold text-ink-mute"><th className="p-2">ANNÉE</th><th className="p-2 text-right">SCOLARITÉ + FRAIS</th><th className="p-2 text-right">VIE (10 MOIS)</th><th className="p-2 text-right">SÉJOUR & ASSURANCE</th><th className="p-2 text-right">TOTAL</th></tr></thead>
                  <tbody>
                    {D.rows.map((r) => (
                      <motion.tr key={`${r.annee}-${D.total[1]}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: r.annee * 0.06 }} className="border-t border-[#eef1f8]">
                        <td className="px-2 py-3 font-bold">Année {r.annee}</td>
                        {([[r.scolarite[0] + r.annexes[0], r.scolarite[1] + r.annexes[1]], r.vie, r.renouvellements] as const).map((x, j) => <td key={j} className="px-2 py-3 text-right"><Plage v={x} /></td>)}
                        <td className="px-2 py-3 text-right font-extrabold text-brand-600"><Plage v={r.total} /></td>
                      </motion.tr>
                    ))}
                    <tr className="border-t-2 border-slate-200"><td className="px-2 py-3 font-bold">Installation & voyages</td><td colSpan={3} className="whitespace-normal px-2 py-3 text-[13px] text-ink-mute">visa, billets aller-retour, caution logement, équipement</td><td className="px-2 py-3 text-right font-extrabold"><Plage v={D.installation} /></td></tr>
                    <tr className="border-t border-[#eef1f8]"><td className="px-2 py-3 font-bold">Imprévus & transferts</td><td colSpan={3} className="whitespace-normal px-2 py-3 text-[13px] text-ink-mute">marge {Math.round(HYP.marge_imprevus * 100)} % + frais de transfert {Math.round(HYP.frais_transfert * 100)} %</td><td className="px-2 py-3 text-right font-extrabold"><Plage v={D.cats["Imprévus & transferts"]} /></td></tr>
                  </tbody>
                </table>
              </div>
            </Reveal>

            <div className="grid gap-5 md:grid-cols-2">
              <Reveal className="card flex flex-col gap-3 rounded-3xl p-6"><h3 className="text-lg font-extrabold">Qualité de la formation</h3>
                {qual.map(([I, t, s]) => <div key={t} className="flex items-start gap-3"><span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><I size={18} /></span><span><b className="block text-sm">{t}</b><span className="text-[13px] text-ink-mute">{s}</span></span></div>)}
                <Link href={`/etablissements/${e.id}/`} className="text-[13px] font-bold text-brand-600">Voir la fiche de l&apos;établissement →</Link>
              </Reveal>
              <Reveal delay={0.1} className="card flex flex-col gap-3 rounded-3xl p-6"><h3 className="text-lg font-extrabold">Cadre de vie à {e.ville.split(/[ /(]/)[0]}</h3>
                {env.map(([I, t, s]) => <div key={t} className="flex items-start gap-3"><span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-[#e8f8ef] text-[#0f8a46]"><I size={18} /></span><span><b className="block text-sm">{t}</b><span className="text-[13px] text-ink-mute">{s}</span></span></div>)}
                <Link href={`/pays/${e.pays.toLowerCase()}/`} className="text-[13px] font-bold text-brand-600">Étudier au {P.nom} : la fiche pays →</Link>
              </Reveal>
            </div>
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <div className="card flex flex-col gap-3 rounded-3xl p-5 shadow-[0_30px_60px_-24px_rgba(26,71,245,.4)]">
              <b className="text-[17px]">Votre devis</b>
              <div className="grid grid-cols-2 gap-2">
                <input value={eleve} onChange={(ev) => setEleve(ev.target.value)} placeholder="Prénom de l'élève" className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-brand-400" aria-label="Prénom de l'élève (facultatif)" />
                <input value={payeur} onChange={(ev) => setPayeur(ev.target.value)} placeholder="Responsable financier" className="rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-brand-400" aria-label="Responsable financier (facultatif)" />
              </div>
              <button onClick={() => window.print()} className="btn-primary btn-shine"><FileDown size={18} /> Télécharger le devis PDF</button>
              <div className="grid grid-cols-2 gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(resume + " " + url)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost px-3 py-2.5 text-[13px]"><Share2 size={15} /> WhatsApp</a>
                <a href={`mailto:?subject=${encodeURIComponent("Devis d'études Navigoal")}&body=${encodeURIComponent(resume + "\n\n" + url)}`} className="btn-ghost px-3 py-2.5 text-[13px]"><Mail size={15} /> E-mail</a>
              </div>
              <button type="button" onClick={copierLien} className="btn-ghost px-3 py-2.5 text-[13px]"><Copy size={15} /> Copier le lien de ce devis</button>
              <button type="button" onClick={() => setGarde({ titre: `${e.sigle} · ${persoActif ? D.logementLibelle : LOGEMENT_LABEL[logement]}`, total: D.total, mois: mois as Pair, aides: D.aides ?? null })} className="btn-ghost px-3 py-2.5 text-[13px]"><Scale size={15} /> Garder ce devis pour comparer</button>
              {garde && (
                <div className="flex flex-col gap-2 rounded-2xl border border-brand-100 bg-brand-50/60 p-3 text-[13px]">
                  <div className="flex items-center justify-between"><b>Comparaison</b><button type="button" onClick={() => setGarde(null)} aria-label="Effacer la comparaison" className="rounded-lg p-1 text-ink-mute hover:bg-white"><X size={14} /></button></div>
                  {[["Gardé", garde.titre, garde.total, garde.mois], ["Actuel", `${e.sigle} · ${persoActif ? D.logementLibelle : LOGEMENT_LABEL[logement]}`, D.total, mois as Pair]].map(([k, t, tot, m]) => (
                    <div key={k as string} className="flex flex-col rounded-xl bg-white p-2.5"><span className="text-[11px] font-bold uppercase text-ink-mute">{k as string}</span><span className="truncate font-bold">{t as string}</span>
                      <span className="text-brand-700"><b><Plage v={tot as Pair} className="items-start" /></b></span><span className="text-[12px] text-ink-mute">≈ {nb(loc((m as Pair)[0]))} – {nb(loc((m as Pair)[1]))} {unit} par mois</span></div>))}
                  <span className="text-[12px] text-ink-soft">Écart : {nb(loc(Math.abs(D.total[0] - garde.total[0])))} – {nb(loc(Math.abs(D.total[1] - garde.total[1])))} {unit} {D.total[1] > garde.total[1] ? "de plus" : "de moins"} pour le devis actuel.</span>
                </div>)}
              <Link href={`/espace/candidatures/nouvelle?etab=${eid}&formation=${fid}`} className="btn-ghost"><MessageCircle size={16} /> Candidater et demander les frais exacts</Link>
              <div className="flex items-start gap-2.5 rounded-2xl bg-[#fff7dd] p-3 text-[13px]"><Lightbulb size={18} className="shrink-0 text-[#a55a00]" /><span><b>Astuce :</b> comparez ce devis avec d&apos;autres écoles qui mènent au même métier. <Link href={`/comparateur/?f=${fid}&e=${eid}`} className="font-bold text-brand-600"><Scale size={13} className="inline" /> Comparer</Link></span></div>
            </div>
            <div className="card flex flex-col gap-3.5 rounded-3xl p-5">
              <div className="flex items-center justify-between"><b className="text-[17px]">Démarches de régularisation</b><span className="chip bg-brand-50 text-brand-700">{P.nom}</span></div>
              <p className="rounded-xl bg-[#f6f8fe] p-3 text-[13px] text-ink-soft">{origine ? <><b>Visa depuis {paysOrigineById[origine]?.nom} :</b> {visaDestination(e.pays, origine)}.</> : <>Choisissez le pays de départ pour connaître le régime d&apos;entrée {auPays(e.pays)}.</>}</p>
              <span className="text-xs text-ink-mute">Cochez les étapes au fur et à mesure ({faits.length}/{C.demarches.length}).</span>
              <div className="flex flex-col">
                {C.demarches.map((d, k) => { const ok = faits.includes(k); return (
                  <div key={k} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <button onClick={() => toggle(k)} aria-pressed={ok} aria-label={`Étape ${k + 1} ${ok ? "faite" : "à faire"}`} className={`flex h-[34px] w-[34px] items-center justify-center rounded-full text-[11px] font-extrabold transition ${ok ? "bg-brand-600 text-white" : "border-2 border-brand-200 bg-white text-brand-600 hover:border-brand-400"}`}>{ok ? <Check size={15} strokeWidth={3} /> : k + 1}</button>
                      {k < C.demarches.length - 1 && <div className={`h-6 w-0.5 ${ok ? "bg-brand-600" : "bg-[#dbe3f7]"}`} />}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 pt-1.5"><span className="chip self-start bg-sun-100 px-2 py-0.5 text-[#a55a00]">{d.quand}</span><span className={`text-[13px] ${ok ? "text-ink-mute line-through" : "text-ink-soft"}`}>{d.etape}</span></div>
                  </div>); })}
              </div>
            </div>
          </aside>
        </div>
        <p className="container mt-5 text-xs leading-relaxed text-ink-mute">
          {D.scolaritePubliee ? "Scolarité aux tarifs publiés par l'établissement sur son site. " : "L'établissement ne publie pas ses tarifs : la scolarité est une fourchette indicative, recalée sur les écoles de même type qui publient les leurs. "}Le reste de l&apos;estimation repose sur des grilles publiques et sur le coût de la vie observé ({SOURCES.slice(0, 4).map((u) => u.split("/")[2]).join(", ")}). Montants calculés en {nomBase}{dev ? ` et convertis en ${symbole(dev)} (${dev})` : ""} ; conversion au taux du {new Date(taux.date).toLocaleDateString("fr-FR")}, majorée de {MARGE_PRUDENCE * 100} % par prudence. Marge d&apos;imprévus {Math.round(HYP.marge_imprevus * 100)} % et frais de transfert {Math.round(HYP.frais_transfert * 100)} % inclus{logement === "colocation" ? " ; colocation : environ −15 % sur le coût de la vie" : ""}. Établissement : {STATUT_LONG[e.statut] ?? "privé"}, catégorie « {D.typ} ».
        </p>
        <div className="container mt-8 flex justify-center"><span className="flex items-center gap-2 text-sm text-ink-mute"><Calculator size={16} /> Chaque changement recalcule le devis en direct.</span></div>
      </div>
      <DevisPdf e={e} F={F} D={D} devise={dev} taux={taux} origine={origine} logement={logement} eleve={eleve} payeur={payeur} />
    </>
  );
}
