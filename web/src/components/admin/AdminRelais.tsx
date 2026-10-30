"use client";
/* eslint-disable @next/next/no-img-element -- logos déjà optimisés */
import Link from "@/components/ui/Link";
import { AlarmClock, Building2, CheckCircle2, Crown, FileCheck2, Gavel, Inbox, KeyRound, LifeBuoy, MessagesSquare, Search, Send, StickyNote, Timer, Undo2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, Button, Chip, Empty, Kpi, Loading, Panel, StatusBadge, dateFr, since, useToast } from "@/components/app/kit";
import { DOC_TYPES, Field, FormError, Input, Select, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { PRIX_PREMIUM_MAD } from "@/lib/premium";
import { AdminHeader, Flag, LoadError, PAYS_OPTS, Pager, Toggle, qs, useDebounced } from "./shared";

// ---------------------------------------------------------------- Toutes les candidatures
type Ligne = { id: string; number: string; status: string; submittedAt: string | null; attente: number | null; student: { id: string; firstName: string; lastName: string; country: string | null }; program: string; establishment: { id: string; sigle: string; nom: string; logo: string | null; assisted: boolean } };
type Liste = { items: Ligne[]; page: number; stats: { total: number; enRetard: number; accompagnees: number; pieces: number; ecolesAccompagnees: number } };
const STATUTS: [string, string][] = [["", "Tous les statuts"], ["soumise", "Envoyée"], ["paiement_confirme", "Paiement confirmé"], ["en_verification", "En vérification"], ["piece_demandee", "Pièce demandée"], ["complet", "Dossier complet"], ["en_traitement", "En traitement"], ["acceptee", "Acceptée"], ["refusee", "Refusée"], ["liste_attente", "Liste d'attente"], ["desistee", "Désistement"]];

export function AdminCandidatures() {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [f, setF] = useState({ statut: "", pays: "", gere: "", attente: false, page: 1 });
  const r = useApi<Liste>(`/admin/candidatures${qs({ q: dq, statut: f.statut, pays: f.pays, gere: f.gere, attente: f.attente ? "1" : "", page: f.page })}`);
  const a = useAction();
  const ouvrir = (id: string) => a.run(async () => { const c = await api<{ id: string }>(`/admin/candidatures/${id}/fil`, { method: "POST" }); location.href = `/admin/messagerie?fil=${c.id}`; });
  const s = r.data?.stats;
  return (
    <div className="min-w-0">
      <AdminHeader title="Candidatures" sub={s ? `Toutes les écoles · ${s.total} candidatures · ${s.enRetard} en attente de l'école depuis 3 jours ou plus` : "Toutes les écoles"} />
      {s && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={AlarmClock} tone="rose" label="En attente ≥ 3 jours" value={s.enRetard} sub="à reprendre par l'équipe" />
          <Kpi icon={LifeBuoy} label="Gérées par Navigoal" value={s.accompagnees} sub={`mode accompagné : ${s.ecolesAccompagnees} école${s.ecolesAccompagnees > 1 ? "s" : ""}`} />
          <Kpi icon={FileCheck2} tone="sun" label="Pièces en attente" value={s.pieces} sub="le candidat doit déposer" />
          <Kpi icon={Inbox} tone="violet" label="Total" value={s.total} sub="hors brouillons" />
        </div>
      )}
      <Panel>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, n° de dossier, e-mail…" className="pl-10" aria-label="Rechercher" /></div>
          <Select aria-label="Statut" value={f.statut} onChange={(e) => setF({ ...f, statut: e.target.value, page: 1 })} options={STATUTS} className="w-auto" />
          <Select aria-label="Pays" value={f.pays} onChange={(e) => setF({ ...f, pays: e.target.value, page: 1 })} options={[["", "Tous les pays"], ...PAYS_OPTS]} className="w-auto" />
          <Select aria-label="Géré par" value={f.gere} onChange={(e) => setF({ ...f, gere: e.target.value, page: 1 })} options={[["", "Géré par : tous"], ["navigoal", "Navigoal (accompagné)"], ["ecole", "École"]]} className="w-auto" />
          <button onClick={() => setF({ ...f, attente: !f.attente, page: 1 })} className={`chip gap-1.5 px-3 py-2 ${f.attente ? "bg-[#d42a50] text-white" : "bg-[#ffecef] text-[#d42a50]"}`}><AlarmClock size={14} />En attente ≥ 3 j</button>
        </div>
        <FormError error={a.error} />
        {r.error ? <LoadError error={r.error} reload={r.reload} /> : r.loading && !r.data ? <Loading /> : !r.data?.items.length ? <Empty icon={Inbox} title="Aucune candidature" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead><tr className="border-b border-[#e6eaf3] text-left text-[11px] uppercase text-ink-mute">{["N°", "Candidat", "École", "Formation", "Statut", "En attente", "Géré par", ""].map((h) => <th key={h} className="px-3 py-2.5 font-extrabold">{h}</th>)}</tr></thead>
              <tbody>{r.data.items.map((x) => (
                <tr key={x.id} className="border-b border-[#eef1f8] last:border-0">
                  <td className="px-3 py-3 font-bold">{x.number}</td>
                  <td className="px-3 py-3">{x.student.firstName} {x.student.lastName[0]}. <Flag code={x.student.country} /></td>
                  <td className="px-3 py-3"><span className="flex items-center gap-2">{x.establishment.logo && <img src={x.establishment.logo} alt="" className="h-7 w-7 rounded-lg border border-slate-100 object-contain" />}<b>{x.establishment.sigle}</b></span></td>
                  <td className="max-w-[220px] truncate px-3 py-3">{x.program}</td>
                  <td className="px-3 py-3"><StatusBadge status={x.status} /></td>
                  <td className={`px-3 py-3 font-bold ${(x.attente ?? 0) >= 3 ? "text-[#d42a50]" : ""}`}>{x.attente == null ? "—" : `${x.attente} j`}</td>
                  <td className="px-3 py-3">{x.establishment.assisted ? <Chip><LifeBuoy size={12} className="mr-1 inline" />Navigoal</Chip> : <Chip tone="grey"><Building2 size={12} className="mr-1 inline" />École</Chip>}</td>
                  <td className="px-3 py-3 text-right"><span className="inline-flex gap-1.5"><Button size="sm" variant="ghost" onClick={() => ouvrir(x.id)}>Échanger</Button><Link href={`/etablissement/candidatures/${x.id}?eid=${x.establishment.id}`} className="btn-ghost px-3 py-2 text-[13px]">Dossier</Link></span></td>
                </tr>
              ))}</tbody>
            </table>
            <Pager page={f.page} total={r.data.items.length === 50 ? f.page * 50 + 1 : (f.page - 1) * 50 + r.data.items.length} size={50} onPage={(p) => setF({ ...f, page: p })} />
          </div>
        )}
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------- Messagerie (relais)
type Conv = { id: string; subject: string; contextKind: string | null; lastMessageAt: string; enAttente: boolean; jours: number | null; participants: { id: string; firstName: string; lastName: string; role: string }[]; last: { body: string; created_at: string; role: string; on_behalf_of: string | null } | null };
type Ctx =
  | { type: "application"; pourLeCompteDe: string; establishment: { id: string; nom: string; sigle: string; logo: string | null; assisted: boolean }; application: { id: string; number: string; status: string; programme: string; submittedAt: string | null; requestedDocuments: string[] }; documents: { id: string; type: string; label: string | null; status: string }[] }
  | { type: "booking"; pourLeCompteDe: string; booking: { id: string; number: string; status: string; logement: string } }
  | { type: "invitation"; pourLeCompteDe: string; establishment: { id: string; nom: string; sigle: string; logo: string | null; assisted: boolean } }
  | { type: "autre"; pourLeCompteDe: null };
type Fil = { conversation: { id: string; subject: string }; participants: { id: string; firstName: string; lastName: string; role: string }[]; contexte: Ctx;
  messages: { m: { id: string; body: string; createdAt: string; internal: boolean; onBehalfOf: string | null; masked: boolean }; a: { id: string; firstName: string; lastName: string; role: string } }[] };
const PRO = ["etablissement", "bailleur", "admin", "conseiller"];
const ROLE: Record<string, string> = { eleve: "candidat", etudiant: "candidat", parent: "parent", etablissement: "école", bailleur: "bailleur", conseiller: "conseiller", admin: "équipe Navigoal" };

export function AdminMessagerie() {
  const [type, setType] = useState("application");
  const [attente, setAttente] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { const f = new URLSearchParams(location.search).get("fil"); if (f) { setSel(f); setType(""); } }, []);
  const list = useApi<{ items: Conv[]; counts: Record<string, number> }>(`/admin/conversations${qs({ type, q: dq, attente: attente ? "1" : "" })}`, { refreshMs: 30000 });
  return (
    <div className="min-w-0">
      <AdminHeader title="Messagerie" sub="Tous les échanges candidat ↔ école et locataire ↔ bailleur · réponses signées « Équipe Navigoal, pour le compte de… »" />
      <div className="grid items-start gap-4 xl:grid-cols-[340px_1fr]">
        <Panel className="xl:sticky xl:top-4">
          <div className="flex flex-wrap gap-1.5">{[["application", "Candidatures"], ["navilease", "Navilease"], ["conseil", "Conseil"], ["", "Tout"]].map(([k, t]) => (
            <button key={k} onClick={() => setType(k)} className={`chip px-3 py-1.5 ${type === k ? "bg-brand-600 text-white" : "bg-[#eef1f8] text-ink-soft"}`}>{t}{k && list.data?.counts[k] != null ? ` ${list.data.counts[k]}` : ""}</button>))}</div>
          <div className="flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un sujet…" aria-label="Rechercher" className="py-2" />
            <button onClick={() => setAttente(!attente)} title="Dernier message du candidat sans réponse" className={`chip shrink-0 px-3 ${attente ? "bg-[#d42a50] text-white" : "bg-[#ffecef] text-[#d42a50]"}`}><Timer size={14} /></button></div>
          {list.loading && !list.data ? <Loading /> : !list.data?.items.length ? <p className="py-6 text-center text-sm text-ink-mute">Aucun échange.</p> : (
            <ul className="-mx-2 flex max-h-[65vh] flex-col gap-1.5 overflow-y-auto px-2">
              {list.data.items.map((c) => (
                <li key={c.id}><button onClick={() => setSel(c.id)} className={`w-full rounded-2xl border p-3 text-left ${sel === c.id ? "border-[#c9d6ff] bg-brand-50" : "border-[#eef1f8] hover:bg-[#f6f8fe]"}`}>
                  <span className="flex justify-between gap-2"><b className="truncate text-[13.5px]">{c.participants.filter((p) => p.role !== "admin").map((p) => p.firstName).slice(0, 3).join(" ↔ ")}</b><span className={`shrink-0 text-xs font-bold ${c.enAttente && (c.jours ?? 0) >= 1 ? "text-[#d42a50]" : "text-ink-mute"}`}>{since(c.lastMessageAt)}</span></span>
                  <span className="block truncate text-xs text-ink-mute">{c.subject}</span>
                  {c.last && <span className="mt-1 block truncate text-xs">{c.last.on_behalf_of && c.last.role === "admin" ? "Navigoal : " : ""}{c.last.body}</span>}
                </button></li>
              ))}
            </ul>
          )}
        </Panel>
        {sel ? <FilAdmin id={sel} onChange={list.reload} /> : <Empty icon={MessagesSquare} title="Choisissez un échange" text="Les fils où le candidat attend une réponse sont signalés en rouge." />}
      </div>
    </div>
  );
}

