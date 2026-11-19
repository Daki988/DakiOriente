"use client";
import Link from "@/components/ui/Link";
import { motion } from "framer-motion";
import { BadgeCheck, Download, GraduationCap, Info, MessageCircle, Plus, Share2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { LireUrl } from "@/hooks/useFiltres";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { useDestination } from "@/components/ui/Destination";
import { TAUX_SECOURS, convertir, convertirDe, formatMontant, symbole } from "@/lib/devises";
import { DESTINATIONS_ACTIVES, destinationById, labelPays, libelleFilieres, type PaysCode } from "@/lib/data";
import { LABELS, STATUT_LONG, VILLES_ETUDES, admissionLabel, compatibilite, etabById, etablissements, formationById, formations, formationsLiees, labelById, metierById, metiers, paysDetailById, type Etablissement, type Label } from "@/lib/data";
import { paysOrigine, paysOrigineById, visaResume } from "@/lib/pays-origine";
import { COUTS, devis } from "@/lib/devis";
import { useDevise } from "@/components/ui/Devise";
import { villesOffre } from "@/lib/catalogue";
import { PROFILE_KEY } from "./OrientationTest";

type Mode = "formation" | "metier";
const MAX = 3; // trois écoles : lisible sur un téléphone
const CFA = ["XAF", "XOF"];

/** Montant court pour une colonne étroite : « 2,3 M F CFA », « 45 000 MAD ». */
const NB = "\u00a0"; // espace insécable : un montant ne se coupe jamais en deux lignes
function court(n: number, devise: string) {
  const u = symbole(devise).replace(/ /g, NB);
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: n >= 1e7 ? 0 : 1 })}${NB}M${NB}${u}`;
  const r = n >= 1e5 ? Math.round(n / 1000) * 1000 : n; // 307 481 → 307 000 : assez précis pour une estimation
  return `${Math.round(r).toLocaleString("fr-FR").replace(/[\s\u202f]/g, NB)}${NB}${u}`;
}
function plage(min: number, max: number, devise: string, suffixe = "") {
  const a = court(min, devise), b = court(max, devise);
  if (min === max) return `${a}${suffixe}`;
  // « 37 000 – 45 000 MAD » : l'unité une seule fois
  const u = `${NB}${symbole(devise).replace(/ /g, NB)}`;
  return `${a.endsWith(u) && b.endsWith(u) ? a.slice(0, -u.length) : a} – ${b}${suffixe}`;
}

/** Fourchette dans la devise de l'école, et son équivalent dans la monnaie du visiteur (F CFA en premier pour la zone F CFA). */
function Montants({ min, max, source, suffixe = "" }: { min: number; max: number; source: string; suffixe?: string }) {
  const { devise, taux } = useDevise();
  const conv = (n: number) => (devise ? (source === "MAD" ? convertir(n, devise, taux) : convertirDe(n, source, devise, taux)) : null);
  const a = conv(min), b = conv(max);
  const local = plage(min, max, source, suffixe);
  if (a == null || b == null || !devise) return <span>{local}</span>;
  const eq = `≈ ${plage(a, b, devise, suffixe)}`;
  return CFA.includes(devise)
    ? <span>{eq}<span className="block text-[12px] font-semibold text-ink-mute">soit {local}</span></span>
    : <span>{local}<span className="block text-[12px] font-semibold text-ink-mute">{eq}</span></span>;
}

export function Comparateur() {
  // Choix initiaux lus dans l'URL côté navigateur (LireUrl) : la page reste rendue côté serveur.
  const [luUrl, setLuUrl] = useState(false);
  const [mode, setMode] = useState<Mode>("formation");
  const [fid, setFid] = useState("frm-ingenieur-informatique");
  const [mid, setMid] = useState("met-data-analyst");
  const [label, setLabel] = useState<Label | "">("");
  const [origine, setOrigine] = useState("");
  const [ville, setVille] = useState("");
  const [initial, setInitial] = useState<string[]>([]);
  const onUrl = useCallback((qs: string) => {
    if (luUrl) return;
    const p = new URLSearchParams(qs);
    if (p.get("m") && metierById[p.get("m")!]) { setMode("metier"); setMid(p.get("m")!); }
    if (p.get("f") && formationById[p.get("f")!]) setFid(p.get("f")!);
    if (p.get("label")) setLabel(p.get("label") as Label);
    if (paysOrigineById[p.get("o") ?? ""]) setOrigine(p.get("o")!);
    if (VILLES_ETUDES.includes(p.get("v") ?? "")) setVille(p.get("v")!);
    const pp = p.get("pays") ?? "";
    if (pp === "tous" || destinationById[pp as PaysCode]?.actif) setPaysEtude(pp as PaysCode | "tous");
    const e = (p.get("e") ?? "").split(",").filter((id) => etabById[id]).slice(0, MAX);
    if (e.length) { setInitial(e); setIds(e); }
    setLuUrl(true);
  }, [luUrl]);
  const { pays } = useDevise();
  // Pays d'études : ?pays= dans l'adresse, sinon la destination choisie (le comparateur peut aussi mélanger les pays).
  const { destination } = useDestination();
  const [paysEtude, setPaysEtude] = useState<PaysCode | "tous" | null>(null);
  const choixPays = paysEtude ?? destination;
  const paysF = choixPays === "tous" ? "" : choixPays;
  // Pays devinés (profil, navigateur) seulement après lecture de l'URL, qui reste prioritaire.
  useEffect(() => { if (luUrl && !origine && pays && paysOrigineById[pays]) setOrigine(pays); }, [pays, luUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  // Profil du test d'orientation : la compatibilité n'est affichée que si l'élève a passé le test.
  const [profil, setProfil] = useState<string[] | null>(null);
  useEffect(() => { try { const t = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null")?.top; if (Array.isArray(t) && t.length) setProfil(t); } catch { /* ignore */ } }, []);

  // Formations de référence : la formation choisie, ou toutes celles qui mènent au métier.
  const cibles = useMemo(() => (mode === "formation" ? [fid] : metierById[mid].formations.filter((f) => formationById[f])), [mode, fid, mid]);
  const matchOf = (e: Etablissement) => {
    const direct = e.formations.filter((f) => cibles.includes(f));
    return direct.length ? direct : mode === "formation" ? formationsLiees(e, fid).filter((f) => f !== fid) : [];
  };
  const villesDe = (e: Etablissement) => Array.from(new Set(e.formations.filter((f) => cibles.includes(f)).flatMap((f) => villesOffre(e, f))));
  const candidats = useMemo(() => etablissements.filter((e) => (!paysF || e.pays === paysF) && (!label || e.label === label) && e.formations.some((f) => cibles.includes(f)) && (!ville || villesDe(e).includes(ville)))
    .sort((a, b) => b.photos.length - a.photos.length || b.formations.length - a.formations.length), [cibles, label, ville, paysF]); // eslint-disable-line react-hooks/exhaustive-deps

  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds((cur) => {
      const keep = cur.filter((id) => candidats.some((c) => c.id === id) || initial.includes(id));
      const fill = candidats.filter((c) => !keep.includes(c.id)).map((c) => c.id);
      // Diversité : on complète en priorité avec d'autres villes.
      fill.sort((a, b) => Number(keep.some((k) => etabById[k].ville === etabById[a].ville)) - Number(keep.some((k) => etabById[k].ville === etabById[b].ville)));
      return [...keep, ...fill].slice(0, MAX);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidats, initial]);
  useEffect(() => {
    if (!luUrl) return;
    const q = new URLSearchParams();
    if (mode === "formation") q.set("f", fid); else q.set("m", mid);
    if (label) q.set("label", label);
    if (ville) q.set("v", ville);
    if (origine) q.set("o", origine);
    if (paysEtude) q.set("pays", paysEtude);
    if (ids.length) q.set("e", ids.join(","));
    window.history.replaceState(window.history.state, "", `/comparateur/?${q.toString()}`);
  }, [mode, fid, mid, label, ville, origine, ids, luUrl, paysEtude]);

  const cols = ids.map((id) => {
    const e = etabById[id];
    const m = matchOf(e);
    const ref = m[0] ?? (mode === "formation" ? fid : cibles[0]);
    const D = devis(e.id, ref, origine);
    const C = COUTS[e.pays];
    const sco = e.frais_publies ?? C.scolarite_annuelle[e.type] ?? C.scolarite_annuelle.universite;
    const villes = villesDe(e);
    const villeVie = villes[0] ?? e.ville;
    const vie = C.vie_mensuelle[C.vie_mensuelle.villes_cheres.some((v) => villeVie.includes(v)) ? "ville_chere" : "autre_ville"];
    // Totaux ramenés en dirhams pour comparer des écoles de pays différents (taux indicatifs)
    const enMad = (v: number) => (C.devise === "MAD" ? v : v / (TAUX_SECOURS.taux[C.devise] ?? 1));
    const filieres = e.filieres.filter((f) => f.formation && (m.includes(f.formation) || cibles.includes(f.formation)));
    return { e, m, ref, D, sco, publie: !!e.frais_publies, vie, villeVie, dev: C.devise, milieu: enMad((D.total[0] + D.total[1]) / 2), villes, filieres };
  });
  type Col = (typeof cols)[number];
  const moinsCher = cols.length > 1 ? cols.reduce((b, c) => (c.milieu < b.milieu ? c : b)).e.id : null;
  const scoreDe = (c: Col) => (profil ? compatibilite(profil, c.ref) : 0);
  const maxScore = Math.max(0, ...cols.map(scoreDe));
  const maxFilieres = Math.max(0, ...cols.map((c) => c.e.filieres.length));
  const doyenne = Math.min(...cols.map((c) => c.e.annee_creation ?? 9999));
  const an = new Date().getFullYear();

  // Chaque critère : titre, explication courte, valeur par école, clé de comparaison (identique partout → encadré « commun »).
  type Critere = { id: string; lab: string; aide: ReactNode; cell: (c: Col) => ReactNode; cle: (c: Col) => string; mieux?: (c: Col) => boolean; toujours?: boolean };
  const criteres: Critere[] = [
    {
      id: "filiere", lab: "La filière dans cette école", toujours: true,
      aide: "Nom exact du programme et son accréditation par l'État (arrêté publié au Bulletin officiel).",
      cle: (c) => c.filieres.map((f) => f.intitule).join("|") || c.ref,
      cell: (c) => {
        const liste = c.filieres.length ? c.filieres : [];
        const ok = liste.some((f) => !f.recente);
        return (
          <>
            {liste.length ? liste.slice(0, 2).map((f) => <Link key={f.intitule} href={`/formations/${c.ref}/?etab=${c.e.id}`} className="mb-1.5 block leading-snug hover:text-brand-600">{f.intitule}</Link>)
              : <Link href={`/formations/${c.ref}/?etab=${c.e.id}`} className="block leading-snug hover:text-brand-600">{formationById[c.ref].intitule}</Link>}
            {liste.length > 2 && <span className="block text-xs font-semibold text-ink-mute">+ {liste.length - 2} autre{liste.length > 3 ? "s" : ""}</span>}
            <span className={`mt-1 block text-xs font-bold ${ok ? "text-[#0b7a3d]" : liste.length ? "text-[#8a4b00]" : "text-ink-mute"}`}>
              {ok ? "✓ Accréditée par l'État" : liste.length ? "Renouvellement pas encore publié" : "Diplôme de l'école (non accrédité)"}
            </span>
          </>
        );
      },
    },
    {
      id: "reconnaissance", lab: "Reconnaissance de l'école",
      aide: <><b>Reconnu par l&apos;État</b> : diplômes équivalents aux diplômes nationaux. <b>Diplômes homologués</b> : seules les filières accréditées le sont. <b>Autorisé</b> : diplôme propre à l&apos;école.</>,
      cle: (c) => `${c.e.label}|${c.e.statut}`,
      mieux: (c) => c.e.label === "reconnu_etat",
      cell: (c) => <>{(c.e.pays === "MA" ? labelById[c.e.label]?.libelle : c.e.label_libelle) ?? "—"}<span className="block text-xs font-semibold text-ink-mute">{STATUT_LONG[c.e.statut] ?? "Privé"}</span></>,
    },
    {
      id: "scolarite", lab: "Frais de scolarité par an",
      aide: "Tarif publié par l'école quand elle l'affiche, sinon estimation pour ce type d'école. À confirmer auprès de l'école.",
      cle: (c) => `${c.sco.min}-${c.sco.max}-${c.publie}`,
      cell: (c) => <><Montants min={c.sco.min} max={c.sco.max} source={c.dev} /><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${c.publie ? "bg-[#e8f8ef] text-[#0b7a3d]" : "bg-[#f1f4fd] text-ink-mute"}`}>{c.publie ? "Tarif publié" : "Estimation"}</span></>,
    },
    {
      id: "total", lab: "Coût total des études",
      aide: <>Scolarité, vie sur place et installation{origine ? ", billets d'avion compris" : ""}, pour toute la durée. Touche le montant pour voir le détail.{!origine && " Choisis ton pays de départ pour ajouter le voyage."}</>,
      cle: (c) => `${c.D.total[0]}-${c.D.total[1]}`,
      mieux: (c) => c.e.id === moinsCher,
      cell: (c) => <Link href={`/devis/?etab=${c.e.id}&f=${c.ref}${origine ? `&o=${origine}` : ""}`} className="hover:text-brand-600"><Montants min={c.D.total[0]} max={c.D.total[1]} source={c.dev} /><span className="mt-1 block text-xs font-semibold text-brand-600">sur {c.D.years} an{c.D.years > 1 ? "s" : ""} · détail →</span></Link>,
    },
    {
      id: "vie", lab: "Vie sur place par mois",
      aide: "Logement, repas et transport d'un étudiant dans la ville du campus.",
      cle: (c) => `${c.vie.min}-${c.vie.max}`,
      cell: (c) => <><Montants min={c.vie.min} max={c.vie.max} source={c.dev} /><span className="mt-1 block text-xs font-semibold text-ink-mute">à {c.villeVie}</span></>,
    },
    ...(profil ? [{
      id: "profil", lab: "Compatibilité avec ton profil",
      aide: "D'après ton test d'orientation : tes goûts comparés aux métiers auxquels mène la formation.",
      cle: (c: Col) => String(scoreDe(c)),
      mieux: (c: Col) => scoreDe(c) === maxScore,
      cell: (c: Col) => `${scoreDe(c)} %`,
    }] : []),
    { id: "diplome", lab: "Diplôme et durée", aide: "Diplôme obtenu à la fin et nombre d'années d'études.", cle: (c) => c.ref, cell: (c) => `${formationById[c.ref].diplome} · ${formationById[c.ref].duree_annees} ans` },
    { id: "admission", lab: "Admission", aide: "Comment on entre : dossier, concours, entretien…", cle: (c) => formationById[c.ref].mode_admission, cell: (c) => admissionLabel(formationById[c.ref].mode_admission) },
    {
      id: "creation", lab: "Ancienneté", aide: "Année de création de l'école.",
      cle: (c) => String(c.e.annee_creation ?? ""),
      mieux: (c) => c.e.annee_creation === doyenne,
      cell: (c) => (c.e.annee_creation ? <>{c.e.annee_creation}<span className="block text-xs font-semibold text-ink-mute">{an - c.e.annee_creation} ans d&apos;existence</span></> : "Non communiquée"),
    },
    {
      id: "filieres", lab: "Filières de l'école", aide: "Toutes formations confondues : donne une idée de la taille de l'école. « En renouvellement » : accréditation échue, renouvellement pas encore publié.",
      cle: (c) => String(c.e.filieres.length),
      mieux: (c) => c.e.filieres.length === maxFilieres && maxFilieres > 0,
      cell: (c) => libelleFilieres(c.e),
    },
    { id: "metiers", lab: "Métiers visés", aide: "Métiers auxquels prépare la formation.", cle: (c) => formationById[c.ref].metiers.slice(0, 3).join("|"), cell: (c) => (mode === "metier" ? [mid] : formationById[c.ref].metiers).slice(0, 3).map((x) => metierById[x]?.nom).filter(Boolean).join(" · ") },
    { id: "visa", lab: origine ? `Visa (au départ de : ${paysOrigineById[origine]?.nom ?? origine})` : "Visa", aide: "Formalités pour entrer et étudier dans le pays.", cle: (c) => c.e.pays, cell: () => <Link href="/ressources/visa-carte-de-sejour/" className="hover:text-brand-600">{origine ? visaResume(origine) : "Choisis ton pays de départ"}</Link> },
    { id: "logement", lab: "Logement", aide: "Logements étudiants vérifiés.", cle: (c) => c.e.pays, cell: (c) => { const b = paysDetailById[c.e.pays].budget; return <Link href="/navilease/" className="hover:text-brand-600">{c.e.pays === "MA" ? "Logements vérifiés Navilease" : "Logement"} · dès {formatMontant(b.lignes[0].min, c.dev)}/mois</Link>; } },
  ];
  const plusieurs = cols.length > 1;
  const lignes = criteres.filter((r) => !plusieurs || r.toujours || new Set(cols.map(r.cle)).size > 1);
  const communs = plusieurs ? criteres.filter((r) => !r.toujours && new Set(cols.map(r.cle)).size === 1) : [];
  const grille = { gridTemplateColumns: `repeat(${Math.max(cols.length, 1)}, minmax(0, 1fr))` };

  const ajoutables = candidats.filter((c) => !ids.includes(c.id));
  const share = async () => {
    const url = window.location.href;
    try { if (navigator.share) await navigator.share({ title: "Comparaison Navigoal", url }); else { await navigator.clipboard.writeText(url); alert("Lien copié : partage-le avec tes parents."); } } catch { /* annulé */ }
  };
  const champ = "min-h-[44px] w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px] font-bold";

  return (
    <>
      <LireUrl onUrl={onUrl} />
      <section className="bg-gradient-to-b from-brand-50 to-[#f6f8fe] pb-5 pt-6 sm:pb-7 sm:pt-10 print:hidden">
        <div className="container flex flex-col gap-4">
          <div className="flex max-w-3xl flex-col gap-2"><span className="eyebrow">Comparateur</span><h1 className="h-section">Compare et choisis en confiance</h1><p className="text-[15px] text-ink-mute sm:text-base">Choisis une formation ou un métier : jusqu&apos;à {MAX} écoles côte à côte, avec ce qui change vraiment de l&apos;une à l&apos;autre.</p></div>
          <div className="card flex flex-col gap-2.5 rounded-2xl p-3 lg:grid lg:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
            <div className="grid grid-cols-2 rounded-xl bg-[#f6f8fe] p-[3px]" role="group" aria-label="Comparer par">
              {(["formation", "metier"] as const).map((m) => <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} className={`relative min-h-[40px] rounded-[10px] px-3.5 text-[14px] font-bold ${mode === m ? "text-brand-600" : "text-ink-mute"}`}>{mode === m && <motion.span layoutId="cmp-mode" className="absolute inset-0 rounded-[10px] bg-white shadow-sm" />}<span className="relative">{m === "formation" ? "Par formation" : "Par métier"}</span></button>)}
            </div>
            <label className="relative flex min-w-0 items-center">
              <GraduationCap size={18} className="pointer-events-none absolute left-3 text-brand-600" />
              {mode === "formation"
                ? <select value={fid} onChange={(ev) => setFid(ev.target.value)} className={`${champ} pl-10`} aria-label="Formation">{formations.filter((f) => f.etablissements.some((x) => etabById[x])).sort((a, b) => a.intitule.localeCompare(b.intitule)).map((f) => <option key={f.id} value={f.id}>{f.intitule}</option>)}</select>
                : <select value={mid} onChange={(ev) => setMid(ev.target.value)} className={`${champ} pl-10`} aria-label="Métier">{metiers.filter((m) => m.formations.some((f) => formationById[f]?.etablissements.some((x) => etabById[x]))).sort((a, b) => a.nom.localeCompare(b.nom)).map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select>}
            </label>
            <select value={ville} onChange={(ev) => setVille(ev.target.value)} className={champ} aria-label="Ville du campus"><option value="">Toutes les villes</option>{VILLES_ETUDES.map((v) => <option key={v} value={v}>{v}</option>)}</select>
            <select value={origine} onChange={(ev) => setOrigine(ev.target.value)} className={champ} aria-label="Pays de départ"><option value="">Je pars de : choisir</option><optgroup label="Afrique">{paysOrigine.filter((p) => p.continent === "afrique").map((p) => <option key={p.id} value={p.id}>Je pars de : {p.nom}</option>)}</optgroup><optgroup label="Autres pays">{paysOrigine.filter((p) => p.continent === "autre").map((p) => <option key={p.id} value={p.id}>Je pars de : {p.nom}</option>)}</optgroup></select>
            <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 lg:col-span-4 lg:mx-0 lg:flex-wrap lg:px-0">
              {DESTINATIONS_ACTIVES.length > 1 && <select value={choixPays} onChange={(ev) => setPaysEtude(ev.target.value as PaysCode | "tous")} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-bold" aria-label="Pays d'études"><option value="tous">Tous les pays</option>{DESTINATIONS_ACTIVES.map((d) => <option key={d.code} value={d.code}>Étudier {d.prep}</option>)}</select>}
              {[{ id: "" as const, court: "Tous labels" }, ...LABELS.filter((l) => etablissements.some((e) => e.label === l.id))].map((l) => <button key={l.id} onClick={() => setLabel(l.id)} aria-pressed={label === l.id} className={`chip shrink-0 whitespace-nowrap px-3 py-2 ${label === l.id ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"}`}>{l.court}</button>)}
            </div>
          </div>
          <span className="text-[13px] text-ink-mute">{candidats.length} établissement{candidats.length > 1 ? "s" : ""} propose{candidats.length > 1 ? "nt" : ""} {mode === "formation" ? "cette formation" : "une formation menant à ce métier"}{ville ? ` à ${ville}` : ""}{label ? ` (label ${paysF && paysF !== "MA" ? labelPays(label, paysF) : labelById[label]?.court})` : ""}{paysF ? ` ${destinationById[paysF].prep}` : ""}.</span>
        </div>
      </section>

      <div className="container mt-2">
        {!cols.length ? <p className="card p-8 text-center text-ink-mute">Aucun établissement pour ce choix. Essaie « Tous labels » ou « Toutes les villes ».</p> : (
          <div className="card overflow-clip rounded-3xl">
            {/* En-tête des écoles, toujours visible pendant le défilement */}
            <div className="sticky top-[76px] z-20 transition-[top] duration-300 [html[data-entete=cache]_&]:top-0 border-b border-[#eef1f8] bg-white backdrop-blur lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="hidden items-end p-4 text-xs font-bold text-ink-mute lg:flex">{cols.length} école{cols.length > 1 ? "s" : ""} comparée{cols.length > 1 ? "s" : ""}</div>
              <div className="grid gap-2 p-2.5 sm:gap-3 sm:p-3" style={grille}>
                {cols.map((c) => (
                  <div key={c.e.id} className="relative flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 pb-1 pt-1.5 text-center sm:flex-row sm:items-start sm:gap-2.5 sm:text-left">
                    <EtabLogo e={c.e} size={44} className="shrink-0" />
                    <div className="min-w-0 sm:pr-7">
                      <Link href={`/etablissements/${c.e.id}/`} className="line-clamp-2 text-[13px] font-extrabold leading-tight hover:text-brand-600 sm:text-sm" title={c.e.nom}>{c.e.sigle || c.e.nom}</Link>
                      <span className="block truncate text-[11px] font-semibold text-ink-mute sm:text-xs">{c.villes.slice(0, 2).join(" · ") || c.e.ville}</span>
                      {c.e.id === moinsCher && <span className="mt-1 inline-block rounded-full bg-[#e8f8ef] px-2 py-0.5 text-[10px] font-extrabold text-[#0b7a3d] sm:text-[11px]">Le moins cher</span>}
                    </div>
                    <button onClick={() => setIds(ids.filter((x) => x !== c.e.id))} className="absolute -right-0.5 -top-0.5 flex h-8 w-8 items-center justify-center rounded-full text-ink-mute hover:bg-[#ffecef] hover:text-[#b8213f] print:hidden" aria-label={`Retirer ${c.e.sigle}`}><X size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
            {ids.length < MAX && ajoutables.length > 0 && (
              <label className="flex items-center gap-2 border-b border-[#eef1f8] bg-[#fbfcff] px-3 py-2.5 print:hidden">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Plus size={16} /></span>
                <select value="" onChange={(ev) => ev.target.value && setIds([...ids, ev.target.value])} className={champ} aria-label="Ajouter une école"><option value="">Ajouter une école ({ajoutables.length} possibles)…</option>{ajoutables.map((e) => <option key={e.id} value={e.id}>{e.sigle} · {villesDe(e).join(", ")}</option>)}</select>
              </label>
            )}
            {lignes.map((r, j) => (
              <div key={r.id} className={`border-b border-[#eef1f8] lg:grid lg:grid-cols-[260px_minmax(0,1fr)] ${j % 2 ? "bg-white" : "bg-[#fbfcff]"}`}>
                <div className="px-3.5 pb-1 pt-3 sm:px-4 lg:py-4">
                  <b className="block text-[14px]">{r.lab}</b>
                  <p className="mt-0.5 text-[12px] leading-snug text-ink-mute">{r.aide}</p>
                </div>
                <div className="grid gap-2 px-2.5 pb-3 pt-1.5 sm:gap-3 sm:px-3 lg:py-4" style={grille}>
                  {cols.map((c) => {
                    const ok = plusieurs && r.mieux?.(c) && !cols.every((x) => r.mieux?.(x));
                    return <div key={c.e.id} className={`min-w-0 hyphens-auto break-words rounded-xl px-1.5 py-1 text-[13px] font-bold sm:px-2 sm:text-sm ${ok ? "bg-[#e8f8ef] text-[#0b7a3d]" : ""}`}>{r.cell(c)}</div>;
                  })}
                </div>
              </div>
            ))}
            <div className="grid gap-2 p-2.5 sm:gap-3 sm:p-3 lg:grid-cols-[260px_minmax(0,1fr)] lg:p-0">
              <div className="hidden lg:block" />
              <div className="grid gap-2 sm:gap-3 lg:p-3" style={grille}>
                {cols.map((c) => (
                  <div key={c.e.id} className="flex min-w-0 flex-col gap-1.5">
                    <Link href={`/espace/candidatures/nouvelle?etab=${c.e.id}&formation=${c.ref}`} className="btn-primary min-h-[44px] justify-center px-2 text-[13px]">Candidater</Link>
                    <Link href={`/etablissements/${c.e.id}/`} className="py-1 text-center text-[13px] font-bold text-brand-600">Voir la fiche</Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {communs.length > 0 && (
          <div className="card mt-4 rounded-3xl p-4 sm:p-5">
            <b className="flex items-center gap-2 text-[15px]"><BadgeCheck size={18} className="text-brand-600" />Pareil dans ces {cols.length} écoles</b>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {communs.map((r) => <div key={r.id} className="min-w-0"><dt className="text-[12px] font-bold text-ink-mute">{r.lab}</dt><dd className="text-sm font-bold">{r.cell(cols[0])}</dd></div>)}
            </dl>
          </div>
        )}
        {cols.length > 0 && <p className="mt-3 flex gap-2 text-xs leading-relaxed text-ink-mute"><Info size={14} className="mt-0.5 shrink-0" /><span>Sur fond vert : la meilleure valeur de la ligne. Montants convertis au taux du jour, majorés de 3 % par prudence. Frais à confirmer auprès de chaque école.{!profil && <> <Link href="/orientation/" className="font-bold text-brand-600">Passe le test d&apos;orientation</Link> pour voir ta compatibilité avec chaque formation.</>}</span></p>}
      </div>

      <div className="container mt-5 grid gap-2.5 sm:grid-cols-3 sm:gap-4 print:hidden">
        {([[Share2, "bg-brand-50 text-brand-600", "Partager la comparaison", "avec tes parents ou ton conseiller", share], [Download, "bg-[#e8f8ef] text-[#0b7a3d]", "Exporter en PDF", "pour décider à tête reposée", () => window.print()], [MessageCircle, "bg-sun-100 text-[#a55a00]", "Poser une question", "directement aux établissements", () => (window.location.href = "/messages")]] as const).map(([I, cls, t, s, fn]) => (
          <button key={t} onClick={fn} className="card flex items-center gap-3 rounded-[18px] p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-lift sm:p-[18px]"><span className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl ${cls}`}><I size={20} /></span><span><b className="block text-sm">{t}</b><span className="text-xs text-ink-mute">{s}</span></span></button>
        ))}
      </div>
    </>
  );
}
