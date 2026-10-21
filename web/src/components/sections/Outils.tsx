"use client";
// Outils pratiques de la page Ressources : checklist de candidature, calculateur de moyenne, convertisseur de devises.
import Link from "@/components/ui/Link";
import { ArrowLeftRight, Check, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDevise } from "@/components/ui/Devise";
import { MARGE_PRUDENCE, convertir, formatMontant } from "@/lib/devises";
import { PAYS_OPTIONS, nomPays, paysOrigineById } from "@/lib/pays-origine";

const lire = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const ecrire = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } };
const champ = "min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

// ---------------------------------------------------------------- Checklist
const ETAPES: { titre: string; items: string[] }[] = [
  { titre: "1. Préparer ton projet", items: ["Passer le test d'orientation et noter 2 ou 3 métiers visés", "Choisir 3 à 5 formations et vérifier le label de chaque établissement", "Vérifier les séries du bac acceptées et le mode d'admission", "Estimer le budget complet (scolarité, vie, installation) avec tes parents"] },
  { titre: "2. Constituer ton dossier", items: ["Passeport valide (ou pièce d'identité) — demande-le tôt", "Relevés de notes des deux dernières années", "Diplôme du baccalauréat ou attestation de réussite", "Photos d'identité récentes", "CV d'une page", "Lettre de motivation personnalisée pour chaque école", "Copies légalisées et traduites si nécessaire"] },
  { titre: "3. Candidater", items: ["Créer ton compte Navigoal et compléter ton profil", "Déposer tes candidatures avant les dates limites (souvent de mars à juillet)", "Payer les frais de dossier éventuels", "Préparer le test ou l'entretien d'admission", "Comparer les réponses et confirmer ton inscription"] },
  { titre: "4. Avant le départ", items: ["Recevoir l'attestation d'inscription ou de préinscription", "Vérifier le régime d'entrée selon ta nationalité (sans visa, AEVM, e-Visa ou visa)", "Souscrire une assurance santé", "Réserver ton logement (contrat écrit, paiement protégé)", "Acheter ton billet et prévoir de l'argent pour le premier mois"] },
  { titre: "5. À l'arrivée au Maroc", items: ["Finaliser ton inscription à l'établissement", "Faire légaliser ton contrat de bail (certificat d'hébergement)", "Déposer ta demande de carte de séjour dans les 90 jours", "Ouvrir un compte bancaire ou un portefeuille mobile", "Prendre un abonnement de transport étudiant si disponible"] },
];
const CLE_CHECK = "navigoal.checklist";

