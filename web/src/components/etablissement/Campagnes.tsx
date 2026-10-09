"use client";
import { motion } from "framer-motion";
import { CalendarDays, CalendarRange, GraduationCap, Megaphone, PartyPopper, Pencil, Plus, Trophy, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Button, Chip, Dialog, Empty, Loading, PageHeader, Panel, dateFr, useToast, type Tone } from "@/components/app/kit";
import { Check, Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useEcole } from "./EcoleContext";
import { CAMPAIGN_KINDS, SCHOOL_DOC_TYPES, Toggle, campaignKindLabel, clean, type Campaign, type CampaignKind, type Program } from "./shared";

const KIND_STYLE: Record<CampaignKind, { icon: typeof Megaphone; bar: string; bg: string }> = {
  admission: { icon: Megaphone, bar: "#6a3df0", bg: "bg-[#f1edff] text-[#6a3df0]" },
  concours: { icon: Trophy, bar: "#f9a806", bg: "bg-sun-100 text-[#a55a00]" },
  inscription: { icon: GraduationCap, bar: "#1a47f5", bg: "bg-brand-50 text-brand-600" },
  bourse: { icon: Wallet, bar: "#0f8a46", bg: "bg-[#e8f8ef] text-[#0f8a46]" },
  portes_ouvertes: { icon: Users, bar: "#0e7490", bg: "bg-[#e6f6fa] text-[#0e7490]" },
  evenement: { icon: PartyPopper, bar: "#d42a50", bg: "bg-[#ffecef] text-[#d42a50]" },
};
const phase = (c: Campaign): [string, Tone] => {
  const now = Date.now();
  if (!c.published) return ["Brouillon", "grey"];
  if (new Date(c.endsAt).getTime() < now) return ["Terminée", "grey"];
  if (new Date(c.startsAt).getTime() > now) return ["Programmée", "violet"];
  return ["En cours", "green"];
};
const MONTH = (d: Date) => d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");

