"use client";
// Rendez-vous d'appel (maquettes design/maquettes/rendez_vous.py, validées le 21/11/2026) : planifier depuis un fil,
// carte du rendez-vous dans le fil, agenda « Rendez-vous » de chaque compte. Heures affichées dans le fuseau du
// navigateur ; les notifications serveur parlent en heure de Libreville (identique à Casablanca hors Ramadan).
import { CalendarCheck, CalendarClock, CalendarPlus, ChevronLeft, ChevronRight, History, Pencil, Phone, Send, Video, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "@/components/ui/Link";
import { Alert, Button, Dialog, Empty, Loading, PageHeader, useToast } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { useUser } from "@/components/app/Session";
import { api } from "@/lib/api";

const JOURS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const CRENEAUX = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
const DUREES = [15, 30, 45, 60, 90];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dateLongue = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const hm = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const maj = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function dans(d: Date, maintenant = Date.now()) {
  const m = Math.round((d.getTime() - maintenant) / 60000);
  if (m <= 0) return "maintenant";
  if (m < 60) return `dans ${m} min`;
  // Au-delà d'une heure : en jours du calendrier (« aujourd'hui », « demain », « dans 3 jours »), comme la liste par jour.
  const j = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(new Date(maintenant).setHours(0, 0, 0, 0)).getTime()) / 86400e3);
  if (j === 0) return m < 6 * 60 ? `dans ${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, "0")}` : ""}` : `aujourd'hui à ${hm(d)}`;
  return j === 1 ? `demain à ${hm(d)}` : `dans ${j} jours`;
}

