"use client";
/* eslint-disable @next/next/no-img-element -- logos déjà optimisés */
import Link from "@/components/ui/Link";
import { Bookmark, Check, ChevronRight, Crown, Megaphone, Minus, Send, ShieldCheck, SlidersHorizontal, UserRound, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Chip, Empty, Kpi, Loading, PageHeader, Panel, StatusBadge, dateFr, useToast } from "@/components/app/kit";
import { Check as CheckBox, Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { PRIX_PREMIUM_MAD } from "@/lib/premium";
import { domaines, series, VILLES_ETUDES } from "@/lib/data";
import { PAYS_OPTIONS } from "@/lib/pays-origine";
import { useEcole } from "./EcoleContext";
import type { Program } from "./shared";

type Statut = { premium: boolean; premiumUntil: string | null; prix: number };
const nf = (n: number) => n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
const tone = { couvert: "green", declare: "grey", partiel: "sun", inconnu: "grey" } as const;

/** Badge « PREMIUM » des menus et des en-têtes. */
export const PremiumBadge = () => <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#ffd34a] to-[#f9a806] px-2 py-0.5 text-[10.5px] font-extrabold text-ink"><Crown size={11} />PREMIUM</span>;

const LIGNES: [string, boolean][] = [
  ["Fiche école, formations, campagnes d'admission", true], ["Réception et traitement des candidatures", true], ["Messagerie avec les candidats", true], ["Mode accompagné par Navigoal (prise en main)", true],
  ["Filtres : résultats scolaires, projet, financement", false], ["Score d'adéquation et tri des candidats", false], ["Vivier de candidats (profils anonymes consentants)", false],
  ["Campagnes de prospection (2 000 envois par mois)", false], ["Statistiques de campagne", false], ["Mise en avant : badge « Partenaire Navigoal », en tête des listes et sur l'accueil", false],
];

/** Comparatif Gratuit / Premium, affiché à la place d'une fonction Premium tant que l'offre n'est pas active. */
export function OffrePremium({ fonction }: { fonction?: string }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={fonction ?? "Offre Premium"} badge={<PremiumBadge />} sub={`Choisissez et attirez les bons profils : ${nf(PRIX_PREMIUM_MAD)} MAD par an, activée par l'équipe Navigoal.`}
        actions={<a href={`mailto:etablissements@navigoal.net?subject=${encodeURIComponent("Activation de l'offre Premium")}`} className="btn-sun"><Crown size={17} />Demander l&apos;activation</a>} />
      <div className="card overflow-x-auto rounded-[22px]">
        <div className="grid min-w-[620px] grid-cols-[1.5fr_1fr_1fr]">
          <div className="border-b border-[#e6eaf3] p-5" />
          <div className="border-b border-l border-[#e6eaf3] p-5"><b className="text-lg">Gratuit</b><p className="text-xs text-ink-mute">Pour recevoir des candidatures</p><p className="mt-2 text-2xl font-extrabold">0 MAD</p></div>
          <div className="border-b border-l border-[#e6eaf3] bg-[#fffbea] p-5"><b className="text-lg">Premium</b> <PremiumBadge /><p className="text-xs text-ink-mute">Pour choisir et attirer les bons profils</p><p className="mt-2 text-2xl font-extrabold">{nf(PRIX_PREMIUM_MAD)} MAD <span className="text-sm font-semibold text-ink-mute">/ an</span></p></div>
          {LIGNES.map(([t, gratuit]) => (
            <div key={t} className="contents text-sm">
              <div className="border-b border-[#eef1f8] px-5 py-3">{t}</div>
              <div className="border-b border-l border-[#eef1f8] px-5 py-3">{gratuit ? <Check size={18} className="text-[#0f8a46]" /> : <Minus size={18} className="text-[#c3c9d6]" />}</div>
              <div className="border-b border-l border-[#eef1f8] bg-[#fffbea] px-5 py-3"><Check size={18} className="text-[#0f8a46]" /></div>
            </div>
          ))}
        </div>
      </div>
      <Alert tone="info" title="Vos données et celles des élèves">Le vivier ne contient que des élèves qui ont choisi d&apos;être visibles (avec l&apos;accord d&apos;un parent pour les mineurs). Noms et coordonnées restent masqués jusqu&apos;à ce que l&apos;élève accepte votre invitation.</Alert>
    </div>
  );
}

