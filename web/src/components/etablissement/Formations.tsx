"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BadgeInfo, CalendarDays, CheckCircle2, GraduationCap, Link2, ListChecks, Plus, Search, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Chip, Empty, Loading, PageHeader, money, useToast } from "@/components/app/kit";
import { Check, Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api, ApiError } from "@/lib/api";
import { formationById, formations, metierById, series } from "@/lib/data";
import { useEcole } from "./EcoleContext";
import { ChipPicker, PAYS_LABEL, SCHOOL_DOC_TYPES, SubTitle, Toggle, clean, type Program } from "./shared";

type FormState = {
  formationId: string; title: string; description: string; durationYears: string; language: string;
  tuitionMin: string; tuitionMax: string; currency: string; applicationFee: string;
  series: string[]; noteMin: string; concours: boolean; entretien: boolean; prerequis: string;
  requiredDocuments: string[]; seats: string; startDate: string; active: boolean;
};
const CURRENCY: Record<string, string> = { MA: "MAD", GA: "XAF", SN: "XOF" };
const LANGS: [string, string][] = [["fr", "Français"], ["en", "Anglais"], ["fr-en", "Français / anglais"], ["ar", "Arabe"], ["fr-ar", "Français / arabe"]];
const FORMATION_OPTIONS: [string, string][] = [...formations].sort((a, b) => a.intitule.localeCompare(b.intitule, "fr")).map((f) => [f.id, `${f.intitule} · ${f.diplome}`]);
const DOCS = SCHOOL_DOC_TYPES.filter(([v]) => !["attestation_admission", "piece_garant", "justificatif_ressources"].includes(v));

const s = (n: number | null | undefined) => (n == null ? "" : String(n));
function toForm(p: Program | null, pays: string): FormState {
  return {
    formationId: p?.formationId ?? "", title: p?.title ?? "", description: p?.description ?? "", durationYears: s(p?.durationYears), language: p?.language ?? "fr",
    tuitionMin: s(p?.tuitionMin), tuitionMax: s(p?.tuitionMax), currency: p?.currency ?? CURRENCY[pays] ?? "XAF", applicationFee: p ? s(p.applicationFee) : "0",
    series: p?.admission.series ?? [], noteMin: s(p?.admission.noteMin), concours: !!p?.admission.concours, entretien: !!p?.admission.entretien, prerequis: p?.admission.prerequis ?? "",
    requiredDocuments: p?.requiredDocuments ?? ["identite", "releve_notes", "diplome", "photo"], seats: s(p?.seats), startDate: p?.startDate ?? "", active: p?.active ?? true,
  };
}
const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(/\s/g, "").replace(",", ".")));
function toPayload(f: FormState) {
  return {
    ...clean({ formationId: f.formationId, title: f.title.trim(), description: f.description.trim(), language: f.language, currency: f.currency, startDate: f.startDate.trim() }),
    durationYears: num(f.durationYears), tuitionMin: num(f.tuitionMin), tuitionMax: num(f.tuitionMax), applicationFee: num(f.applicationFee) ?? 0, seats: num(f.seats),
    admission: { ...clean({ prerequis: f.prerequis.trim() }), series: f.series, noteMin: num(f.noteMin), concours: f.concours, entretien: f.entretien },
    requiredDocuments: f.requiredDocuments, active: f.active,
  };
}
/** Charge utile complète à partir d'une formation existante (bascule « active » depuis la liste). */
const programPayload = (p: Program, active: boolean) => ({ ...toPayload(toForm(p, "")), currency: p.currency ?? undefined, active });

function validate(f: FormState) {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (!f.formationId) e.formationId = "Choisissez la formation type du référentiel.";
  if (f.title.trim().length < 3) e.title = "Intitulé trop court (3 caractères minimum).";
  const d = num(f.durationYears);
  if (d !== undefined && (!Number.isInteger(d) || d < 1 || d > 8)) e.durationYears = "Entre 1 et 8 ans.";
  for (const k of ["tuitionMin", "tuitionMax", "applicationFee", "seats"] as const) { const v = num(f[k]); if (v !== undefined && (isNaN(v) || v < 0 || !Number.isInteger(v))) e[k] = "Nombre entier positif attendu."; }
  const mi = num(f.tuitionMin), ma = num(f.tuitionMax);
  if (!e.tuitionMax && mi !== undefined && ma !== undefined && mi > ma) e.tuitionMax = "Doit être supérieur au minimum.";
  const n = num(f.noteMin);
  if (n !== undefined && (isNaN(n) || n < 0 || n > 20)) e.noteMin = "Note sur 20.";
  return e;
}

