"use client";
import { BellRing, CalendarClock, GraduationCap, House, Plus, Receipt, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, Button, Chip, Empty, Loading, PageHeader, Panel, dateFr, money, useToast } from "@/components/app/kit";
import { Check, FormError, Input, Select } from "@/components/app/form";
import { useUser } from "@/components/app/Session";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

type Prochaine = { date: string; montant: number | null; devise: string; detail: string | null } | null;
type Rappel = { id: string; type: "loyer" | "scolarite" | "autre"; libelle: string; enfantId: string | null; enfant: string | null; montant: number | null; devise: string; frequence: string; premiereEcheance: string; finLe: string | null; delaiJours: number; aussiLeJour: boolean; source: string; actif: boolean; prochaine: Prochaine };
type Suggestion = { source: "navilease" | "echeancier"; sourceId: string; type: "loyer" | "scolarite"; libelle: string; enfantId: string | null; enfant: string | null; montant: number | null; devise: string; frequence: string; premiereEcheance: string };
type Donnees = { rappels: Rappel[]; enfants: { id: string; prenom: string }[]; suggestions: Suggestion[] };

const DELAIS = [2, 3, 5, 7];
const FREQ: [string, string][] = [["mensuel", "Chaque mois"], ["trimestriel", "Chaque trimestre"], ["semestriel", "Chaque semestre"], ["annuel", "Chaque année"], ["unique", "Une seule fois"]];
const TYPES = { loyer: { l: "Loyer", I: House, c: "bg-[#ffecef] text-[#b8213f]" }, scolarite: { l: "Scolarité", I: GraduationCap, c: "bg-brand-50 text-brand-700" }, autre: { l: "Autre paiement", I: Receipt, c: "bg-sun-100 text-[#a55a00]" } };
const libFreq = (f: string) => FREQ.find(([k]) => k === f)?.[1] ?? f;
const joursAvant = (d: string) => Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`)) / 864e5);

/** Choix du délai : 2, 3, 5 ou 7 jours avant l'échéance. */
function Delais({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Me rappeler">
      {DELAIS.map((d) => <button key={d} type="button" role="radio" aria-checked={value === d} onClick={() => onChange(d)} className={`min-h-[40px] rounded-full px-4 text-sm font-bold ${value === d ? "bg-brand-600 text-white" : "bg-[#eef1f8] text-ink-soft hover:bg-brand-50"}`}>{d} jours avant</button>)}
    </div>
  );
}

const vide = { type: "loyer" as Rappel["type"], libelle: "", enfantId: "", montant: "", devise: "MAD", frequence: "mensuel", premiereEcheance: "", finLe: "", delaiJours: 3, aussiLeJour: true, source: "manuel", sourceId: "" };

/** Rappels de paiement : loyer et scolarité, même payés hors Navigoal, X jours avant chaque échéance. */
export function RappelsPaiement() {
  const u = useUser();
  const parent = u.role === "parent";
  const { data, loading, error, reload } = useApi<Donnees>("/moi/rappels-paiement");
  const [f, setF] = useState<typeof vide | null>(null);
  const a = useAction();
  const toast = useToast();
  if (loading) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur de chargement."}</Alert>;

  const enregistrer = async () => {
    if (!f) return;
    const body = { ...f, enfantId: f.enfantId || null, montant: f.montant ? Number(f.montant.replace(/\D/g, "")) : null, finLe: f.finLe || null, sourceId: f.sourceId || null };
    if (await a.run(() => api("/moi/rappels-paiement", { method: "POST", body }))) { toast(`Rappel programmé ${f.delaiJours} jours avant chaque échéance`); setF(null); reload(); }
  };
  const maj = async (r: Rappel, champs: Partial<Rappel>) => { if (await a.run(() => api(`/moi/rappels-paiement/${r.id}`, { method: "PATCH", body: champs }))) reload(); };
  const suppr = async (r: Rappel) => { if (await a.run(() => api(`/moi/rappels-paiement/${r.id}`, { method: "DELETE" }))) { toast("Rappel supprimé"); reload(); } };
  const depuis = (s: Suggestion) => setF({ ...vide, type: s.type, libelle: s.libelle + (s.enfant ? ` de ${s.enfant}` : ""), enfantId: s.enfantId ?? "", montant: s.montant ? String(s.montant) : "", devise: s.devise, frequence: s.frequence, premiereEcheance: s.premiereEcheance, source: s.source, sourceId: s.sourceId });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Rappels de paiement" sub={parent ? "Vous payez le loyer ou la scolarité de votre enfant ? Programmez un rappel quelques jours avant chaque échéance, même si le paiement se fait hors Navigoal." : "Ne laisse passer aucune échéance de loyer ou de scolarité : rappel quelques jours avant, et le jour même si tu veux."}
        crumbs={[[parent ? "Espace parent" : "Mon espace", parent ? "/parent" : "/espace"], ["Rappels de paiement"]]}
        actions={!f ? <Button icon={Plus} className="whitespace-nowrap" onClick={() => setF({ ...vide, enfantId: data.enfants.length === 1 ? data.enfants[0].id : "" })}>Nouveau rappel</Button> : undefined} />

      {!!data.suggestions.length && !f && (
        <Panel title="À suivre en un clic" icon={BellRing} tone="sun">
          <ul className="flex flex-col gap-2">{data.suggestions.map((s) => (
            <li key={s.source + s.sourceId} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-3">
              <span><b>{s.libelle}</b>{s.enfant ? ` · ${s.enfant}` : ""}<span className="block text-xs text-ink-mute">{s.source === "navilease" ? `Réservation Navilease${s.montant ? ` · ${money(s.montant, s.devise)} par mois` : ""}` : "Échéancier fixé par l'école"}</span></span>
              <Button size="sm" onClick={() => depuis(s)}>Programmer un rappel</Button>
            </li>
          ))}</ul>
        </Panel>
      )}

      {f && (
        <Panel title="Nouveau rappel" icon={CalendarClock}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Type">
              {(Object.keys(TYPES) as Rappel["type"][]).map((t) => { const T = TYPES[t]; return <button key={t} type="button" role="radio" aria-checked={f.type === t} onClick={() => setF({ ...f, type: t })} className={`flex min-h-[44px] items-center gap-2 rounded-2xl border-2 px-4 text-sm font-bold ${f.type === t ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white"}`}><T.I size={17} />{T.l}</button>; })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Nom du rappel</span><Input value={f.libelle} onChange={(e) => setF({ ...f, libelle: e.target.value })} maxLength={120} placeholder={f.type === "loyer" ? "Ex. : Loyer du studio à Casablanca" : "Ex. : Scolarité, 2e tranche"} /></label>
              {parent && data.enfants.length > 0 && <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Pour</span><Select value={f.enfantId} onChange={(e) => setF({ ...f, enfantId: e.target.value })} options={[["", "Moi-même"], ...data.enfants.map((e) => [e.id, e.prenom] as [string, string])]} aria-label="Pour" /></label>}
              <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Montant <span className="font-normal text-ink-mute">(facultatif)</span></span>
                <span className="grid grid-cols-[minmax(0,1fr)_9.5rem] gap-2"><Input inputMode="numeric" value={f.montant} onChange={(e) => setF({ ...f, montant: e.target.value.replace(/[^\d ]/g, "") })} placeholder="3 500" className="w-full" /><Select value={f.devise} onChange={(e) => setF({ ...f, devise: e.target.value })} options={[["MAD", "MAD"], ["XAF", "F CFA (XAF)"], ["XOF", "F CFA (XOF)"], ["EUR", "EUR"], ["USD", "USD"]]} aria-label="Devise" className="w-full" /></span></label>
              {f.source !== "echeancier" && <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Fréquence</span><Select value={f.frequence} onChange={(e) => setF({ ...f, frequence: e.target.value })} options={FREQ} aria-label="Fréquence" /></label>}
              {f.source !== "echeancier" && <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">{f.frequence === "unique" ? "Date du paiement" : "Date de la prochaine échéance"}</span><Input type="date" value={f.premiereEcheance} onChange={(e) => setF({ ...f, premiereEcheance: e.target.value })} />
                {f.type === "loyer" && f.frequence === "mensuel" && <span className="text-xs text-ink-mute">Le rappel revient chaque mois le même jour (ex. : le 5 si l&apos;entrée a eu lieu le 5).</span>}</label>}
              {f.source !== "echeancier" && f.frequence !== "unique" && <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Jusqu&apos;au <span className="font-normal text-ink-mute">(facultatif : fin du bail, de l&apos;année)</span></span><Input type="date" value={f.finLe} onChange={(e) => setF({ ...f, finLe: e.target.value })} /></label>}
            </div>
            {f.source === "echeancier" && <p className="rounded-2xl bg-[#f6f8fe] p-3 text-sm text-ink-soft">Les dates et les montants suivent l&apos;échéancier fixé par l&apos;école : un rappel avant chaque échéance non réglée.</p>}
            <div className="flex flex-col gap-2"><b className="text-sm">Me rappeler</b><Delais value={f.delaiJours} onChange={(d) => setF({ ...f, delaiJours: d })} />
              <Check checked={f.aussiLeJour} onChange={(v) => setF({ ...f, aussiLeJour: v })}>Et un dernier rappel le jour même</Check></div>
            <p className="text-xs text-ink-mute">Rappel par notification et par e-mail{u.email ? ` (${u.email})` : ""}.</p>
            <FormError error={a.error} />
            <div className="flex gap-2"><Button onClick={enregistrer} loading={a.pending} disabled={f.libelle.trim().length < 2 || !f.premiereEcheance}>Programmer le rappel</Button><Button variant="ghost" onClick={() => setF(null)}>Annuler</Button></div>
          </div>
        </Panel>
      )}

      {data.rappels.length ? data.rappels.map((r) => {
        const T = TYPES[r.type] ?? TYPES.autre; const j = r.prochaine ? joursAvant(r.prochaine.date) : null;
        return (
          <Panel key={r.id}>
            <div className={`flex flex-col gap-3 ${r.actif ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className="flex items-start gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${T.c}`}><T.I size={20} /></span>
                  <span><b className="block text-[17px]">{r.libelle}</b><span className="text-sm text-ink-mute">{[r.enfant ? `Pour ${r.enfant}` : null, r.source === "echeancier" ? "Échéancier de l'école" : libFreq(r.frequence), r.montant ? money(r.montant, r.devise) : null].filter(Boolean).join(" · ")}</span></span></span>
                {r.prochaine ? <Chip tone={j !== null && j <= r.delaiJours ? "sun" : "blue"}>Prochaine échéance : {dateFr(r.prochaine.date)}{j !== null ? ` (${j === 0 ? "aujourd'hui" : `dans ${j} j`})` : ""}</Chip> : <Chip tone="grey">Plus d&apos;échéance à venir</Chip>}
              </div>
              {r.prochaine?.detail && <span className="text-sm text-ink-soft">{r.prochaine.detail}{r.prochaine.montant ? ` · ${money(r.prochaine.montant, r.prochaine.devise)}` : ""}</span>}
              <div className="flex flex-col gap-2"><span className="text-sm font-bold">Me rappeler</span><Delais value={r.delaiJours} onChange={(d) => maj(r, { delaiJours: d })} />
                <Check checked={r.aussiLeJour} onChange={(v) => maj(r, { aussiLeJour: v })}>Et le jour même</Check></div>
              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-3">
                <Button size="sm" variant="ghost" onClick={() => maj(r, { actif: !r.actif })}>{r.actif ? "Mettre en pause" : "Réactiver"}</Button>
                <button type="button" onClick={() => suppr(r)} className="flex items-center gap-1 text-sm font-bold text-[#b8213f]"><Trash2 size={15} />Supprimer</button>
              </div>
            </div>
          </Panel>
        );
      }) : !f && <Empty icon={BellRing} title="Aucun rappel pour l'instant" text={parent ? "Ajoutez la date du loyer ou de la scolarité de votre enfant : vous serez prévenu 2, 3, 5 ou 7 jours avant, comme vous le souhaitez." : "Ajoute la date de ton loyer ou de tes frais de scolarité : tu seras prévenu à l'avance."} action={<Button icon={Plus} onClick={() => setF({ ...vide, enfantId: data.enfants.length === 1 ? data.enfants[0].id : "" })}>Programmer un rappel</Button>} />}
      <FormError error={!f ? a.error : null} />
    </div>
  );
}