function usePremium() {
  const { eid } = useEcole();
  return useApi<Statut>(`/ecole/${eid}/premium`);
}

// ---------------------------------------------------------------- Candidatures filtrées (résultats, projet, financement)
type Ligne = {
  id: string; number: string; status: string; submittedAt: string | null; programme: string;
  candidat: { firstName: string; lastName: string; country: string | null; pays: string };
  resultats: { moyenne: number | null; verifiee: boolean; mention: string | null; serie: string | null; annee: number | null };
  projet: { metiers: string[]; domaine: string | null; rentree: number | null };
  financement: { statut: keyof typeof tone; libelle: string; preuve: string };
  score: number;
};
const SERIES = Array.from(new Map(series.map((s) => [s.id, `${s.pays} · Bac ${(s as unknown as { code: string }).code}`])).entries()) as [string, string][];
const DOMAINES = domaines.map((d) => [d.id, d.libelle] as [string, string]);
const MENTIONS: [string, string][] = [["", "Toutes mentions"], ["assez_bien", "Assez bien et plus"], ["bien", "Bien et plus"], ["tres_bien", "Très bien"]];

export function SelectionPremium() {
  const { eid, link } = useEcole();
  const st = usePremium();
  const progs = useApi<Program[]>(`/ecole/${eid}/formations`);
  const [f, setF] = useState({ moyenneMin: 10, series: [] as string[], mentionMin: "", domaine: "", programme: "", budgetCouvre: false, garant: false, justificatif: false, bourse: false });
  const [applique, setApplique] = useState(f);
  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (applique.moyenneMin > 0) p.set("moyenneMin", String(applique.moyenneMin));
    if (applique.series.length) p.set("series", applique.series.join(","));
    for (const k of ["mentionMin", "domaine", "programme"] as const) if (applique[k]) p.set(k, applique[k]);
    for (const k of ["budgetCouvre", "garant", "justificatif", "bourse"] as const) if (applique[k]) p.set(k, "1");
    return p.toString();
  }, [applique]);
  const r = useApi<{ total: number; items: Ligne[] }>(st.data?.premium ? `/ecole/${eid}/candidatures-filtrees?${qs}` : null);
  if (st.loading) return <Loading />;
  if (!st.data?.premium) return <OffrePremium fonction="Sélection des candidats" />;
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[300px_1fr]">
      <Panel title={<span className="flex items-center gap-2">Filtres <PremiumBadge /></span>} icon={SlidersHorizontal}>
        <Field label={`Moyenne minimale : ${f.moyenneMin}/20`}>{(id) => <input id={id} type="range" min={0} max={20} step={0.5} value={f.moyenneMin} onChange={(e) => set("moyenneMin", Number(e.target.value))} className="w-full accent-brand-600" />}</Field>
        <Field label="Mention">{(id) => <Select id={id} value={f.mentionMin} onChange={(e) => set("mentionMin", e.target.value)} options={MENTIONS} />}</Field>
        <Field label="Série du bac">{(id) => <Select id={id} value={f.series[0] ?? ""} onChange={(e) => set("series", e.target.value ? [e.target.value] : [])} options={[["", "Toutes les séries"], ...SERIES]} />}</Field>
        <Field label="Projet : domaine">{(id) => <Select id={id} value={f.domaine} onChange={(e) => set("domaine", e.target.value)} options={[["", "Tous les domaines"], ...DOMAINES]} />}</Field>
        <Field label="Formation demandée">{(id) => <Select id={id} value={f.programme} onChange={(e) => set("programme", e.target.value)} options={[["", "Toutes"], ...((progs.data ?? []).map((p) => [p.id, p.title] as [string, string]))]} />}</Field>
        <div className="flex flex-col gap-2 text-sm"><b className="text-[13px]">Capacité de financement</b>
          <CheckBox checked={f.budgetCouvre} onChange={(v) => set("budgetCouvre", v)}>Budget ≥ coût annuel estimé</CheckBox>
          <CheckBox checked={f.garant} onChange={(v) => set("garant", v)}>Garant (parent) identifié</CheckBox>
          <CheckBox checked={f.justificatif} onChange={(v) => set("justificatif", v)}>Justificatif de ressources validé</CheckBox>
          <CheckBox checked={f.bourse} onChange={(v) => set("bourse", v)}>Bourse ou prêt demandé</CheckBox>
        </div>
        <Button onClick={() => setApplique(f)}>Appliquer</Button>
      </Panel>
      <div className="flex min-w-0 flex-col gap-4">
        {r.loading && !r.data ? <Loading /> : r.error ? <Alert tone="error">{r.error.message}</Alert> : r.data && (
          <>
            <p className="text-sm text-ink-mute"><b className="text-ink">{r.data.items.length} candidat{r.data.items.length > 1 ? "s" : ""}</b> sur {r.data.total} correspondent à vos critères · triés par adéquation</p>
            {!r.data.items.length ? <Empty icon={Users} title="Aucun candidat ne correspond" text="Élargissez les filtres (moyenne, série, financement)." /> : (
              <div className="card overflow-x-auto rounded-[22px]">
                <table className="w-full min-w-[760px] text-sm">
                  <thead><tr className="border-b border-[#e6eaf3] text-left text-[11px] uppercase text-ink-mute">{["Candidat", "Résultats", "Projet", "Adéquation", "Financement", ""].map((h) => <th key={h} className="px-4 py-3 font-extrabold">{h}</th>)}</tr></thead>
                  <tbody>{r.data.items.map((x) => (
                    <tr key={x.id} className="border-b border-[#eef1f8] last:border-0 hover:bg-brand-50/40">
                      <td className="px-4 py-3"><b>{x.candidat.firstName} {x.candidat.lastName[0]}.</b> <span className="text-xs text-ink-mute">· {x.candidat.pays}</span><span className="block text-xs text-ink-mute">{x.programme}</span></td>
                      <td className="px-4 py-3">{x.resultats.moyenne != null ? <><b className="text-base">{x.resultats.moyenne.toLocaleString("fr-FR")}</b><span className="text-xs text-ink-mute">/20</span>{x.resultats.verifiee && <ShieldCheck size={13} className="ml-1 inline text-[#0f8a46]" aria-label="Vérifiée" />}</> : <span className="text-ink-mute">—</span>}<span className="block text-xs text-ink-mute">{[x.resultats.serie, x.resultats.mention].filter(Boolean).join(" · ")}</span></td>
                      <td className="px-4 py-3">{x.projet.metiers[0] ?? x.projet.domaine ?? <span className="text-ink-mute">—</span>}<span className="block text-xs text-ink-mute">{[x.projet.domaine, x.projet.rentree && `rentrée ${x.projet.rentree}`].filter(Boolean).join(" · ")}</span></td>
                      <td className="px-4 py-3"><span className="flex items-center gap-2"><span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e6eaf3]"><span className="block h-full rounded-full bg-brand-600" style={{ width: `${x.score}%` }} /></span><b>{x.score} %</b></span></td>
                      <td className="px-4 py-3"><Chip tone={tone[x.financement.statut]}>{x.financement.libelle}</Chip><span className="mt-1 block text-xs text-ink-mute">{x.financement.preuve}</span></td>
                      <td className="px-4 py-3"><Link href={link(`/etablissement/candidatures/${x.id}`)} aria-label="Ouvrir le dossier" className="text-ink-mute hover:text-brand-600"><ChevronRight size={18} /></Link> <StatusBadge status={x.status} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            <Alert tone="warn" title="Financement">« Couvert » : budget déclaré au moins égal au coût annuel estimé ET pièce vérifiée (garant ou justificatif). Le montant exact des ressources n&apos;est jamais montré à l&apos;école.</Alert>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Vivier
type Profil = { ref: string; statut: string; pays: string; bac: string | null; moyenne: string | null; moyenneVerifiee: boolean; projet: string | null; budget: string | null; couvre: boolean; villes: string[]; rentree: number | null; financement: string | null; interesse: boolean; dejaContacte: boolean };
type Vivier = { stats: { visibles: number; correspondants: number; budgetCouvre: number; moyenneMediane: number | null; interesses: number }; profils: Profil[] };
export type Criteres = { pays?: string[]; domaines?: string[]; moyenneMin?: number; budgetCouvre?: boolean; rentree?: number; villes?: string[]; refs?: string[] };
const AN = new Date().getFullYear();
const CLE = "ng_prospection_cible";

export function VivierCandidats() {
  const { eid, link } = useEcole();
  const st = usePremium();
  const [c, setC] = useState<Criteres>({ moyenneMin: 12 });
  const [data, setData] = useState<Vivier | null>(null);
  const a = useAction();
  const charger = (x: Criteres) => a.run(async () => setData(await api<Vivier>(`/ecole/${eid}/vivier`, { body: x })));
  useEffect(() => { if (st.data?.premium) charger(c); }, [st.data?.premium]); // eslint-disable-line react-hooks/exhaustive-deps
  if (st.loading) return <Loading />;
  if (!st.data?.premium) return <OffrePremium fonction="Vivier de candidats" />;
  const campagne = (refs?: string[]) => { try { sessionStorage.setItem(CLE, JSON.stringify(refs ? { refs } : c)); } catch { /* ignore */ } location.href = link("/etablissement/prospection?nouvelle=1"); };
  return (
    <>
      <PageHeader title="Vivier de candidats" badge={<PremiumBadge />} sub={data ? `${nf(data.stats.visibles)} élève${data.stats.visibles > 1 ? "s" : ""} et étudiant${data.stats.visibles > 1 ? "s" : ""} ont choisi d'être visibles des écoles · noms et coordonnées masqués jusqu'à leur réponse` : undefined}
        actions={data && data.stats.correspondants > 0 && <Button icon={Megaphone} onClick={() => campagne()}>Créer une campagne ({nf(data.stats.correspondants)} profil{data.stats.correspondants > 1 ? "s" : ""})</Button>} />
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Field label="Pays">{(id) => <Select id={id} value={c.pays?.[0] ?? ""} onChange={(e) => setC({ ...c, pays: e.target.value ? [e.target.value] : undefined })} options={[["", "Tous"], ...PAYS_OPTIONS.map((o) => [o.value, o.label] as [string, string])]} />}</Field>
          <Field label="Domaine">{(id) => <Select id={id} value={c.domaines?.[0] ?? ""} onChange={(e) => setC({ ...c, domaines: e.target.value ? [e.target.value] : undefined })} options={[["", "Tous"], ...DOMAINES]} />}</Field>
          <Field label="Moyenne minimale">{(id) => <Select id={id} value={String(c.moyenneMin ?? 0)} onChange={(e) => setC({ ...c, moyenneMin: Number(e.target.value) || undefined })} options={[["0", "Toutes"], ...[10, 11, 12, 13, 14, 15, 16].map((n) => [String(n), `≥ ${n}/20`] as [string, string])]} />}</Field>
          <Field label="Rentrée">{(id) => <Select id={id} value={String(c.rentree ?? "")} onChange={(e) => setC({ ...c, rentree: Number(e.target.value) || undefined })} options={[["", "Toutes"], ...[AN, AN + 1, AN + 2].map((n) => [String(n), String(n)] as [string, string])]} />}</Field>
          <Field label="Ville souhaitée">{(id) => <Select id={id} value={c.villes?.[0] ?? ""} onChange={(e) => setC({ ...c, villes: e.target.value ? [e.target.value] : undefined })} options={[["", "Toutes"], ...VILLES_ETUDES.map((v) => [v, v] as [string, string])]} />}</Field>
          <div className="flex flex-col justify-end gap-2"><CheckBox checked={!!c.budgetCouvre} onChange={(v) => setC({ ...c, budgetCouvre: v || undefined })}>Budget ≥ vos frais</CheckBox><Button size="sm" loading={a.pending} onClick={() => charger(c)}>Rechercher</Button></div>
        </div>
      </Panel>
      <FormError error={a.error} />
      {data && (
        <div className="mt-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Profils correspondants" value={nf(data.stats.correspondants)} sub={`sur ${nf(data.stats.visibles)} visibles`} />
            <Kpi label="Budget couvrant vos frais" value={`${data.stats.budgetCouvre} %`} tone="green" sub="budget déclaré ≥ coût estimé" />
            <Kpi label="Moyenne médiane" value={data.stats.moyenneMediane != null ? data.stats.moyenneMediane.toLocaleString("fr-FR") : "—"} tone="violet" sub="sur 20" />
            <Kpi label="Déjà intéressés par vous" value={nf(data.stats.interesses)} tone="sun" sub="école en favori" />
          </div>
          {!data.profils.length ? <Empty icon={Users} title="Aucun profil ne correspond" text="Élargissez vos critères." /> : (
            <div className="grid gap-4 lg:grid-cols-2">
              {data.profils.map((p) => (
                <article key={p.ref} className="card flex flex-col gap-3 rounded-[20px] p-4">
                  <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><UserRound size={18} /></span>
                    <span className="min-w-0 flex-1"><b className="block">{p.statut} · {p.pays}</b><span className="text-xs text-ink-mute">{p.bac ?? "Bac non renseigné"}</span></span>
                    {p.interesse && <Chip tone="sun">Intéressé par vous</Chip>}{p.dejaContacte && <Chip tone="grey">Contacté (30 j)</Chip>}</div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                    {[["Moyenne", p.moyenne ? `${p.moyenne}/20${p.moyenneVerifiee ? " ✓" : ""}` : "—"], ["Projet", p.projet ?? "—"], ["Budget annuel", p.budget ? `${p.budget}${p.couvre ? " · couvre vos frais" : ""}` : "—"], ["Villes souhaitées", p.villes.join(", ") || "—"], ["Financement", p.financement ?? "—"], ["Rentrée", p.rentree ? String(p.rentree) : "—"]].map(([k, v]) => (
                      <div key={k}><dt className="text-xs text-ink-mute">{k}</dt><dd className="font-bold">{v}</dd></div>
                    ))}
                  </dl>
                  <Button size="sm" icon={Send} disabled={p.dejaContacte} onClick={() => campagne([p.ref])}>Inviter à candidater</Button>
                </article>
              ))}
            </div>
          )}
          <Alert tone="info">Seuls les élèves qui ont activé « Être visible des établissements » apparaissent (avec l&apos;accord d&apos;un parent pour les mineurs). Leur nom n&apos;est révélé que s&apos;ils acceptent votre invitation.</Alert>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Prospection
type Campagne = { id: string; subject: string; offreLibelle: string; status: "en_validation" | "validee" | "refusee" | "envoyee"; reviewNote: string | null; audience: number; createdAt: string; sentAt: string | null;
  stats: { envoyes: number; lus: number; interesses: number; refus: number; candidatures: number }; interesses: { nom: string; pays: string; conversation: string | null }[] };
const OFFRES: [string, string][] = [["candidature", "Invitation à candidater"], ["portes_ouvertes", "Journée portes ouvertes"], ["bourse", "Bourse ou réduction"], ["concours", "Concours d'entrée"]];
const ETAT: Record<Campagne["status"], [string, "sun" | "green" | "rose" | "blue"]> = { en_validation: ["En relecture Navigoal", "sun"], validee: ["Validée", "blue"], envoyee: ["Envoyée", "green"], refusee: ["Non validée", "rose"] };

export function Prospection() {
  const { eid, etab } = useEcole();
  const toast = useToast();
  const st = usePremium();
  const list = useApi<{ creditsRestants: number; items: Campagne[] }>(st.data?.premium ? `/ecole/${eid}/prospections` : null);
  const [cible, setCible] = useState<Criteres | null>(null);
  const [aud, setAud] = useState<{ audience: number; mineurs: number; creditsRestants: number } | null>(null);
  const [form, setForm] = useState({ offer: "candidature", subject: "", body: "", link: `/etablissements/${eid}/` });
  const a = useAction();
  useEffect(() => {
    if (!st.data?.premium) return;
    let c: Criteres | null = null;
    try { const v = sessionStorage.getItem(CLE); if (v) c = JSON.parse(v); } catch { /* ignore */ }
    if (c || new URLSearchParams(location.search).get("nouvelle")) setCible(c ?? {});
  }, [st.data?.premium]);
  useEffect(() => { if (cible) api<typeof aud>(`/ecole/${eid}/prospections/audience`, { body: cible }).then(setAud).catch(() => setAud(null)); }, [cible, eid]);
  if (st.loading) return <Loading />;
  if (!st.data?.premium) return <OffrePremium fonction="Campagnes de prospection" />;
  const envoyer = () => a.run(async () => {
    await api(`/ecole/${eid}/prospections`, { body: { ...form, link: form.link || null, criteria: cible ?? {} } });
    try { sessionStorage.removeItem(CLE); } catch { /* ignore */ }
    setCible(null); setForm({ ...form, subject: "", body: "" }); list.reload(); toast("Campagne envoyée pour relecture à l'équipe Navigoal");
  });
  const resume = cible ? [cible.refs?.length ? `${cible.refs.length} profil${cible.refs.length > 1 ? "s" : ""} choisi${cible.refs.length > 1 ? "s" : ""}` : null, cible.pays?.join(", "), cible.domaines?.map((d) => DOMAINES.find(([k]) => k === d)?.[1]).join(", "), cible.moyenneMin && `moyenne ≥ ${cible.moyenneMin}`, cible.budgetCouvre && "budget ≥ vos frais", cible.rentree && `rentrée ${cible.rentree}`, cible.villes?.join(", ")].filter(Boolean) : [];
  return (
    <>
      <PageHeader title="Prospection" badge={<PremiumBadge />} sub="Les messages arrivent dans l'espace Navigoal des élèves (avec un e-mail de notification), jamais dans leur boîte personnelle."
        actions={!cible && <Link href="/etablissement/vivier" className="btn-primary"><Megaphone size={17} />Nouvelle campagne depuis le vivier</Link>} />
      {cible && (
        <div className="mb-6 grid items-start gap-5 xl:grid-cols-[1fr_380px]">
          <Panel title="Nouvelle campagne" icon={Megaphone}>
            <div><b className="text-[13px]">1 · Cible</b><div className="mt-2 flex flex-wrap gap-2">{resume.length ? resume.map((t) => <Chip key={String(t)}>{t}</Chip>) : <Chip tone="grey">Tout le vivier</Chip>}</div>
              {aud && <p className="mt-2 text-sm"><b>{nf(aud.audience)} profil{aud.audience > 1 ? "s" : ""}</b>{aud.mineurs ? ` · dont ${aud.mineurs} mineur${aud.mineurs > 1 ? "s" : ""} (accord parental)` : ""} <span className="text-ink-mute">· élèves contactés par votre école depuis 30 jours exclus</span></p>}</div>
            <Field label="2 · Offre">{(id) => <Select id={id} value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} options={OFFRES} />}</Field>
            <Field label="3 · Objet">{(id) => <Input id={id} value={form.subject} maxLength={120} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder={`Ex. : Bachelor à ${etab.sigle}, rentrée ${AN + 1}`} />}</Field>
            <Field label="Message" hint="20 caractères minimum. Pas de promesse que vous ne pourrez tenir : chaque campagne est relue.">{(id) => <Textarea id={id} value={form.body} maxLength={2000} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Bonjour, votre projet correspond à…" />}</Field>
            <Field label="Lien (page Navigoal de votre école ou d'une formation)">{(id) => <Input id={id} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />}</Field>
            <FormError error={a.error} />
            <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-ink-mute">Crédits : {aud ? nf(aud.creditsRestants) : "…"} envois restants ce mois · relecture Navigoal sous 24 h</span>
              <span className="flex gap-2"><Button variant="ghost" onClick={() => { setCible(null); try { sessionStorage.removeItem(CLE); } catch { /* ignore */ } }}>Annuler</Button><Button icon={Send} loading={a.pending} disabled={!aud?.audience} onClick={envoyer}>Envoyer pour validation</Button></span></div>
          </Panel>
          <div className="flex flex-col gap-2"><b className="text-[12px] uppercase text-ink-mute">Aperçu côté élève</b>
            <div className="card flex flex-col gap-3 rounded-[20px] p-4">
              <div className="flex items-center gap-3">{etab.logo && <img src={etab.logo} alt="" className="h-10 w-10 rounded-xl border border-slate-100 object-contain" />}<span><b className="block text-sm">{etab.nom}</b><span className="text-xs text-ink-mute">{OFFRES.find(([k]) => k === form.offer)?.[1]}</span></span></div>
              <b className="text-sm">{form.subject || "Objet de votre message"}</b>
              <p className="whitespace-pre-wrap text-[13px] text-ink-soft">{form.body || "Votre message apparaîtra ici."}</p>
              <div className="flex gap-2"><span className="btn-primary flex-1 px-3 py-2 text-[13px]">Ça m&apos;intéresse</span><span className="btn-ghost px-3 py-2 text-[13px]">Non merci</span></div>
              <p className="text-[11px] text-ink-mute">Pourquoi je reçois ce message ? · Ne plus être contacté par les écoles</p>
            </div>
          </div>
        </div>
      )}
      {list.loading ? <Loading /> : !list.data?.items.length ? (!cible && <Empty icon={Megaphone} title="Aucune campagne pour l'instant" text="Choisissez des profils dans le vivier, puis rédigez votre invitation." action={<Link href="/etablissement/vivier" className="btn-primary">Ouvrir le vivier</Link>} />) : (
        <div className="flex flex-col gap-4">
          {list.data.items.map((c) => (
            <Panel key={c.id} title={c.subject} icon={Megaphone} action={<Chip tone={ETAT[c.status][1]}>{ETAT[c.status][0]}</Chip>}>
              <p className="text-xs text-ink-mute">{c.offreLibelle} · créée le {dateFr(c.createdAt)}{c.sentAt ? ` · envoyée le ${dateFr(c.sentAt)}` : ` · cible : ${nf(c.audience)} profils`}</p>
              {c.reviewNote && <Alert tone={c.status === "refusee" ? "error" : "info"} title="Note de l'équipe Navigoal">{c.reviewNote}</Alert>}
              {c.status === "envoyee" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[["Envoyés", c.stats.envoyes], ["Lus", c.stats.lus], ["Intéressés", c.stats.interesses], ["Candidatures", c.stats.candidatures], ["Non merci", c.stats.refus]].map(([k, v]) => <div key={k as string} className="rounded-2xl bg-[#f6f8fe] p-3"><span className="text-xs text-ink-mute">{k}</span><b className="block text-xl">{nf(v as number)}</b></div>)}
                </div>
              )}
              {!!c.interesses.length && <div className="flex flex-col gap-2"><b className="text-[13px]">Élèves intéressés (profil révélé)</b>
                {c.interesses.map((x) => <div key={x.nom + x.conversation} className="flex items-center justify-between rounded-xl bg-[#effbf3] px-3 py-2 text-sm"><span><b>{x.nom}</b> · {x.pays}</span>{x.conversation && <Link href={`/messages/${x.conversation}`} className="font-bold text-brand-600">Écrire <ChevronRight size={14} className="inline" /></Link>}</div>)}</div>}
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

/** Sélecteur Liste / Sélection Premium en tête de la page Candidatures. */
export function VueCandidatures({ liste }: { liste: React.ReactNode }) {
  const [vue, setVue] = useState<"liste" | "selection">("liste");
  useEffect(() => { if (new URLSearchParams(location.search).get("vue") === "selection") setVue("selection"); }, []);
  return (
    <>
      <div className="mb-4 flex gap-2">
        <button onClick={() => setVue("liste")} className={`chip px-3.5 py-2 ${vue === "liste" ? "bg-brand-600 text-white" : "bg-white text-ink-soft"}`}>Toutes les candidatures</button>
        <button onClick={() => setVue("selection")} className={`chip gap-1.5 px-3.5 py-2 ${vue === "selection" ? "bg-brand-600 text-white" : "bg-white text-ink-soft"}`}><Bookmark size={14} />Sélection : résultats, projet, financement <PremiumBadge /></button>
      </div>
      {vue === "liste" ? liste : <SelectionPremium />}
    </>
  );
}