export function Campagnes() {
  const { eid } = useEcole();
  const toast = useToast();
  const r = useApi<Campaign[]>(`/ecole/${eid}/campagnes`);
  const progs = useApi<Program[]>(`/ecole/${eid}/formations`);
  const [edit, setEdit] = useState<Campaign | "new" | null>(null);
  const list = useMemo(() => [...(r.data ?? [])].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)), [r.data]);

  // Frise : du 1er du mois de la campagne la plus ancienne (ou aujourd'hui) à la fin du mois le plus tardif, 6 mois minimum.
  const range = useMemo(() => {
    const now = new Date();
    const starts = [now, ...list.map((c) => new Date(c.startsAt))];
    const ends = [now, ...list.map((c) => new Date(c.endsAt))];
    const a = new Date(Math.min(...starts.map(Number)));
    const from = new Date(a.getFullYear(), a.getMonth(), 1);
    const b = new Date(Math.max(...ends.map(Number)));
    let to = new Date(b.getFullYear(), b.getMonth() + 1, 1);
    if ((to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth() < 6) to = new Date(from.getFullYear(), from.getMonth() + 6, 1);
    const months: Date[] = [];
    for (let d = new Date(from); d < to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d);
    return { from: +from, to: +to, months };
  }, [list]);
  const pos = (d: string | number | Date) => Math.min(100, Math.max(0, ((+new Date(d) - range.from) / (range.to - range.from)) * 100));

  const saved = (c: Campaign, created: boolean) => {
    r.setData((l) => (created ? [...(l ?? []), c] : l?.map((x) => (x.id === c.id ? c : x))));
    setEdit(null);
    toast(created ? "Campagne créée." : "Campagne mise à jour.");
  };

  return (
    <>
      <PageHeader title="Campagnes" sub="Planifiez vos admissions, concours, bourses et événements sur Navigoal."
        actions={<Button icon={Plus} onClick={() => setEdit("new")} className="!bg-[#6a3df0] hover:!bg-[#5a2fe0]">Nouvelle campagne</Button>} />
      {r.loading ? <Loading /> : r.error ? <Alert tone="error" action={<Button size="sm" variant="ghost" onClick={r.reload}>Réessayer</Button>}>{r.error.message}</Alert> : !list.length ? (
        <Empty icon={CalendarRange} title="Aucune campagne" text="Créez une campagne d'admission pour afficher vos dates clés aux candidats et recevoir des dossiers rattachés." action={<Button size="sm" icon={Plus} onClick={() => setEdit("new")}>Créer une campagne</Button>} />
      ) : (
        <Panel title="Campagnes & événements" icon={CalendarRange}>
          <div className="hidden grid-cols-[minmax(220px,1.1fr)_2.4fr_150px] items-end gap-4 border-b border-[#eef1f8] pb-2 text-[11px] font-extrabold uppercase text-ink-mute lg:grid">
            <span>Campagne</span>
            <div className="flex">{range.months.map((m) => <span key={+m} className="flex-1 text-center">{MONTH(m)}{m.getMonth() === 0 ? ` ${m.getFullYear()}` : ""}</span>)}</div>
            <span className="text-right">Statut</span>
          </div>
          <ul className="flex flex-col">
            {list.map((c, i) => {
              const k = KIND_STYLE[c.kind];
              const [label, tone] = phase(c);
              const l = pos(c.startsAt), w = Math.max(1.6, pos(c.endsAt) - l);
              return (
                <li key={c.id} className="border-b border-[#f1f4fb] last:border-0">
                  <button onClick={() => setEdit(c)} className="grid w-full items-center gap-3 py-3.5 text-left hover:bg-[#fbfaff] lg:grid-cols-[minmax(220px,1.1fr)_2.4fr_150px] lg:gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${k.bg}`}><k.icon size={17} /></span>
                      <span className="min-w-0"><b className="block truncate text-sm">{c.title}</b><span className="text-xs text-ink-mute">{campaignKindLabel(c.kind)} · {dateFr(c.startsAt)} → {dateFr(c.endsAt)}</span></span>
                      <span className="ml-auto lg:hidden"><Chip tone={tone}>{label}</Chip></span>
                    </div>
                    <div className="relative hidden h-8 lg:block" aria-hidden>
                      <div className="absolute inset-0 flex">{range.months.map((m) => <span key={+m} className="flex-1 border-l border-[#f1f4fb] first:border-0" />)}</div>
                      <motion.span className="absolute top-1.5 h-5 rounded-full" style={{ left: `${l}%`, background: k.bar, opacity: c.published ? 1 : 0.45 }}
                        initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ delay: 0.1 + i * 0.07, duration: 0.6, ease: "easeOut" }} />
                      {<span className="absolute -bottom-3.5 -top-3.5 w-0.5 bg-[#d42a50]" style={{ left: `${pos(Date.now())}%` }} title="Aujourd'hui" />}
                    </div>
                    <div className="hidden items-center justify-end gap-2 lg:flex"><Chip tone={tone}>{label}</Chip><Pencil size={15} className="text-ink-mute" /></div>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="flex items-center gap-2 text-xs text-ink-mute"><span className="hidden h-3 w-0.5 bg-[#d42a50] lg:inline-block" /> <span className="hidden lg:inline">Aujourd&apos;hui · </span>Cliquez sur une campagne pour la modifier. Seules les campagnes publiées sont visibles des candidats.</p>
        </Panel>
      )}
      <Dialog open={!!edit} onClose={() => setEdit(null)} title={edit === "new" ? "Nouvelle campagne" : "Modifier la campagne"} wide>
        {edit && <CampaignForm key={edit === "new" ? "new" : edit.id} c={edit === "new" ? null : edit} eid={eid} programs={progs.data ?? []} onCancel={() => setEdit(null)} onSaved={saved} />}
      </Dialog>
    </>
  );
}

const day = (d: string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

function CampaignForm({ c, eid, programs, onCancel, onSaved }: { c: Campaign | null; eid: string; programs: Program[]; onCancel: () => void; onSaved: (c: Campaign, created: boolean) => void }) {
  const [f, setF] = useState({
    kind: c?.kind ?? "admission", title: c?.title ?? "", description: c?.description ?? "", startsAt: day(c?.startsAt), endsAt: day(c?.endsAt),
    programIds: c?.programIds ?? [], seats: c?.seats != null ? String(c.seats) : "", conditions: c?.conditions ?? "", requiredDocuments: c?.requiredDocuments ?? [], published: c?.published ?? false,
  });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const act = useAction();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((x) => ({ ...x, [k]: v })); setErrs((e) => ({ ...e, [k]: "" })); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (f.title.trim().length < 3) v.title = "Intitulé trop court (3 caractères minimum).";
    if (!f.startsAt) v.startsAt = "Date de début requise.";
    if (!f.endsAt) v.endsAt = "Date de fin requise.";
    else if (f.startsAt && f.endsAt <= f.startsAt) v.endsAt = "La date de fin doit suivre la date de début.";
    if (f.seats && !/^\d+$/.test(f.seats.trim())) v.seats = "Nombre entier positif attendu.";
    setErrs(v);
    if (Object.values(v).some(Boolean)) { act.setError("Vérifiez les champs signalés."); return; }
    const body = {
      ...clean({ title: f.title.trim(), description: f.description.trim(), conditions: f.conditions.trim() }),
      kind: f.kind, startsAt: new Date(`${f.startsAt}T00:00:00`).toISOString(), endsAt: new Date(`${f.endsAt}T23:59:59`).toISOString(),
      programIds: f.programIds, seats: f.seats ? Number(f.seats) : undefined, requiredDocuments: f.requiredDocuments, published: f.published,
    };
    const r = await act.run(() => c ? api<Campaign>(`/ecole/${eid}/campagnes/${c.id}`, { method: "PATCH", body }) : api<Campaign>(`/ecole/${eid}/campagnes`, { body }));
    if (r) onSaved(r, !c);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        <Field label="Type" required>{(id) => <Select id={id} value={f.kind} onChange={(e) => set("kind", e.target.value as CampaignKind)} options={CAMPAIGN_KINDS} />}</Field>
        <Field label="Intitulé" required error={errs.title}>{(id) => <Input id={id} value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={200} placeholder="Ex. : Admission 2027 · session 1" aria-invalid={!!errs.title} />}</Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Début" required error={errs.startsAt}>{(id) => <Input id={id} type="date" value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} aria-invalid={!!errs.startsAt} />}</Field>
        <Field label="Fin" required error={errs.endsAt}>{(id) => <Input id={id} type="date" value={f.endsAt} min={f.startsAt || undefined} onChange={(e) => set("endsAt", e.target.value)} aria-invalid={!!errs.endsAt} />}</Field>
        <Field label="Places" error={errs.seats}>{(id) => <Input id={id} inputMode="numeric" value={f.seats} onChange={(e) => set("seats", e.target.value)} />}</Field>
      </div>
      <Field label="Description">{(id) => <Textarea id={id} value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={4000} className="min-h-[80px]" />}</Field>
      <fieldset><legend className="mb-2 text-[13px] font-bold">Formations concernées</legend>
        {programs.length ? <div className="grid gap-2 sm:grid-cols-2">{programs.map((p) => <Check key={p.id} checked={f.programIds.includes(p.id)} onChange={(v) => set("programIds", v ? [...f.programIds, p.id] : f.programIds.filter((x) => x !== p.id))}>{p.title}</Check>)}</div>
          : <p className="text-sm text-ink-mute">Aucune formation publiée.</p>}
      </fieldset>
      <Field label="Conditions" hint="Critères, calendrier des épreuves, modalités…">{(id) => <Textarea id={id} value={f.conditions} onChange={(e) => set("conditions", e.target.value)} maxLength={2000} className="min-h-[80px]" />}</Field>
      <details className="rounded-2xl border border-slate-200 px-4 py-3">
        <summary className="cursor-pointer text-[13px] font-bold">Pièces spécifiques à la campagne ({f.requiredDocuments.length})</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{SCHOOL_DOC_TYPES.map(([v, l]) => <Check key={v} checked={f.requiredDocuments.includes(v)} onChange={(x) => set("requiredDocuments", x ? [...f.requiredDocuments, v] : f.requiredDocuments.filter((y) => y !== v))}>{l}</Check>)}</div>
      </details>
      <label className="flex items-center justify-between gap-4 rounded-2xl bg-[#f8f6ff] px-4 py-3">
        <span className="flex flex-col"><b className="text-sm">Publier la campagne</b><span className="text-xs text-ink-mute">Visible des candidats sur votre fiche et dans l&apos;agenda Navigoal.</span></span>
        <Toggle checked={f.published} onChange={(v) => set("published", v)} label="Publier la campagne" />
      </label>
      <FormError error={act.error} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="quiet" onClick={onCancel}>Annuler</Button>
        <Button type="submit" icon={CalendarDays} loading={act.pending} className="!bg-[#6a3df0] hover:!bg-[#5a2fe0]">{c ? "Enregistrer" : "Créer la campagne"}</Button>
      </div>
    </form>
  );
}