/** Calendrier d'un mois (lundi en premier) : un bouton par jour, points pour les jours qui ont des rendez-vous. */
function Mois({ mois, setMois, choisi, onChoisir, points = {}, minimum }: { mois: Date; setMois: (d: Date) => void; choisi?: string; onChoisir?: (j: string) => void; points?: Record<string, number>; minimum?: string }) {
  const premier = new Date(mois.getFullYear(), mois.getMonth(), 1);
  const decalage = (premier.getDay() + 6) % 7;
  const nb = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate();
  const jours = [...Array(decalage).fill(null), ...Array.from({ length: nb }, (_, i) => new Date(mois.getFullYear(), mois.getMonth(), i + 1))];
  return (
    <div>
      <div className="flex items-center justify-between font-extrabold">
        <button type="button" aria-label="Mois précédent" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))} className="rounded-lg p-1.5 text-ink-mute hover:bg-[#f1f4fb]"><ChevronLeft size={18} /></button>
        <span className="capitalize">{mois.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
        <button type="button" aria-label="Mois suivant" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))} className="rounded-lg p-1.5 text-ink-mute hover:bg-[#f1f4fb]"><ChevronRight size={18} /></button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {JOURS.map((j) => <span key={j} className="text-[11px] font-bold text-ink-mute">{j}</span>)}
        {jours.map((d, i) => {
          if (!d) return <span key={`v${i}`} />;
          const k = iso(d), on = k === choisi, n = points[k] ?? 0, passe = !!minimum && k < minimum;
          return (
            <button key={k} type="button" disabled={passe || !onChoisir} onClick={() => onChoisir?.(k)} aria-pressed={on} aria-label={`${dateLongue(d)}${n ? `, ${n} rendez-vous` : ""}`}
              className={`flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition ${on ? "bg-brand-600 font-extrabold text-white" : passe ? "text-[#b4bbcd]" : "font-semibold hover:bg-brand-50"} ${!onChoisir ? "cursor-default" : ""}`}>
              {d.getDate()}
              <span className="flex h-1.5 gap-0.5">{Array.from({ length: Math.min(n, 3) }, (_, x) => <span key={x} className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-brand-600"}`} />)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type Creneau = { jour: string; heure: string; dureeMin: number; audioSeul: boolean; objet: string };

/** Fenêtre « Planifier un rendez-vous » (ou « Déplacer » si `rdvId`). */
export function FenetreRdv({ open, onClose, conversationId, avec, initial, rdvId, apres }: { open: boolean; onClose: () => void; conversationId?: string; avec?: string; initial?: Partial<Creneau>; rdvId?: string; apres?: () => void }) {
  const toast = useToast();
  const demain = new Date(Date.now() + 86400e3);
  const [c, setC] = useState<Creneau>({ jour: iso(demain), heure: "15:00", dureeMin: 30, audioSeul: false, objet: "", ...initial });
  const [mois, setMois] = useState(() => new Date(`${c.jour}T12:00:00`));
  const [autre, setAutre] = useState(!CRENEAUX.includes(c.heure));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (open) { setErr(null); } }, [open]);
  const debut = new Date(`${c.jour}T${c.heure}:00`);
  const valide = !Number.isNaN(debut.getTime());
  const envoyer = async () => {
    setBusy(true); setErr(null);
    try {
      const corps = { debut: debut.toISOString(), dureeMin: c.dureeMin, audioSeul: c.audioSeul, objet: c.objet };
      if (rdvId) await api(`/appels/${rdvId}`, { method: "PATCH", body: corps });
      else await api(`/conversations/${conversationId}/appel/planifier`, { body: corps });
      toast(rdvId ? "Rendez-vous déplacé : tout le monde est prévenu" : "Rendez-vous planifié : le lien est envoyé");
      onClose(); apres?.();
    } catch (x) { setErr(x instanceof Error ? x.message : "Rendez-vous impossible."); } finally { setBusy(false); }
  };
  const pastille = (on: boolean) => `min-h-[38px] rounded-full px-3.5 text-[13px] font-bold transition ${on ? "bg-brand-600 text-white" : "bg-[#f1f4fb] text-ink-soft hover:bg-brand-50"}`;
  return (
    <Dialog open={open} onClose={onClose} title={rdvId ? "Déplacer le rendez-vous" : `Planifier un rendez-vous${avec ? ` avec ${avec}` : ""}`} wide>
      <div className="flex flex-col gap-5">
        {!rdvId && <p className="-mt-2 text-sm text-ink-mute">Les participants du fil (et les parents d&apos;un élève) reçoivent le lien tout de suite, puis un rappel le matin du jour et 15 minutes avant.</p>}
        <label className="flex flex-col gap-1.5 text-sm"><b>Objet</b><input className="input" maxLength={140} value={c.objet} onChange={(e) => setC({ ...c, objet: e.target.value })} placeholder="Ex. : Entretien d'admission" /></label>
        <div className="grid gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex flex-col gap-1.5 text-sm"><b>Date</b>
            <div className="rounded-2xl border border-slate-200 p-3"><Mois mois={mois} setMois={setMois} choisi={c.jour} onChoisir={(j) => setC({ ...c, jour: j })} minimum={iso(new Date())} /></div></div>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 text-sm"><span><b>Heure</b> <span className="text-ink-mute">(votre heure locale)</span></span>
              <div className="flex flex-wrap gap-2">
                {CRENEAUX.map((h) => <button key={h} type="button" aria-pressed={!autre && c.heure === h} onClick={() => { setAutre(false); setC({ ...c, heure: h }); }} className={pastille(!autre && c.heure === h)}>{h}</button>)}
                {autre ? <input type="time" aria-label="Autre heure" className="input w-[130px] py-2" value={c.heure} onChange={(e) => setC({ ...c, heure: e.target.value })} />
                  : <button type="button" onClick={() => setAutre(true)} className="min-h-[38px] rounded-full border-[1.5px] border-dashed border-slate-300 px-3.5 text-[13px] font-bold text-ink-mute">Autre heure…</button>}
              </div></div>
            <div className="flex flex-col gap-2 text-sm"><b>Durée</b>
              <div className="flex flex-wrap gap-2">{DUREES.map((d) => <button key={d} type="button" aria-pressed={c.dureeMin === d} onClick={() => setC({ ...c, dureeMin: d })} className={pastille(c.dureeMin === d)}>{d} min</button>)}</div></div>
            <div className="flex flex-col gap-2 text-sm"><b>Type d&apos;appel</b>
              <div className="flex gap-2">
                <button type="button" aria-pressed={!c.audioSeul} onClick={() => setC({ ...c, audioSeul: false })} className={`btn ${!c.audioSeul ? "border-2 border-brand-600 bg-brand-50 text-brand-700" : "border border-slate-200 text-ink-soft"}`}><Video size={16} />Vidéo</button>
                <button type="button" aria-pressed={c.audioSeul} onClick={() => setC({ ...c, audioSeul: true })} className={`btn ${c.audioSeul ? "border-2 border-brand-600 bg-brand-50 text-brand-700" : "border border-slate-200 text-ink-soft"}`}><Phone size={16} />Audio seul</button>
              </div></div>
          </div>
        </div>
        {valide && <p className="flex items-center gap-3 rounded-2xl bg-[#f6f8fe] p-3.5 text-sm"><CalendarCheck size={20} className="shrink-0 text-[#0b7a3d]" /><span><b>{maj(dateLongue(debut))} à {hm(debut)} · {c.dureeMin} min · {c.audioSeul ? "audio" : "vidéo"}.</b> <span className="text-ink-mute">Le lien s&apos;ouvre 10 minutes avant l&apos;heure.</span></span></p>}
        {err && <Alert tone="error">{err}</Alert>}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="ghost" onClick={onClose}>Annuler</Button><Button icon={Send} loading={busy} disabled={!valide} onClick={envoyer}>{rdvId ? "Déplacer et prévenir" : "Planifier et envoyer le lien"}</Button></div>
      </div>
    </Dialog>
  );
}

/** Bouton « Planifier un rendez-vous » (écoles, bailleurs, conseillers, équipe), à côté des appels immédiats. */
export function PlanifierRdv({ conversationId, avec, apres }: { conversationId: string; avec?: string; apres?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-[13px] font-bold text-white hover:bg-brand-700"><CalendarPlus size={16} />Planifier un rendez-vous</button>
      <FenetreRdv open={open} onClose={() => setOpen(false)} conversationId={conversationId} avec={avec} apres={apres} />
    </>
  );
}

type Infos = { id: string; conversationId: string; sujet: string; objet: string | null; prevuLe: string | null; dureeMin: number | null; audioSeul: boolean; annule: boolean; termine: boolean; ouvreLe: string | null; monRdv: boolean };

/** Actions d'un rendez-vous : rejoindre (ouvert 10 min avant), ajouter à l'agenda, déplacer et annuler (organisateur). */
function Actions({ r, apres, compact = false }: { r: { id: string; prevuLe: string; dureeMin: number; audioSeul: boolean; objet: string | null; annule: boolean; monRdv: boolean }; apres?: () => void; compact?: boolean }) {
  const toast = useToast();
  const [deplacer, setDeplacer] = useState(false);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 30000); return () => clearInterval(t); }, []);
  const debut = new Date(r.prevuLe), ouvert = maintenant >= debut.getTime() - 10 * 60e3, fini = maintenant > debut.getTime() + (r.dureeMin + 30) * 60e3;
  const annuler = async () => {
    if (!window.confirm("Annuler ce rendez-vous ? Tous les participants seront prévenus.")) return;
    try { await api(`/appels/${r.id}/annuler`, { body: {} }); toast("Rendez-vous annulé"); apres?.(); } catch (x) { toast(x instanceof Error ? x.message : "Annulation impossible", "error"); }
  };
  if (r.annule) return <span className="chip bg-[#ffecef] text-[#b8213f]">Annulé</span>;
  if (fini) return <span className="chip bg-[#eef1f8] text-ink-soft">Terminé</span>;
  const icone = "flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-white text-brand-700 hover:bg-brand-50";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "justify-end"}`}>
      {ouvert ? <Link href={`/appel/${r.id}/`} className="btn-primary min-h-[40px] py-2 text-[13px]">{r.audioSeul ? <Phone size={15} /> : <Video size={15} />}Rejoindre</Link>
        : <span className="chip min-h-[30px] bg-sun-100 px-3 text-[#a55a00]">{dans(debut, maintenant)}</span>}
      <a href={`/api/appels/${r.id}/agenda.ics`} className={icone} title="Ajouter à mon agenda" aria-label="Ajouter à mon agenda"><CalendarPlus size={17} /></a>
      {r.monRdv && <>
        <button type="button" onClick={() => setDeplacer(true)} className={icone} title="Déplacer" aria-label="Déplacer le rendez-vous"><Pencil size={16} /></button>
        <button type="button" onClick={annuler} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#f3c5cf] bg-white text-[#b8213f] hover:bg-[#ffecef]" title="Annuler" aria-label="Annuler le rendez-vous"><X size={17} /></button>
        <FenetreRdv open={deplacer} onClose={() => setDeplacer(false)} rdvId={r.id} apres={apres} initial={{ jour: iso(debut), heure: hm(debut), dureeMin: r.dureeMin, audioSeul: r.audioSeul, objet: r.objet ?? "" }} />
      </>}
    </div>
  );
}

/** Carte d'un rendez-vous dans le fil (à la place du lien brut). */
export function CarteRdv({ id }: { id: string }) {
  const { data, reload } = useApi<Infos>(`/appels/${id}/infos`);
  if (!data || !data.prevuLe) return null;
  const d = new Date(data.prevuLe);
  return (
    <span className="my-1 flex max-w-[420px] flex-col gap-2 rounded-2xl border-[1.5px] border-brand-200 bg-white p-4 text-ink">
      <span className="flex items-center gap-2"><CalendarClock size={20} className="text-brand-600" /><b>{data.objet ?? "Rendez-vous"}</b></span>
      <b className={`text-[20px] ${data.annule ? "text-ink-mute line-through" : ""}`}>{maj(d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }))} · {hm(d)}</b>
      <span className="text-xs text-ink-mute">{data.dureeMin ?? 30} min · {data.audioSeul ? "appel audio" : "appel vidéo"} · votre heure locale</span>
      {!data.annule && !data.termine && <span className="chip w-fit bg-[#e8f8ef] text-[#0b7a3d]">Rappel le matin et 15 min avant</span>}
      <Actions r={{ ...data, prevuLe: data.prevuLe, dureeMin: data.dureeMin ?? 30 }} apres={reload} compact />
    </span>
  );
}

type Rdv = { id: string; conversationId: string; sujet: string; objet: string | null; prevuLe: string; dureeMin: number; audioSeul: boolean; annule: boolean; organisateur: string; organisateurRole: string; monRdv: boolean; participants: string[]; lien: string };

/** Page « Rendez-vous » : calendrier du mois, prochain rendez-vous, liste par jour. */
export function AgendaRdv() {
  const me = useUser();
  const organise = ["etablissement", "bailleur", "conseiller", "admin"].includes(me.role); // les autres sont invités
  const [passes, setPasses] = useState(false);
  const { data, loading, error, reload } = useApi<Rdv[]>(`/moi/rendez-vous-appels${passes ? "?passes=1" : ""}`);
  const salons = useApi<{ id: string; titre: string; debut: string; dureeMin: number; ecole: string; organisateur: boolean }[]>("/moi/salons");
  const [mois, setMois] = useState(() => new Date());
  const [jour, setJour] = useState<string | undefined>();
  const points = useMemo(() => { const p: Record<string, number> = {}; for (const r of data ?? []) if (!r.annule) { const k = iso(new Date(r.prevuLe)); p[k] = (p[k] ?? 0) + 1; } return p; }, [data]);
  const liste = (data ?? []).filter((r) => !jour || iso(new Date(r.prevuLe)) === jour);
  const parJour = useMemo(() => { const g = new Map<string, Rdv[]>(); for (const r of liste) { const k = iso(new Date(r.prevuLe)); g.set(k, [...(g.get(k) ?? []), r]); } return [...g.entries()]; }, [liste]);
  const prochain = (data ?? []).find((r) => !r.annule && new Date(r.prevuLe).getTime() > Date.now() - 30 * 60e3);
  const aujourdhui = iso(new Date()), demainK = iso(new Date(Date.now() + 86400e3));
  const titreJour = (k: string) => { const d = new Date(`${k}T12:00:00`); return `${k === aujourdhui ? "Aujourd'hui · " : k === demainK ? "Demain · " : ""}${dateLongue(d)}`; };
  if (loading && !data) return <Loading />;
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Rendez-vous" sub="Entretiens, visites virtuelles et échanges planifiés. Rappels envoyés le matin du jour et 15 minutes avant ; heures affichées dans votre fuseau."
        actions={<><Button variant="ghost" icon={History} onClick={() => { setPasses(!passes); setJour(undefined); }}>{passes ? "À venir" : "Passés"}</Button>{organise && <Link href="/messages" className="btn-primary"><CalendarPlus size={16} />Planifier</Link>}</>} />
      {error && <Alert tone="error">{error.message}</Alert>}
      <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)] [&>*]:min-w-0">
        <div className="flex flex-col gap-4">
          <div className="card rounded-[22px] p-4">
            <Mois mois={mois} setMois={setMois} choisi={jour} onChoisir={(j) => setJour(j === jour ? undefined : j)} points={points} />
            <div className="mt-3 flex justify-between border-t border-[#eef1f8] pt-3 text-sm"><span className="text-ink-mute">{jour ? titreJour(jour) : passes ? "60 derniers jours et à venir" : "À venir"}</span><b>{liste.filter((r) => !r.annule).length} rendez-vous</b></div>
            {jour && <button type="button" onClick={() => setJour(undefined)} className="mt-2 text-sm font-bold text-brand-600">Voir tous les jours</button>}
          </div>
          <p className="flex gap-2 rounded-2xl bg-[#f6f8fe] p-3 text-xs text-ink-mute"><CalendarPlus size={16} className="shrink-0 text-brand-600" />Ajoutez un rendez-vous à votre agenda (Google, Outlook, téléphone) avec le bouton calendrier : une alerte vous prévient 15 minutes avant.</p>
          {organise && <p className="text-xs text-ink-mute">Pour planifier : ouvrez une conversation (candidature, réservation, conseiller), puis « Planifier un rendez-vous ».</p>}
        </div>
        <div className="order-first flex flex-col gap-3 lg:order-none">
          {prochain && !jour && !prochain.monRdv && <ProchainRdv r={prochain} />}
          {!jour && !passes && !!salons.data?.length && <section className="flex flex-col gap-2.5">
            <b className="text-[15px]">Salons virtuels</b>
            {salons.data.map((v) => { const d = new Date(v.debut); const ouvert = Date.now() >= d.getTime() - (v.organisateur ? 30 : 10) * 60e3; return (
              <article key={v.id} className="card flex flex-col gap-3 rounded-[20px] border-brand-200 p-4 sm:flex-row sm:items-center">
                <div className="w-[68px] shrink-0 text-center"><b className="block text-[20px]">{hm(d)}</b><span className="text-xs text-ink-mute">{d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span></div>
                <div className="min-w-0 flex-1"><b className="block leading-snug">{v.titre}</b><span className="text-xs text-ink-mute">{v.ecole} · {v.dureeMin} min · {v.organisateur ? "vous organisez" : "inscrit·e"}</span></div>
                <div className="flex flex-wrap gap-2">{ouvert ? <Link href={`/salons/${v.id}/direct/`} className="btn-primary min-h-[40px] py-2 text-[13px]"><Video size={15} />Entrer</Link> : <span className="chip min-h-[30px] bg-sun-100 px-3 text-[#a55a00]">{dans(d)}</span>}
                  <a href={`/api/salons/${v.id}/agenda.ics`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-white text-brand-700 hover:bg-brand-50" title="Ajouter à mon agenda" aria-label="Ajouter à mon agenda"><CalendarPlus size={17} /></a>
                  <Link href={`/salons/${v.id}/`} className="btn-ghost min-h-[40px] py-2 text-[13px]">Page</Link></div>
              </article>); })}
          </section>}
          {!liste.length ? <Empty icon={CalendarClock} title={jour ? "Aucun rendez-vous ce jour-là" : "Aucun rendez-vous planifié"} text="Les rendez-vous fixés avec une école, un bailleur ou un conseiller apparaissent ici, avec leur lien." />
            : parJour.map(([k, rs]) => (
              <section key={k} className="flex flex-col gap-2.5">
                <b className="text-[15px] first-letter:uppercase">{titreJour(k)}</b>
                {rs.map((r) => (
                  <article key={r.id} className="card flex flex-col gap-3 rounded-[20px] p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4 sm:contents">
                      <div className="w-[68px] shrink-0 text-center"><b className={`block text-[20px] ${r.annule ? "text-ink-mute line-through" : ""}`}>{hm(new Date(r.prevuLe))}</b><span className="text-xs text-ink-mute">{r.dureeMin} min</span></div>
                      <span className="hidden w-px self-stretch bg-[#eef1f8] sm:block" />
                      <div className="min-w-0 flex-1">
                        <b className="block leading-snug">{r.objet ?? r.sujet}</b>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-mute">
                          <span>{r.participants.slice(0, 3).join(", ")}{r.participants.length > 3 ? "…" : ""}</span>
                          <span className="flex items-center gap-1">{r.audioSeul ? <Phone size={12} /> : <Video size={12} />}{r.audioSeul ? "Audio" : "Vidéo"}</span>
                          <Link href={`/messages/${r.conversationId}/`} className="font-bold text-brand-600">Conversation</Link>
                        </span>
                      </div>
                    </div>
                    <Actions r={r} apres={reload} />
                  </article>
                ))}
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}

/** Prochain rendez-vous (côté invité) : compte à rebours et ajout à l'agenda. */
export function ProchainRdv({ r }: { r: { id: string; prevuLe: string; dureeMin: number; audioSeul: boolean; objet: string | null; sujet?: string; organisateur?: string } }) {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setMaintenant(Date.now()), 15000); return () => clearInterval(t); }, []);
  const d = new Date(r.prevuLe), reste = Math.max(0, d.getTime() - maintenant);
  const ouvert = maintenant >= d.getTime() - 10 * 60e3;
  const cases: [number, string][] = [[Math.floor(reste / 86400e3), "jours"], [Math.floor((reste % 86400e3) / 3600e3), "heures"], [Math.floor((reste % 3600e3) / 60e3), "min"]];
  return (
    <div className="card flex flex-col items-center gap-3 rounded-[22px] p-5 text-center">
      <span className="chip bg-brand-50 text-brand-700">{r.audioSeul ? <Phone size={12} /> : <Video size={12} />}{r.audioSeul ? "Appel audio" : "Appel vidéo"}{r.organisateur ? ` · ${r.organisateur}` : ""}</span>
      <b className="text-lg">{r.objet ?? r.sujet ?? "Rendez-vous"}</b>
      <span className="text-sm text-ink-mute">{maj(dateLongue(d))} · {hm(d)} · {r.dureeMin} min</span>
      {!ouvert && <div className="flex gap-2.5">{cases.map(([n, u]) => <span key={u} className="w-[68px] rounded-xl bg-[#f6f8fe] py-2"><b className="block text-[22px]">{u === "jours" ? n : String(n).padStart(2, "0")}</b><span className="text-xs text-ink-mute">{u}</span></span>)}</div>}
      {ouvert ? <Link href={`/appel/${r.id}/`} className="btn-primary w-full justify-center"><Video size={16} />Rejoindre maintenant</Link>
        : <><span className="text-xs text-ink-mute">Le lien s&apos;ouvre 10 minutes avant l&apos;heure.</span><a href={`/api/appels/${r.id}/agenda.ics`} className="btn-primary w-full justify-center"><CalendarPlus size={16} />Ajouter à mon agenda</a></>}
    </div>
  );
}