export function Formations() {
  const { eid, etab } = useEcole();
  const toast = useToast();
  const r = useApi<Program[]>(`/ecole/${eid}/formations`);
  const [sel, setSel] = useState<string | "new" | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const items = useMemo(() => (r.data ?? []).filter((p) => !q.trim() || p.title.toLowerCase().includes(q.trim().toLowerCase())), [r.data, q]);
  const current = sel === "new" ? null : (r.data ?? []).find((p) => p.id === sel) ?? null;
  const editing = sel === "new" || !!current;
  const actives = (r.data ?? []).filter((p) => p.active).length;

  // Sur grand écran, ouvrir la première formation par défaut.
  useEffect(() => { if (sel === null && r.data?.length && window.matchMedia("(min-width: 1024px)").matches) setSel(r.data[0].id); }, [r.data, sel]);

  const toggle = async (p: Program, v: boolean) => {
    setBusy(p.id);
    try {
      const u = await api<Program>(`/ecole/${eid}/formations/${p.id}`, { method: "PATCH", body: programPayload(p, v) });
      r.setData((l) => l?.map((x) => (x.id === u.id ? u : x)));
      toast(v ? "Formation publiée." : "Formation masquée des candidats.");
    } catch (e) { toast(e instanceof ApiError ? e.message : "Échec de la mise à jour.", "error"); } finally { setBusy(null); }
  };
  const saved = (p: Program, created: boolean) => {
    r.setData((l) => (created ? [...(l ?? []), p] : l?.map((x) => (x.id === p.id ? p : x))));
    setSel(p.id);
    toast(created ? "Formation créée et publiée." : "Formation enregistrée.");
  };

  return (
    <>
      <PageHeader title="Formations" sub={r.data ? `${actives} formation${actives > 1 ? "s" : ""} publiée${actives > 1 ? "s" : ""} sur Navigoal · rattachées au référentiel` : "Vos programmes publiés sur Navigoal"}
        actions={<Button icon={Plus} onClick={() => setSel("new")} className="!bg-[#6a3df0] hover:!bg-[#5a2fe0]">Nouvelle formation</Button>} />
      {r.loading ? <Loading /> : r.error ? <Alert tone="error" action={<Button size="sm" variant="ghost" onClick={r.reload}>Réessayer</Button>}>{r.error.message}</Alert> : (
        <div className="grid items-start gap-5 lg:grid-cols-[340px_1fr] [&>*]:min-w-0">
          <div className={`flex flex-col gap-3 ${editing ? "hidden lg:flex" : ""}`}>
            <div className="relative"><Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher" aria-label="Rechercher une formation" className="pl-11" /></div>
            {!r.data?.length ? <Empty icon={GraduationCap} title="Aucune formation publiée" text="Publiez vos programmes pour recevoir des candidatures." action={<Button size="sm" icon={Plus} onClick={() => setSel("new")}>Créer une formation</Button>} />
              : !items.length ? <p className="py-6 text-center text-sm text-ink-mute">Aucune formation ne correspond.</p>
              : items.map((p) => {
                const f = formationById[p.formationId];
                const on = sel === p.id;
                return (
                  <motion.div layout key={p.id} role="button" tabIndex={0} onClick={() => setSel(p.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSel(p.id))} aria-current={on || undefined}
                    className={`card flex cursor-pointer flex-col gap-2 rounded-[18px] p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e3dbff] ${on ? "border-2 border-[#6a3df0]" : "hover:border-[#d9cffd]"} ${p.active ? "" : "opacity-75"}`}>
                    <div className="flex items-start justify-between gap-3"><b className="text-[15px] leading-snug">{p.title}</b><Toggle size="sm" checked={p.active} disabled={busy === p.id} onChange={(v) => toggle(p, v)} label={`${p.active ? "Masquer" : "Publier"} ${p.title}`} /></div>
                    <div className="flex flex-wrap gap-1.5">
                      {f && <Chip tone="violet">{f.diplome}</Chip>}
                      {p.durationYears && <Chip tone="grey">{p.durationYears} an{p.durationYears > 1 ? "s" : ""}</Chip>}
                      {p.indicative && <Chip tone="sun"><BadgeInfo size={12} />Offre indicative à confirmer</Chip>}
                    </div>
                    <span className="text-xs text-ink-mute">{p.active ? "Publiée" : "Masquée"}{p.startDate ? ` · rentrée ${p.startDate}` : ""}{p.tuitionMin || p.tuitionMax ? ` · ${money(p.tuitionMin ?? p.tuitionMax, p.currency)}${p.tuitionMax && p.tuitionMin !== p.tuitionMax ? ` – ${money(p.tuitionMax, p.currency)}` : ""}` : ""}</span>
                  </motion.div>
                );
              })}
          </div>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key={sel} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <ProgramForm program={current} eid={eid} pays={etab.pays} taken={(r.data ?? []).filter((x) => x.id !== current?.id).map((x) => x.formationId)} onBack={() => setSel(null)} onSaved={saved} />
              </motion.div>
            ) : (
              <div className="hidden lg:block"><Empty icon={GraduationCap} title="Sélectionnez une formation" text="Choisissez une formation dans la liste pour la modifier, ou créez-en une nouvelle." /></div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
}

function ProgramForm({ program, eid, pays, taken, onBack, onSaved }: { program: Program | null; eid: string; pays: string; taken: string[]; onBack: () => void; onSaved: (p: Program, created: boolean) => void }) {
  const [f, setF] = useState<FormState>(() => toForm(program, pays));
  const [errs, setErrs] = useState<Partial<Record<keyof FormState, string>>>({});
  const [others, setOthers] = useState(() => f.series.some((x) => !x.startsWith(pays.toLowerCase() + "-")));
  const act = useAction();
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => { setF((x) => ({ ...x, [k]: v })); setErrs((e) => ({ ...e, [k]: undefined })); };
  const ref = formationById[f.formationId];

  const chooseFormation = (id: string) => {
    const fr = formationById[id];
    setF((x) => ({
      ...x, formationId: id,
      title: x.title || fr?.intitule || "",
      durationYears: x.durationYears || (fr ? String(fr.duree_annees) : ""),
      series: x.series.length ? x.series : Object.values(fr?.series_recommandees ?? {}).flat() as string[],
      concours: x.concours || fr?.mode_admission === "concours",
    }));
    setErrs((e) => ({ ...e, formationId: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(f);
    if (!v.formationId && taken.includes(f.formationId)) v.formationId = "Vous publiez déjà une formation rattachée à ce type : modifiez-la plutôt.";
    setErrs(v);
    if (Object.keys(v).length) { act.setError("Vérifiez les champs signalés."); return; }
    const body = toPayload(f);
    const p = await act.run(() => program ? api<Program>(`/ecole/${eid}/formations/${program.id}`, { method: "PATCH", body }) : api<Program>(`/ecole/${eid}/formations`, { body }));
    if (p) onSaved(p, !program);
  };

  const countries = [pays, ...Object.keys(PAYS_LABEL).filter((c) => c !== pays)];
  return (
    <form onSubmit={submit} noValidate className="card flex flex-col gap-6 rounded-[22px] p-5 sm:p-7">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 self-start text-sm font-bold text-[#6a3df0] lg:hidden"><ArrowLeft size={16} />Toutes les formations</button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-extrabold">{program ? "Modifier la formation" : "Nouvelle formation"}</h2>
          <span className="text-[13px] text-ink-mute">{program ? `Dernière modification le ${new Date(program.updatedAt).toLocaleDateString("fr-FR")}` : "Elle sera visible des candidats dès l'enregistrement si elle est active."}</span>
          {program?.indicative && <Chip tone="sun" className="mt-1 self-start"><BadgeInfo size={12} />Offre indicative à confirmer · l&apos;enregistrement la confirme</Chip>}
        </div>
        <label className="flex items-center gap-3 text-sm font-bold">{f.active ? "Active" : "Masquée"}<Toggle checked={f.active} onChange={(v) => set("active", v)} label="Formation active" /></label>
      </div>

      <section className="flex flex-col gap-4">
        <SubTitle icon={<Link2 size={16} />}>Rattachement au référentiel</SubTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Formation type (référentiel Navigoal)" required error={errs.formationId} hint="Relie automatiquement métiers, compétences et séries recommandées.">
            {(id) => <Select id={id} value={f.formationId} onChange={(e) => chooseFormation(e.target.value)} options={FORMATION_OPTIONS} placeholder="Choisir…" aria-invalid={!!errs.formationId} />}
          </Field>
          <Field label="Intitulé affiché" required error={errs.title}>{(id) => <Input id={id} value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={200} aria-invalid={!!errs.title} />}</Field>
        </div>
        {ref && ref.metiers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#f6f8fe] px-4 py-3 text-xs"><span className="font-bold text-ink-mute">Métiers liés :</span>{ref.metiers.slice(0, 6).map((m) => <span key={m} className="rounded-full bg-white px-2.5 py-1 font-semibold text-ink-soft">{metierById[m]?.nom ?? m}</span>)}</div>
        )}
        <Field label="Description">{(id) => <Textarea id={id} value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={4000} placeholder="Objectifs, points forts, débouchés, partenariats…" />}</Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Durée (années)" error={errs.durationYears}>{(id) => <Input id={id} inputMode="numeric" value={f.durationYears} onChange={(e) => set("durationYears", e.target.value)} />}</Field>
          <Field label="Langue d'enseignement">{(id) => <Select id={id} value={f.language} onChange={(e) => set("language", e.target.value)} options={LANGS} />}</Field>
          <Field label="Rentrée" hint="Ex. : septembre 2027">{(id) => <Input id={id} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} maxLength={40} />}</Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SubTitle icon={<Wallet size={16} />}>Frais</SubTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Scolarité min / an" error={errs.tuitionMin}>{(id) => <Input id={id} inputMode="numeric" value={f.tuitionMin} onChange={(e) => set("tuitionMin", e.target.value)} />}</Field>
          <Field label="Scolarité max / an" error={errs.tuitionMax}>{(id) => <Input id={id} inputMode="numeric" value={f.tuitionMax} onChange={(e) => set("tuitionMax", e.target.value)} />}</Field>
          <Field label="Devise">{(id) => <Select id={id} value={f.currency} onChange={(e) => set("currency", e.target.value)} options={[["MAD", "MAD"], ["XAF", "F CFA (XAF)"], ["XOF", "F CFA (XOF)"], ["EUR", "EUR"]]} />}</Field>
          <Field label="Frais de dossier" error={errs.applicationFee} hint="0 = gratuit">{(id) => <Input id={id} inputMode="numeric" value={f.applicationFee} onChange={(e) => set("applicationFee", e.target.value)} />}</Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SubTitle icon={<ListChecks size={16} />}>Conditions d&apos;admission</SubTitle>
        <div className="flex flex-col gap-3">
          {countries.filter((c, i) => i === 0 || others).map((c) => (
            <div key={c} className="grid gap-2 sm:grid-cols-[90px_1fr] sm:items-start">
              <b className="pt-1.5 text-sm">{PAYS_LABEL[c] ?? c}</b>
              <ChipPicker label={`Séries acceptées · ${PAYS_LABEL[c] ?? c}`} value={f.series} onChange={(v) => set("series", v)} options={series.filter((x) => x.pays === c).map((x) => [x.id, x.code])} />
            </div>
          ))}
          <button type="button" onClick={() => setOthers(!others)} className="self-start text-[13px] font-bold text-[#6a3df0] hover:underline">{others ? "Masquer les séries des autres pays" : "Ajouter des séries d'autres pays (candidats internationaux)"}</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <Field label="Note minimale (/20)" error={errs.noteMin} hint="Moyenne générale de terminale">{(id) => <Input id={id} inputMode="decimal" value={f.noteMin} onChange={(e) => set("noteMin", e.target.value)} />}</Field>
          <fieldset className="flex flex-col gap-2"><legend className="mb-1.5 text-[13px] font-bold">Épreuves</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <label className="flex items-center gap-2.5 text-sm"><Toggle size="sm" checked={f.concours} onChange={(v) => set("concours", v)} label="Concours écrit" />Concours écrit</label>
              <label className="flex items-center gap-2.5 text-sm"><Toggle size="sm" checked={f.entretien} onChange={(v) => set("entretien", v)} label="Entretien" />Entretien</label>
            </div>
          </fieldset>
        </div>
        <Field label="Prérequis" hint="Niveau de langue, diplôme antérieur, expérience…">{(id) => <Textarea id={id} value={f.prerequis} onChange={(e) => set("prerequis", e.target.value)} maxLength={1000} className="min-h-[80px]" />}</Field>
        <fieldset><legend className="mb-2 text-[13px] font-bold">Pièces requises</legend>
          <div className="grid gap-2 sm:grid-cols-2">{DOCS.map(([v, l]) => <Check key={v} checked={f.requiredDocuments.includes(v)} onChange={(c) => set("requiredDocuments", c ? [...f.requiredDocuments, v] : f.requiredDocuments.filter((x) => x !== v))}>{l}</Check>)}</div>
        </fieldset>
      </section>

      <section className="flex flex-col gap-4">
        <SubTitle icon={<CalendarDays size={16} />}>Places</SubTitle>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Nombre de places" error={errs.seats}>{(id) => <Input id={id} inputMode="numeric" value={f.seats} onChange={(e) => set("seats", e.target.value)} />}</Field></div>
      </section>

      <FormError error={act.error} />
      <div className="flex flex-col-reverse gap-3 border-t border-[#eef1f8] pt-5 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="quiet" onClick={onBack}>Annuler</Button>
        <Button type="submit" icon={CheckCircle2} loading={act.pending} className="!bg-[#6a3df0] hover:!bg-[#5a2fe0]">{program ? "Enregistrer" : "Créer la formation"}</Button>
      </div>
    </form>
  );
}