function FilAdmin({ id, onChange }: { id: string; onChange: () => void }) {
  const toast = useToast();
  const f = useApi<Fil>(`/admin/conversations/${id}`, { refreshMs: 20000 });
  const [texte, setTexte] = useState("");
  const [interne, setInterne] = useState(false);
  const a = useAction();
  const envoyer = () => a.run(async () => { await api(`/admin/conversations/${id}/messages`, { body: { texte, interne } }); setTexte(""); f.reload(); onChange(); toast(interne ? "Note interne ajoutée" : "Réponse envoyée"); });
  if (f.error) return <LoadError error={f.error} reload={f.reload} />;
  if (!f.data) return <Loading />;
  const { contexte: ctx } = f.data;
  return (
    <div className="grid items-start gap-4 2xl:grid-cols-[1fr_320px]">
      <Panel title={f.data.conversation.subject} icon={MessagesSquare} action={ctx.type !== "autre" && <Chip><LifeBuoy size={12} className="mr-1 inline" />Pour le compte de {ctx.pourLeCompteDe}</Chip>}>
        <div className="flex max-h-[55vh] flex-col gap-3.5 overflow-y-auto pr-1">
          {!f.data.messages.length && <p className="py-6 text-center text-sm text-ink-mute">Aucun message : écrivez le premier.</p>}
          {f.data.messages.map(({ m, a: au }) => {
            const pro = PRO.includes(au.role);
            return (
              <div key={m.id} className={`flex flex-col ${pro ? "items-end" : "items-start"}`}>
                <span className="mb-1 text-[11px] text-ink-mute"><b className="text-ink">{au.role === "admin" ? `${au.firstName}, équipe Navigoal` : `${au.firstName} ${au.lastName}`}</b> · {ROLE[au.role] ?? au.role}{m.onBehalfOf && au.role === "admin" ? ` · pour le compte de ${m.onBehalfOf}` : ""} · {dateFr(m.createdAt, true)}{m.internal && <span className="ml-1.5 rounded-full bg-sun-100 px-1.5 py-0.5 text-[10px] font-bold text-[#a55a00]">NOTE INTERNE</span>}</span>
                <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl border px-4 py-2.5 text-sm ${m.internal ? "border-[#ffe59a] bg-[#fff7dd]" : au.role === "admin" ? "border-[#c9d6ff] bg-brand-50" : pro ? "border-[#e6eaf3] bg-white" : "border-transparent bg-[#f1f4fb]"}`}>{m.body}</p>
              </div>
            );
          })}
        </div>
        <div className="border-t border-[#eef1f8] pt-3">
          <div className="mb-2 flex gap-1.5"><button onClick={() => setInterne(false)} className={`chip px-3 py-1.5 ${!interne ? "bg-brand-600 text-white" : "bg-[#eef1f8] text-ink-soft"}`}><Send size={13} className="mr-1 inline" />Répondre</button>
            <button onClick={() => setInterne(true)} className={`chip px-3 py-1.5 ${interne ? "bg-[#ffc21f] text-ink" : "bg-[#eef1f8] text-ink-soft"}`}><StickyNote size={13} className="mr-1 inline" />Note interne</button></div>
          <Textarea value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={5000} aria-label="Message"
            placeholder={interne ? "Visible de l'équipe et de l'école ou du bailleur uniquement…" : `Votre message, signé « Équipe Navigoal${ctx.pourLeCompteDe ? `, pour le compte de ${ctx.pourLeCompteDe}` : ""} »…`} />
          <FormError error={a.error} />
          <div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs text-ink-mute">{interne ? "Le candidat ne voit pas les notes internes." : "Copie par e-mail à tous les participants."}</span><Button icon={interne ? StickyNote : Send} loading={a.pending} disabled={!texte.trim()} onClick={envoyer}>{interne ? "Ajouter la note" : "Envoyer"}</Button></div>
        </div>
      </Panel>
      {ctx.type === "application" && <DossierRelais ctx={ctx} onDone={f.reload} />}
      {ctx.type === "booking" && <Panel title={`Réservation ${ctx.booking.number}`} icon={KeyRound}><StatusBadge status={ctx.booking.status} /><p className="text-sm">{ctx.booking.logement}</p><Link href="/admin/navilease" className="btn-ghost text-[13px]">Navilease · modération</Link></Panel>}
    </div>
  );
}

function DossierRelais({ ctx, onDone }: { ctx: Extract<Ctx, { type: "application" }>; onDone: () => void }) {
  const toast = useToast();
  const a = useAction();
  const [piece, setPiece] = useState("releve_notes");
  const [note, setNote] = useState("");
  const statut = (status: string, extra: Record<string, unknown> = {}) => a.run(async () => { await api(`/ecole/candidatures/${ctx.application.id}/statut`, { body: { status, note: note || undefined, ...extra } }); setNote(""); onDone(); toast("Dossier mis à jour, l'école est prévenue"); });
  const rendre = () => a.run(async () => { await api(`/admin/etablissements/${ctx.establishment.id}/accompagnement`, { body: { actif: false } }); onDone(); toast("Dossiers rendus à l'école"); });
  const ok = ctx.establishment.assisted;
  return (
    <Panel title={`Dossier ${ctx.application.number}`} icon={FileCheck2}>
      <div className="flex flex-wrap gap-1.5"><StatusBadge status={ctx.application.status} />{ok ? <Chip><LifeBuoy size={12} className="mr-1 inline" />Accompagné</Chip> : <Chip tone="grey">École autonome</Chip>}</div>
      <p className="text-sm"><b>{ctx.application.programme}</b><span className="block text-xs text-ink-mute">{ctx.establishment.nom} · envoyée le {dateFr(ctx.application.submittedAt)}</span></p>
      <div><b className="text-[12px] uppercase text-ink-mute">Pièces</b>
        <ul className="mt-1.5 flex flex-col gap-1 text-[13px]">{ctx.documents.map((d) => <li key={d.id} className="flex justify-between">{d.label ?? DOC_TYPES.find(([k]) => k === d.type)?.[1] ?? d.type}<CheckCircle2 size={15} className={d.status === "refuse" ? "text-[#d42a50]" : "text-[#0f8a46]"} /></li>)}{!ctx.documents.length && <li className="text-ink-mute">Aucune pièce jointe.</li>}</ul></div>
      <Field label="Note (envoyée au candidat avec le statut)">{(id) => <Input id={id} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      <div className="flex flex-col gap-2">
        <b className="text-[12px] uppercase text-ink-mute">Agir au nom de l&apos;école</b>
        <Button size="sm" variant="ghost" icon={FileCheck2} onClick={() => statut("en_verification")} loading={a.pending}>Passer « en vérification »</Button>
        <Button size="sm" variant="ghost" onClick={() => statut("complet")} loading={a.pending}>Dossier complet</Button>
        <div className="flex gap-2"><Select aria-label="Pièce à demander" value={piece} onChange={(e) => setPiece(e.target.value)} options={DOC_TYPES} className="py-2" /><Button size="sm" variant="ghost" onClick={() => statut("piece_demandee", { requestedDocuments: [piece] })}>Demander</Button></div>
        {ok ? (
          <div className="grid grid-cols-3 gap-1.5"><Button size="sm" icon={CheckCircle2} onClick={() => statut("acceptee")}>Accepter</Button><Button size="sm" variant="ghost" onClick={() => statut("liste_attente")}>Attente</Button><Button size="sm" variant="danger" icon={XCircle} onClick={() => statut("refusee")}>Refuser</Button></div>
        ) : <p className="flex items-start gap-2 rounded-xl bg-[#f6f8fe] p-3 text-xs text-ink-mute"><Gavel size={15} className="shrink-0" />Décision finale réservée à l&apos;école. Activez le mode accompagné pour décider à sa place.</p>}
      </div>
      <FormError error={a.error} />
      {ok && <Button size="sm" variant="quiet" icon={Undo2} onClick={rendre}>Rendre les dossiers à l&apos;école</Button>}
      <Alert tone="info">L&apos;école est prévenue de chaque action et peut reprendre la main. Tout est tracé dans le journal.</Alert>
    </Panel>
  );
}

// ---------------------------------------------------------------- Mode accompagné et Premium
type Acc = { ecoles: { id: string; nom: string; sigle: string; logo: string | null; ville: string; assisted: boolean; attente: number; membres: number; plan: string; premiumUntil: string | null }[]; bailleurs: { id: string; firstName: string; lastName: string; city: string | null; assisted: boolean; company: string | null; annonces: number; demandes: number }[] };

export function AdminAccompagnement() {
  const toast = useToast();
  const r = useApi<Acc>("/admin/accompagnement");
  const [q, setQ] = useState("");
  const a = useAction();
  const basculer = (url: string, actif: boolean, msg: string) => a.run(async () => { await api(url, { body: { actif } }); r.reload(); toast(msg); });
  const premium = (e: Acc["ecoles"][number]) => (e.plan === "premium" && (!e.premiumUntil || new Date(e.premiumUntil) > new Date()) ? e : null);
  return (
    <div className="min-w-0">
      <AdminHeader title="Mode accompagné et Premium" sub="Navigoal répond aux candidats et locataires à la place des comptes qui prennent la plateforme en main. Interrupteur manuel, sans bascule automatique." />
      <FormError error={a.error} />
      {r.error ? <LoadError error={r.error} reload={r.reload} /> : !r.data ? <Loading /> : (
        <div className="grid items-start gap-5 xl:grid-cols-[1.4fr_1fr]">
          <Panel title="Établissements" icon={Building2} action={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer…" className="w-44 py-2" aria-label="Filtrer" />}>
            <ul className="-mr-2 max-h-[70vh] divide-y divide-[#eef1f8] overflow-y-auto pr-2">
              {r.data.ecoles.filter((e) => !q || `${e.sigle} ${e.nom} ${e.ville}`.toLowerCase().includes(q.toLowerCase())).map((e) => {
                const p = premium(e);
                return (
                  <li key={e.id} className="flex flex-wrap items-center gap-3 py-3">
                    {e.logo ? <img src={e.logo} alt="" className="h-9 w-9 rounded-lg border border-slate-100 object-contain" /> : <Building2 size={20} className="text-ink-mute" />}
                    <span className="min-w-0 flex-1"><b className="text-sm">{e.sigle}</b> <span className="text-xs text-ink-mute">· {e.ville}</span><span className="block text-xs text-ink-mute">{e.attente} dossier{e.attente > 1 ? "s" : ""} en cours · {e.membres ? `${e.membres} compte${e.membres > 1 ? "s" : ""}` : "aucun compte actif"}</span></span>
                    <span className="flex items-center gap-2">
                      <button onClick={() => basculer(`/admin/etablissements/${e.id}/premium`, !p, p ? "Premium désactivé" : `Premium activé pour un an (${PRIX_PREMIUM_MAD.toLocaleString("fr-FR")} MAD)`)} className={`chip gap-1 px-2.5 py-1.5 ${p ? "bg-gradient-to-br from-[#ffd34a] to-[#f9a806] text-ink" : "bg-[#eef1f8] text-ink-mute"}`} title={p?.premiumUntil ? `Jusqu'au ${dateFr(p.premiumUntil)}` : "Activer Premium (un an)"}><Crown size={12} />{p ? "Premium" : "Gratuit"}</button>
                      <Chip tone={e.assisted ? "blue" : "grey"}>{e.assisted ? "Accompagné" : "Autonome"}</Chip>
                      <Toggle on={e.assisted} label={`Mode accompagné ${e.sigle}`} onChange={(v) => basculer(`/admin/etablissements/${e.id}/accompagnement`, v, v ? `${e.sigle} : mode accompagné activé` : `${e.sigle} : dossiers rendus à l'école`)} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <div className="flex flex-col gap-5">
            <Panel title="Bailleurs Navilease" icon={KeyRound}>
              {!r.data.bailleurs.length ? <p className="text-sm text-ink-mute">Aucun bailleur.</p> : (
                <ul className="divide-y divide-[#eef1f8]">{r.data.bailleurs.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1"><b className="text-sm">{b.company ?? `${b.firstName} ${b.lastName}`}</b><span className="block text-xs text-ink-mute">{b.city ?? ""} · {b.annonces} annonce{b.annonces > 1 ? "s" : ""} · <span className={b.demandes ? "font-bold text-[#d42a50]" : ""}>{b.demandes} demande{b.demandes > 1 ? "s" : ""} en attente</span></span></span>
                    <Toggle on={b.assisted} label={`Mode accompagné ${b.firstName}`} onChange={(v) => basculer(`/admin/bailleurs/${b.id}/accompagnement`, v, v ? "Mode accompagné activé" : "Mode accompagné désactivé")} />
                  </li>))}</ul>
              )}
              <Link href="/admin/messagerie" className="btn-ghost text-[13px]"><MessagesSquare size={15} />Échanges Navilease</Link>
            </Panel>
            <Alert tone="info" title="Ce que permet le mode accompagné">Répondre aux candidats au nom de l&apos;équipe Navigoal, faire avancer les dossiers et prendre les décisions d&apos;admission à la place de l&apos;école. L&apos;école ou le bailleur est prévenu de chaque action et peut reprendre la main.</Alert>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Campagnes de prospection à relire
type Prosp = { p: { id: string; subject: string; body: string; link: string | null; offer: string; status: string; audience: number; criteria: Record<string, unknown>; createdAt: string; reviewNote: string | null }; e: { id: string; sigle: string; nom: string } };

export function AdminProspection() {
  const toast = useToast();
  const r = useApi<Prosp[]>("/admin/prospections");
  const [note, setNote] = useState<Record<string, string>>({});
  const a = useAction();
  const decider = (id: string, valider: boolean) => a.run(async () => { const x = await api<{ envoyes: number }>(`/admin/prospections/${id}/validation`, { body: { valider, note: note[id] } }); r.reload(); toast(valider ? `Campagne envoyée à ${x.envoyes} élèves` : "Campagne refusée, l'école est prévenue"); });
  const attente = (r.data ?? []).filter((x) => x.p.status === "en_validation");
  return (
    <div className="min-w-0">
      <AdminHeader title="Prospection des écoles" sub="Chaque campagne Premium est relue avant envoi : pas de spam, pas de fausse promesse, 1 message par école et par élève tous les 30 jours." />
      <FormError error={a.error} />
      {r.loading ? <Loading /> : !r.data?.length ? <Empty icon={Send} title="Aucune campagne" /> : (
        <div className="flex flex-col gap-4">
          {!attente.length && <Alert tone="success">Aucune campagne en attente de relecture.</Alert>}
          {r.data.map((x) => (
            <Panel key={x.p.id} title={`${x.e.sigle} · ${x.p.subject}`} icon={Send} action={<StatusBadge status={x.p.status} label={{ en_validation: "À relire", envoyee: "Envoyée", refusee: "Refusée", validee: "Validée" }[x.p.status]} />}>
              <p className="text-xs text-ink-mute">{x.e.nom} · {x.p.audience} élève{x.p.audience > 1 ? "s" : ""} ciblé{x.p.audience > 1 ? "s" : ""} · {dateFr(x.p.createdAt, true)}{x.p.link ? ` · lien : ${x.p.link}` : ""}</p>
              <p className="whitespace-pre-wrap rounded-2xl bg-[#f6f8fe] p-4 text-sm">{x.p.body}</p>
              {x.p.status === "en_validation" ? (
                <div className="flex flex-wrap items-end gap-2"><Input value={note[x.p.id] ?? ""} onChange={(e) => setNote({ ...note, [x.p.id]: e.target.value })} placeholder="Note pour l'école (facultatif, obligatoire en cas de refus)" className="min-w-[260px] flex-1" aria-label="Note" />
                  <Button variant="danger" onClick={() => decider(x.p.id, false)} disabled={!note[x.p.id]}>Refuser</Button><Button icon={Send} onClick={() => decider(x.p.id, true)} loading={a.pending}>Valider et envoyer</Button></div>
              ) : x.p.reviewNote && <p className="text-xs text-ink-mute">Note : {x.p.reviewNote}</p>}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