export function Checklist() {
  const [faits, setFaits] = useState<string[]>([]);
  useEffect(() => setFaits(lire<string[]>(CLE_CHECK, [])), []);
  const total = ETAPES.reduce((n, e) => n + e.items.length, 0);
  const basculer = (id: string) => { const n = faits.includes(id) ? faits.filter((x) => x !== id) : [...faits, id]; setFaits(n); ecrire(CLE_CHECK, n); };
  const pct = Math.round((faits.length / total) * 100);
  return (
    <div className="flex flex-col gap-5">
      <div className="card sticky top-[84px] z-10 flex flex-wrap items-center gap-4 p-4 print:static">
        <div className="min-w-[160px] flex-1"><div className="flex justify-between text-sm font-bold"><span>{faits.length} / {total} étapes</span><span className="text-brand-600">{pct} %</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8edfa]"><div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-[#0f8a46] transition-all" style={{ width: `${pct}%` }} /></div></div>
        <button onClick={() => window.print()} className="btn-ghost min-h-[42px] px-3.5 py-2 print:hidden"><Printer size={16} /> Imprimer</button>
        <button onClick={() => { setFaits([]); ecrire(CLE_CHECK, []); }} className="btn-ghost min-h-[42px] px-3.5 py-2 print:hidden"><RotateCcw size={16} /> Tout décocher</button>
      </div>
      {ETAPES.map((e, i) => (
        <section key={e.titre} className="card flex flex-col gap-1 p-5">
          <h2 className="mb-2 text-lg font-extrabold">{e.titre}</h2>
          {e.items.map((t, j) => { const id = `${i}-${j}`; const on = faits.includes(id); return (
            <button key={id} onClick={() => basculer(id)} aria-pressed={on} className="flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left text-sm hover:bg-[#f6f8fe]">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${on ? "bg-[#0f8a46] text-white" : "border-[1.5px] border-[#cdd5ea] bg-white"}`}>{on && <Check size={15} strokeWidth={3} />}</span>
              <span className={on ? "text-ink-mute line-through" : ""}>{t}</span>
            </button>); })}
        </section>
      ))}
      <p className="text-xs text-ink-mute">Ta progression est enregistrée sur cet appareil uniquement. Les démarches de visa dépendent de ta nationalité : voir le <Link href="/ressources/visa-carte-de-sejour/" className="font-bold text-brand-600">guide visa et carte de séjour</Link>.</p>
    </div>
  );
}

// ---------------------------------------------------------------- Calculateur de moyenne
type Matiere = { nom: string; coef: string; note: string };
const DEPART: Matiere[] = [{ nom: "Mathématiques", coef: "7", note: "" }, { nom: "Physique-chimie", coef: "7", note: "" }, { nom: "Français", coef: "4", note: "" }, { nom: "Anglais", coef: "2", note: "" }];
const num = (s: string) => { const v = parseFloat(s.replace(",", ".")); return Number.isFinite(v) ? v : NaN; };
const mention = (m: number) => (m >= 16 ? "Très bien" : m >= 14 ? "Bien" : m >= 12 ? "Assez bien" : m >= 10 ? "Passable" : "Non admis (moins de 10)");

export function CalculateurBac() {
  const [mode, setMode] = useState<"coef" | "maroc">("coef");
  const [ms, setMs] = useState<Matiere[]>(DEPART);
  const [ma, setMa] = useState({ regional: "", continu: "", national: "" });
  const res = useMemo(() => {
    if (mode === "maroc") {
      const r = num(ma.regional), c = num(ma.continu), n = num(ma.national);
      if ([r, c, n].some((x) => !Number.isFinite(x) || x < 0 || x > 20)) return null;
      return r * 0.25 + c * 0.25 + n * 0.5;
    }
    const ok = ms.filter((m) => Number.isFinite(num(m.note)) && Number.isFinite(num(m.coef)) && num(m.coef) > 0 && num(m.note) >= 0 && num(m.note) <= 20);
    const sc = ok.reduce((a, m) => a + num(m.coef), 0);
    return sc ? ok.reduce((a, m) => a + num(m.note) * num(m.coef), 0) / sc : null;
  }, [mode, ms, ma]);
  const maj = (i: number, p: Partial<Matiere>) => setMs(ms.map((m, k) => (k === i ? { ...m, ...p } : m)));
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
      <div className="card flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex rounded-xl bg-[#f1f4fd] p-1" role="tablist">
          {([["coef", "Par matières et coefficients"], ["maroc", "Bac marocain (25/25/50)"]] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={`min-h-[42px] flex-1 rounded-[10px] px-2 text-[13px] font-bold ${mode === k ? "bg-white text-brand-600 shadow-sm" : "text-ink-mute"}`}>{l}</button>)}
        </div>
        {mode === "coef" ? (
          <>
            <div className="hidden grid-cols-[1fr_80px_80px_44px] gap-2 text-xs font-bold text-ink-mute sm:grid"><span>Matière</span><span>Coef.</span><span>Note /20</span><span /></div>
            {ms.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_44px] gap-2 sm:grid-cols-[1fr_80px_80px_44px]">
                <input value={m.nom} onChange={(e) => maj(i, { nom: e.target.value })} aria-label="Matière" placeholder="Matière" className={`${champ} col-span-3 sm:col-span-1`} />
                <input value={m.coef} onChange={(e) => maj(i, { coef: e.target.value })} aria-label={`Coefficient ${m.nom}`} inputMode="decimal" placeholder="Coef." className={champ} />
                <input value={m.note} onChange={(e) => maj(i, { note: e.target.value })} aria-label={`Note ${m.nom}`} inputMode="decimal" placeholder="/20" className={champ} />
                <button onClick={() => setMs(ms.filter((_, k) => k !== i))} aria-label={`Supprimer ${m.nom}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-mute hover:bg-[#ffecef] hover:text-[#d42a50]"><Trash2 size={17} /></button>
              </div>
            ))}
            <button onClick={() => setMs([...ms, { nom: "", coef: "1", note: "" }])} className="btn-ghost min-h-[42px] self-start px-3.5 py-2"><Plus size={16} /> Ajouter une matière</button>
            <p className="text-xs text-ink-mute">Indique les coefficients officiels de ta série (ils varient selon les pays et les séries). Les lignes incomplètes sont ignorées.</p>
          </>
        ) : (
          <>
            {([["regional", "Examen régional (1re année du bac)", "25 %"], ["continu", "Contrôle continu (2e année)", "25 %"], ["national", "Examen national (2e année)", "50 %"]] as const).map(([k, l, p]) => (
              <label key={k} className="flex flex-col gap-1.5 text-sm font-bold">{l} <span className="text-xs font-semibold text-ink-mute">poids {p}</span>
                <input value={ma[k]} onChange={(e) => setMa({ ...ma, [k]: e.target.value })} inputMode="decimal" placeholder="Note sur 20" className={champ} /></label>
            ))}
            <p className="text-xs text-ink-mute">Pondération du baccalauréat marocain : 25 % régional, 25 % contrôle continu, 50 % national.</p>
          </>
        )}
      </div>
      <div className="card flex flex-col items-center gap-2 bg-gradient-to-br from-brand-950 to-brand-700 p-6 text-center text-white lg:sticky lg:top-24">
        <span className="text-sm text-[#c9d6ff]">Ta moyenne</span>
        <b className="text-5xl font-extrabold">{res == null ? "—" : res.toFixed(2).replace(".", ",")}</b>
        <span className="text-sm text-[#c9d6ff]">sur 20</span>
        {res != null && <span className="chip mt-1 bg-sun-400 px-3 py-1.5 text-sm text-ink">{mention(res)}</span>}
        <p className="mt-2 text-xs text-[#9fb0ec]">Mentions usuelles (à vérifier selon ton pays). Outil indicatif : seul le relevé officiel fait foi.</p>
        <Link href="/formations" className="btn-sun mt-2 w-full">Voir les formations</Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Convertisseur
export function Convertisseur() {
  const { pays, taux, setPays } = useDevise();
  const [p, setP] = useState(pays ?? "SN");
  useEffect(() => { if (pays) setP(pays); }, [pays]);
  const [sens, setSens] = useState<"mad" | "devise">("mad");
  const [montant, setMontant] = useState("3000");
  const devise = paysOrigineById[p]?.devise ?? "EUR";
  const t = taux.taux[devise];
  const v = num(montant);
  const resultat = !Number.isFinite(v) || !t ? null : sens === "mad" ? convertir(v, devise, taux) : Math.ceil((v / t) * (1 + MARGE_PRUDENCE));
  const brut = !Number.isFinite(v) || !t ? null : sens === "mad" ? v * t : v / t;
  return (
    <div className="card flex flex-col gap-5 p-5 sm:p-7">
      <label className="flex flex-col gap-1.5 text-sm font-bold">Ton pays
        <select value={p} onChange={(e) => { setP(e.target.value); setPays(e.target.value); }} className={champ}>
          {["Afrique", "Autres pays"].map((g) => <optgroup key={g} label={g}>{PAYS_OPTIONS.filter((o) => o.group === g && o.value !== "MA").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>)}
        </select>
      </label>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <label className="flex flex-col gap-1.5 text-sm font-bold">Montant en {sens === "mad" ? "dirhams (MAD)" : devise}
          <input value={montant} onChange={(e) => setMontant(e.target.value)} inputMode="decimal" className={`${champ} text-lg`} /></label>
        <button onClick={() => setSens(sens === "mad" ? "devise" : "mad")} aria-label="Inverser le sens de conversion" className="flex h-11 w-11 items-center justify-center self-center rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 sm:mb-0"><ArrowLeftRight size={18} /></button>
        <div className="flex flex-col gap-1.5 text-sm font-bold">Équivalent en {sens === "mad" ? devise : "dirhams (MAD)"}
          <output className="flex min-h-[48px] items-center rounded-xl bg-brand-50 px-3 text-xl font-extrabold text-brand-700">{resultat == null ? "—" : formatMontant(resultat, sens === "mad" ? devise : "MAD")}</output></div>
      </div>
      <p className="text-xs text-ink-mute">
        {t ? <>Taux du {new Date(taux.date).toLocaleDateString("fr-FR")} : 1 MAD = {t.toLocaleString("fr-FR", { maximumFractionDigits: 4 })} {devise}. </> : "Taux indisponible pour cette devise. "}
        Le résultat inclut une marge de prudence de {MARGE_PRUDENCE * 100} % pour couvrir la variation du taux et les frais de transfert{brut != null ? ` (sans marge : ${formatMontant(brut, sens === "mad" ? devise : "MAD")})` : ""}. {nomPays(p)} · {devise}.
      </p>
    </div>
  );
}
