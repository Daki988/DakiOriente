"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, CalendarClock, CheckCircle2, Clock, Headset, History, Inbox, MessageCircle, Phone, Video, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, Button, Chip, Dialog, Empty, Kpi, Loading, Panel, StatusBadge, Tabs, dateFr, since, useToast } from "@/components/app/kit";
import { Field, FormError, Textarea } from "@/components/app/form";
import { useUser } from "@/components/app/Session";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { AdminHeader, Confirm, Flag, LoadError, Reveal } from "./shared";

type Appt = { id: string; studentId: string; counselorId: string | null; topic: string; preferredAt: string | null; scheduledAt: string | null; channel: string; status: "demande" | "confirme" | "termine" | "annule"; notes: string | null; createdAt: string };
type Row = { a: Appt; s: { id: string; firstName: string; lastName: string; country: string | null } };
type Conv = { id: string; contextKind: string | null; contextId: string | null; unread: number };

const CHANNEL: Record<string, [string, typeof Video]> = { visio: ["Visio", Video], telephone: ["Téléphone", Phone], whatsapp: ["WhatsApp", MessageCircle] };
const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hm = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const longDay = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export function Conseiller() {
  const me = useUser();
  const { data, error, loading, reload } = useApi<Row[]>("/rendez-vous", { refreshMs: 60_000 });
  const convs = useApi<Conv[]>("/conversations");
  const [tab, setTab] = useState<"agenda" | "historique">("agenda");
  const [plan, setPlan] = useState<Row | null>(null);
  const [close, setClose] = useState<{ r: Row; statut: "termine" | "annule" } | null>(null);
  const closeAct = useAction();
  const toast = useToast();

  const g = useMemo(() => {
    const rows = data ?? [];
    const now = Date.now();
    const confirmed = rows.filter((r) => r.a.status === "confirme").sort((x, y) => +new Date(x.a.scheduledAt ?? 0) - +new Date(y.a.scheduledAt ?? 0));
    return {
      requests: rows.filter((r) => r.a.status === "demande").sort((x, y) => +new Date(x.a.createdAt) - +new Date(y.a.createdAt)),
      confirmed,
      upcoming: confirmed.filter((r) => r.a.scheduledAt && +new Date(r.a.scheduledAt) > now - 3600e3),
      past: rows.filter((r) => r.a.status === "termine" || r.a.status === "annule").sort((x, y) => +new Date(y.a.scheduledAt ?? y.a.createdAt) - +new Date(x.a.scheduledAt ?? x.a.createdAt)),
      done: rows.filter((r) => r.a.status === "termine").length,
    };
  }, [data]);
  const byDay = useMemo(() => {
    const m = new Map<string, Row[]>();
    g.confirmed.forEach((r) => { const k = r.a.scheduledAt ? dayKey(new Date(r.a.scheduledAt)) : "?"; m.set(k, [...(m.get(k) ?? []), r]); });
    return [...m.entries()];
  }, [g.confirmed]);
  const convFor = (id: string) => convs.data?.find((c) => c.contextKind === "conseil" && c.contextId === id);

  const doClose = async () => {
    if (!close) return;
    const r = await closeAct.run(() => api(`/rendez-vous/${close.r.a.id}/cloturer`, { body: { statut: close.statut } }));
    if (r) { toast(close.statut === "termine" ? "Rendez-vous marqué comme terminé." : "Rendez-vous annulé."); setClose(null); reload(); }
  };

  return (
    <div className="min-w-0">
      <AdminHeader eyebrow="Espace conseiller" title={`Bonjour ${me?.firstName ?? ""}`.trim()} sub="Demandes de rendez-vous des élèves, étudiants et parents · votre agenda d'accompagnement" />
      {error ? <LoadError error={error} reload={reload} /> : loading && !data ? <Loading /> : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Reveal i={0}><Kpi icon={Inbox} tone="sun" label="Demandes à traiter" value={g.requests.length} sub={g.requests[0] ? `plus ancienne ${since(g.requests[0].a.createdAt)}` : "aucune en attente"} /></Reveal>
            <Reveal i={1}><Kpi icon={CalendarCheck} tone="blue" label="À venir" value={g.upcoming.length} sub={g.upcoming[0]?.a.scheduledAt ? `prochain : ${dateFr(g.upcoming[0].a.scheduledAt, true)}` : "agenda libre"} /></Reveal>
            <Reveal i={2}><Kpi icon={CheckCircle2} tone="green" label="Terminés" value={g.done} sub="depuis l'ouverture" /></Reveal>
            <Reveal i={3}><Kpi icon={MessageCircle} tone="violet" label="Messages non lus" value={(convs.data ?? []).filter((c) => c.contextKind === "conseil").reduce((t, c) => t + c.unread, 0)} sub={<Link href="/messages" className="font-bold text-brand-600">Ouvrir la messagerie</Link>} /></Reveal>
          </div>

          <div className="grid items-start gap-5 [&>*]:min-w-0 xl:grid-cols-[1fr_1.15fr]">
            <Panel title="Demandes à traiter" icon={Inbox} action={<Chip tone={g.requests.length ? "sun" : "green"}>{g.requests.length}</Chip>}>
              {!g.requests.length ? <Empty icon={CheckCircle2} title="Tout est à jour" text="Les nouvelles demandes des élèves et parents apparaîtront ici ; vous êtes notifié à chaque demande." /> : (
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {g.requests.map((r) => {
                      const [cl, CI] = CHANNEL[r.a.channel] ?? [r.a.channel, Video];
                      return (
                        <motion.li key={r.a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 p-4">
                          <div className="flex items-start gap-3">
                            <Avatar name={`${r.s.firstName} ${r.s.lastName}`} size={40} />
                            <div className="flex min-w-0 flex-1 flex-col"><b>{r.s.firstName} {r.s.lastName}</b><span className="text-xs text-ink-mute"><Flag code={r.s.country} withName /> · demandé {since(r.a.createdAt)}</span></div>
                            <Chip tone="blue"><CI size={12} />{cl}</Chip>
                          </div>
                          <p className="rounded-xl bg-[#f6f8fc] px-3.5 py-2.5 text-sm"><b className="block text-xs uppercase text-ink-mute">Sujet</b>{r.a.topic}</p>
                          {r.a.notes && <p className="text-sm text-ink-soft">« {r.a.notes} »</p>}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-xs text-ink-mute"><Clock size={13} />{r.a.preferredAt ? `Souhaite : ${dateFr(r.a.preferredAt, true)}` : "Pas de créneau préféré"}</span>
                            <div className="flex gap-2">
                              <Button size="sm" variant="quiet" onClick={() => { closeAct.setError(null); setClose({ r, statut: "annule" }); }}>Décliner</Button>
                              <Button size="sm" icon={CalendarClock} onClick={() => setPlan(r)}>Planifier</Button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </Panel>

            <Panel title="Mon agenda" icon={CalendarCheck} action={<Chip tone="blue">{g.confirmed.length}</Chip>}>
              <Tabs value={tab} onChange={setTab} items={[["agenda", `À venir (${g.confirmed.length})`], ["historique", `Historique (${g.past.length})`]]} />
              {tab === "agenda" ? (
                !byDay.length ? <Empty icon={CalendarClock} title="Aucun rendez-vous confirmé" text="Planifiez une demande pour l'ajouter à votre agenda." /> : (
                  <div className="flex flex-col gap-5">
                    {byDay.map(([k, rows]) => (
                      <section key={k} className="flex flex-col gap-2.5">
                        <h3 className="text-xs font-extrabold uppercase tracking-wide text-ink-mute">{k === "?" ? "Date à définir" : longDay(new Date(`${k}T12:00:00`))}{k === dayKey(new Date()) && <Chip tone="green" className="ml-2">Aujourd&apos;hui</Chip>}</h3>
                        {rows.map((r, i) => {
                          const [cl, CI] = CHANNEL[r.a.channel] ?? [r.a.channel, Video];
                          const conv = convFor(r.a.id);
                          const past = r.a.scheduledAt && +new Date(r.a.scheduledAt) < Date.now();
                          return (
                            <Reveal key={r.a.id} i={i}>
                              <div className={`flex flex-col gap-3 rounded-2xl border p-3.5 sm:flex-row sm:items-center ${past ? "border-sun-300 bg-[#fffbea]" : "border-slate-200/80"}`}>
                                <div className="flex w-16 shrink-0 flex-col items-start sm:items-center"><b className="text-lg leading-none">{r.a.scheduledAt ? hm(new Date(r.a.scheduledAt)) : "—"}</b><span className="text-[11px] text-ink-mute">30 min</span></div>
                                <div className="flex min-w-0 flex-1 flex-col">
                                  <b className="truncate">{r.s.firstName} {r.s.lastName}</b>
                                  <span className="line-clamp-2 text-sm text-ink-soft">{r.a.topic}</span>
                                  <span className="flex items-center gap-1.5 text-xs text-ink-mute"><CI size={13} />{cl}{r.a.notes ? ` · ${r.a.notes}` : ""}</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  <Link href={conv ? `/messages?c=${conv.id}` : "/messages"} className="btn-ghost relative px-3 py-2 text-[13px]"><MessageCircle size={15} />Conversation{conv?.unread ? <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d42a50] px-1 text-[10px] text-white">{conv.unread}</span> : null}</Link>
                                  <Button size="sm" variant="quiet" onClick={() => { closeAct.setError(null); setClose({ r, statut: "termine" }); }} aria-label={`Marquer terminé : ${r.s.firstName} ${r.s.lastName}`}><CheckCircle2 size={15} />Terminé</Button>
                                  <Button size="sm" variant="quiet" className="!text-[#d42a50]" onClick={() => { closeAct.setError(null); setClose({ r, statut: "annule" }); }} aria-label={`Annuler : ${r.s.firstName} ${r.s.lastName}`}><XCircle size={15} /></Button>
                                </div>
                              </div>
                            </Reveal>
                          );
                        })}
                      </section>
                    ))}
                  </div>
                )
              ) : (
                !g.past.length ? <Empty icon={History} title="Pas encore d'historique" /> : (
                  <ul className="flex flex-col gap-2.5">
                    {g.past.map((r) => {
                      const [cl, CI] = CHANNEL[r.a.channel] ?? [r.a.channel, Video];
                      return (
                        <li key={r.a.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 p-3.5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f5fb] text-ink-soft"><CI size={17} /></span>
                          <div className="flex min-w-0 flex-1 flex-col"><b className="truncate text-sm">{r.a.topic}</b><span className="truncate text-xs text-ink-mute">{r.s.firstName} {r.s.lastName} · {r.a.scheduledAt ? dateFr(r.a.scheduledAt, true) : dateFr(r.a.createdAt)} · {cl}</span></div>
                          <StatusBadge status={r.a.status} />
                        </li>
                      );
                    })}
                  </ul>
                )
              )}
            </Panel>
          </div>
        </div>
      )}

      <Dialog open={!!plan} onClose={() => setPlan(null)} title="Confirmer un créneau" wide>
        {plan && <Planner r={plan} busy={g.confirmed.filter((x) => x.a.scheduledAt).map((x) => new Date(x.a.scheduledAt!).getTime())} onDone={() => { setPlan(null); reload(); convs.reload(); }} />}
      </Dialog>
      <Confirm open={!!close} onClose={() => setClose(null)} onConfirm={doClose} pending={closeAct.pending} error={closeAct.error} tone={close?.statut === "annule" ? "danger" : "primary"}
        title={close?.statut === "termine" ? "Marquer le rendez-vous comme terminé ?" : close?.r.a.status === "demande" ? "Décliner cette demande ?" : "Annuler ce rendez-vous ?"}
        confirm={close?.statut === "termine" ? "Marquer terminé" : close?.r.a.status === "demande" ? "Décliner" : "Annuler le rendez-vous"}>
        {close && <p><b>{close.r.s.firstName} {close.r.s.lastName}</b> · {close.r.a.topic}{close.r.a.scheduledAt ? ` · ${dateFr(close.r.a.scheduledAt, true)}` : ""}.{close.statut === "annule" ? " Pensez à prévenir la personne via la messagerie." : ""}</p>}
      </Confirm>
    </div>
  );
}

function Planner({ r, busy, onDone }: { r: Row; busy: number[]; onDone: () => void }) {
  const toast = useToast();
  const act = useAction();
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  const days = useMemo(() => {
    const out: Date[] = [];
    const d = new Date(); d.setHours(12, 0, 0, 0);
    while (out.length < 10) { if (d.getDay() !== 0) out.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return out;
  }, []);
  const pref = r.a.preferredAt ? new Date(r.a.preferredAt) : null;
  const [day, setDay] = useState(() => (pref && days.some((d) => dayKey(d) === dayKey(pref)) ? dayKey(pref) : dayKey(days[0])));
  const [slot, setSlot] = useState<string | null>(pref ? hm(pref) : null);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const at = (k: string, s: string) => new Date(`${k}T${s}:00`);
  const taken = (k: string, s: string) => busy.some((b) => Math.abs(b - at(k, s).getTime()) < 30 * 60e3);
  const isPast = (k: string, s: string) => at(k, s).getTime() < Date.now() + 15 * 60e3;
  const chosen = slot ? at(day, slot) : null;

  const submit = async () => {
    if (!slot || !chosen || isNaN(chosen.getTime())) { setErr("Choisissez un jour et un créneau."); return; }
    if (isPast(day, slot)) { setErr("Ce créneau est déjà passé."); return; }
    setErr(null);
    const res = await act.run(() => api(`/rendez-vous/${r.a.id}/planifier`, { body: { date: chosen.toISOString(), notes: notes.trim() || undefined } }));
    if (res) { toast("Rendez-vous confirmé : l'élève est notifié et une conversation est ouverte."); onDone(); }
  };
  const [cl] = CHANNEL[r.a.channel] ?? [r.a.channel];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8fc] p-3.5">
        <Avatar name={`${r.s.firstName} ${r.s.lastName}`} size={40} />
        <div className="min-w-0"><b className="block">{r.s.firstName} {r.s.lastName} · {cl}</b><span className="block truncate text-sm text-ink-mute">{r.a.topic}</span></div>
        <Headset size={18} className="ml-auto shrink-0 text-brand-600" />
      </div>
      {pref && <p className="text-sm text-ink-soft">Créneau souhaité : <button type="button" className="font-bold text-brand-600 underline" onClick={() => { if (days.some((d) => dayKey(d) === dayKey(pref))) { setDay(dayKey(pref)); setSlot(hm(pref)); } }}>{dateFr(pref, true)}</button></p>}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold">Jour <span className="font-normal text-ink-mute">· heure locale ({tz})</span></span>
        <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Jour">
          {days.map((d) => {
            const k = dayKey(d), on = k === day;
            return (
              <button key={k} type="button" role="radio" aria-checked={on} onClick={() => { setDay(k); setSlot(null); }} className={`relative flex w-16 shrink-0 flex-col items-center rounded-2xl border py-2 text-sm ${on ? "border-transparent text-white" : "border-slate-200 bg-[#f6f8fc] hover:border-brand-300"}`}>
                {on && <motion.span layoutId="day-pill" className="absolute inset-0 rounded-2xl bg-brand-600" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                <span className="relative text-xs font-semibold capitalize">{d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")}</span>
                <b className="relative text-lg leading-tight">{d.getDate()}</b>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold">Créneau (30 min)</span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7" role="radiogroup" aria-label="Créneau">
          {SLOTS.map((s) => {
            const off = taken(day, s) || isPast(day, s), on = slot === s;
            return (
              <motion.button key={s} type="button" role="radio" aria-checked={on} disabled={off} onClick={() => setSlot(s)} whileTap={{ scale: 0.94 }}
                className={`rounded-xl border py-2 text-sm font-bold transition ${on ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-200" : off ? "cursor-not-allowed border-slate-100 bg-[#f6f8fc] text-ink-mute line-through" : "border-slate-200 hover:border-brand-400"}`}>
                {s}
              </motion.button>
            );
          })}
        </div>
      </div>
      <Field label="Message pour l'élève (facultatif)" hint="Ex. : lien de visio, documents à préparer.">{(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} className="!min-h-[80px]" maxLength={2000} />}</Field>
      <FormError error={err ?? act.error} />
      <div className="flex flex-col gap-3 border-t border-[#eef1f8] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-ink-mute">{chosen ? <>Le <b className="text-ink">{longDay(chosen)}</b> à <b className="text-ink">{slot}</b> · {cl}</> : "Aucun créneau sélectionné"}</span>
        <Button icon={CalendarCheck} loading={act.pending} disabled={!slot} onClick={submit}>Confirmer le rendez-vous</Button>
      </div>
    </div>
  );
}
