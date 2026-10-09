"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, CircleX, Download, ExternalLink, FilePlus2, FileText, Gavel, Hourglass, ImageIcon, ListChecks, Mail, MessageCircle, Phone, Search, Send, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Avatar, Button, Chip, Dialog, Empty, Loading, PageHeader, Panel, StatusBadge, Timeline, dateFr, statusLabel, useToast } from "@/components/app/kit";
import { Check, Field, FormError, Textarea, docLabel } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api, apiUrl } from "@/lib/api";
import { useEcole } from "./EcoleContext";
import { CountryTag, SCHOOL_DOC_TYPES, SCHOOL_TRANSITIONS, octets, type AppRow, type AppStatus, type Program } from "./shared";

type Doc = { id: string; type: string; fileName: string; size: number; mime: string; status: string; createdAt: string; label: string | null };
type Detail = {
  application: { id: string; number: string; status: AppStatus; motivation: string | null; answers: Record<string, string>; requestedDocuments: string[]; decisionNote: string | null; submittedAt: string | null; decidedAt: string | null; campaignId: string | null };
  program: Program;
  student: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; country: string | null; city: string | null; birthYear: number | null };
  events: { id: string; status: AppStatus; note: string | null; createdAt: string; authorId: string | null }[];
  documents: Doc[];
  missing: string[];
};
type Conv = { id: string; contextKind: string | null; contextId: string | null; unread: number; lastMessageAt: string };

const OPTION: Partial<Record<AppStatus, { label: string; hint: string; icon: typeof CheckCircle2; color: string }>> = {
  en_verification: { label: "Passer en vérification", hint: "Vous contrôlez les pièces du dossier.", icon: Search, color: "text-[#a55a00]" },
  complet: { label: "Dossier complet", hint: "Toutes les pièces sont conformes.", icon: ListChecks, color: "text-[#6a3df0]" },
  en_traitement: { label: "Mettre en traitement", hint: "Étude pédagogique, entretien ou concours.", icon: Hourglass, color: "text-[#6a3df0]" },
  acceptee: { label: "Accepter", hint: "Le candidat reçoit son attestation d'admission.", icon: CheckCircle2, color: "text-[#0f8a46]" },
  liste_attente: { label: "Liste d'attente", hint: "Décision reportée selon les places disponibles.", icon: Hourglass, color: "text-[#a55a00]" },
  refusee: { label: "Refuser", hint: "Décision définitive, motivez-la pour le candidat.", icon: CircleX, color: "text-[#d42a50]" },
  piece_demandee: { label: "Demander une pièce", hint: "Le candidat est notifié par e-mail et SMS.", icon: FilePlus2, color: "text-[#d42a50]" },
};
const TEMPLATE: Partial<Record<AppStatus, string>> = {
  acceptee: "Félicitations ! Nous avons le plaisir de vous annoncer votre admission. Vous recevrez prochainement les modalités d'inscription.",
  refusee: "Après étude attentive de votre dossier, nous ne pouvons malheureusement pas donner une suite favorable à votre candidature.",
  liste_attente: "Votre dossier a retenu notre attention. Vous êtes placé·e sur liste d'attente ; nous reviendrons vers vous dès qu'une place se libère.",
};

export function Dossier({ id }: { id: string }) {
  const { eid, link } = useEcole();
  const toast = useToast();
  const d = useApi<Detail>(`/candidatures/${id}`);
  const list = useApi<AppRow[]>(`/ecole/${eid}/candidatures`);
  const convs = useApi<Conv[]>("/conversations");
  const [docId, setDocId] = useState<string | null>(null);
  const [choice, setChoice] = useState<AppStatus | null>(null);
  const [note, setNote] = useState("");
  const [askOpen, setAskOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const act = useAction();

  const nav = useMemo(() => {
    const rows = list.data ?? [];
    const i = rows.findIndex((r) => r.a.id === id);
    return i < 0 ? null : { i, n: rows.length, prev: rows[i - 1]?.a.id, next: rows[i + 1]?.a.id };
  }, [list.data, id]);

  const crumbs: [string, string?][] = [["Candidatures", link("/etablissement/candidatures")], [d.data ? `#${d.data.application.number}` : "Dossier"]];
  if (d.loading) return <><PageHeader title="Dossier candidat" crumbs={crumbs} /><Loading label="Chargement du dossier…" /></>;
  if (d.error) return <><PageHeader title="Dossier candidat" crumbs={crumbs} /><Alert tone="error" title="Dossier inaccessible" action={<Link href={link("/etablissement/candidatures")} className="btn-ghost px-3.5 py-2 text-[13px]">Retour aux candidatures</Link>}>{d.error.message}</Alert></>;

  const { application: a, program: p, student: s, events, documents, missing } = d.data!;
  const name = `${s.firstName} ${s.lastName}`;
  const allowed = SCHOOL_TRANSITIONS[a.status] ?? [];
  const doc = documents.find((x) => x.id === docId) ?? documents[0];
  const conv = (convs.data ?? []).find((c) => c.contextKind === "application" && c.contextId === a.id);
  const age = s.birthYear ? new Date().getFullYear() - s.birthYear : null;

  const pick = (st: AppStatus) => {
    if (st === "piece_demandee") { setAskOpen(true); return; }
    setChoice(st);
    setNote((n) => (!n || Object.values(TEMPLATE).includes(n) ? TEMPLATE[st] ?? "" : n));
  };
  const send = async (body: { status: AppStatus; note?: string; requestedDocuments?: string[] }) => {
    const r = await act.run(() => api(`/ecole/candidatures/${a.id}/statut`, { body }));
    if (!r) return false;
    toast(body.status === "piece_demandee" ? "Demande de pièce envoyée au candidat." : `Statut mis à jour : ${statusLabel(body.status)}.`);
    setChoice(null); setNote(""); setConfirm(false); setAskOpen(false);
    d.reload(); list.reload();
    return true;
  };
  const submit = () => {
    if (!choice) return;
    if (choice === "acceptee" || choice === "refusee") setConfirm(true);
    else send({ status: choice, note: note.trim() || undefined });
  };

  const steps = events.map((e, i) => ({
    title: statusLabel(e.status), date: dateFr(e.createdAt, true), note: e.note,
    state: (e.status === "refusee" || e.status === "desistee" ? "bad" : i === events.length - 1 && e.status !== "acceptee" ? "current" : "done") as "bad" | "current" | "done",
  }));

  return (
    <>
      <PageHeader crumbs={crumbs} title={`Dossier de ${name}`} badge={<><StatusBadge status={a.status} /><Chip tone="violet">{p.title}</Chip></>}
        actions={nav && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 text-sm text-ink-mute">
            <NavBtn href={nav.prev && link(`/etablissement/candidatures/${nav.prev}`)} label="Dossier précédent"><ChevronLeft size={17} /></NavBtn>
            <span className="px-1">Dossier {nav.i + 1} sur {nav.n}</span>
            <NavBtn href={nav.next && link(`/etablissement/candidatures/${nav.next}`)} label="Dossier suivant"><ChevronRight size={17} /></NavBtn>
          </div>
        )} />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px] xl:grid-cols-[300px_1fr_360px] [&>*]:min-w-0">
        {/* Colonne candidat */}
        <div className="flex flex-col gap-5 lg:col-span-2 lg:grid lg:grid-cols-2 xl:col-span-1 xl:flex">
          <Panel>
            <div className="flex items-center gap-3">
              <Avatar name={name} size={54} />
              <div className="min-w-0"><b className="block truncate text-lg">{name}</b><span className="text-[13px] text-ink-mute">{[age && `${age} ans`, s.city].filter(Boolean).join(" · ") || "—"}</span></div>
            </div>
            <div className="flex flex-wrap gap-2"><CountryTag code={s.country} />{age !== null && age < 18 && <Chip tone="sun">Mineur · parent garant</Chip>}</div>
            <dl className="flex flex-col gap-2 text-sm">
              <Row k="N° de dossier" v={`#${a.number}`} />
              <Row k="Envoyée le" v={dateFr(a.submittedAt)} />
              <Row k="Formation" v={p.title} />
              {a.decidedAt && <Row k="Décision le" v={dateFr(a.decidedAt)} />}
            </dl>
            <div className="flex flex-col gap-2 border-t border-[#eef1f8] pt-4 text-sm">
              {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-2 truncate text-ink-soft hover:text-brand-600"><Mail size={15} className="shrink-0" />{s.email}</a>}
              {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-ink-soft hover:text-brand-600"><Phone size={15} />{s.phone}</a>}
            </div>
          </Panel>
          <Panel title="Lettre de motivation" icon={UserRound}>
            {a.motivation ? <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{a.motivation}</p> : <p className="text-sm text-ink-mute">Aucune lettre de motivation jointe.</p>}
            {Object.entries(a.answers).map(([q, r]) => <div key={q} className="text-sm"><b className="block">{q}</b><span className="text-ink-soft">{r}</span></div>)}
          </Panel>
        </div>

        {/* Pièces */}
        <section className="card flex flex-col overflow-hidden rounded-[22px] lg:row-start-2 xl:row-start-auto">
          {doc ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f8] px-5 py-4">
                <div className="min-w-0"><b className="block truncate">{doc.label ?? docLabel(doc.type)}</b><span className="text-xs text-ink-mute">{doc.fileName} · {octets(doc.size)}</span></div>
                <div className="flex gap-2">
                  <a href={apiUrl(`/documents/${doc.id}/fichier`)} target="_blank" rel="noopener" className="btn-ghost px-3 py-2 text-[13px]"><ExternalLink size={15} />Ouvrir</a>
                  <a href={apiUrl(`/documents/${doc.id}/fichier`)} download={doc.fileName} className="btn-ghost px-3 py-2 text-[13px]"><Download size={15} />Télécharger</a>
                </div>
              </div>
              <div className="flex h-[380px] items-center justify-center bg-[#eef1f8] p-3 sm:h-[460px]">
                <AnimatePresence mode="wait">
                  <motion.div key={doc.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
                    {doc.mime.startsWith("image/")
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={apiUrl(`/documents/${doc.id}/fichier`)} alt={docLabel(doc.type)} className="h-full w-full rounded-xl object-contain" />
                      : <iframe src={apiUrl(`/documents/${doc.id}/fichier`)} title={`Aperçu : ${docLabel(doc.type)}`} className="h-full w-full rounded-xl border-0 bg-white" />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          ) : <div className="p-5"><Empty icon={FileText} title="Aucune pièce jointe" text="Le candidat n'a joint aucun document à ce dossier." /></div>}
          <div className="flex flex-col gap-2 p-5">
            <span className="text-[11px] font-extrabold uppercase text-ink-mute">Pièces ({documents.length}{missing.length ? ` · ${missing.length} manquante${missing.length > 1 ? "s" : ""}` : ""})</span>
            {documents.map((x) => (
              <button key={x.id} onClick={() => setDocId(x.id)} aria-pressed={doc?.id === x.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${doc?.id === x.id ? "border-[#b9a6fb] bg-[#f8f6ff]" : "border-slate-200 hover:border-[#d9cffd]"}`}>
                {x.mime.startsWith("image/") ? <ImageIcon size={17} className="shrink-0 text-ink-mute" /> : <FileText size={17} className="shrink-0 text-ink-mute" />}
                <span className="min-w-0 flex-1"><b className="block truncate">{x.label ?? docLabel(x.type)}</b><span className="block truncate text-xs text-ink-mute">{x.fileName}</span></span>
                <CheckCircle2 size={18} className="shrink-0 text-[#0f8a46]" aria-label="Déposée" />
              </button>
            ))}
            {missing.map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-dashed border-[#ffc2cf] bg-[#fff6f8] px-4 py-3 text-sm">
                <AlertTriangle size={17} className="shrink-0 text-[#d42a50]" /><span className="flex-1"><b>{docLabel(t)}</b><span className="block text-xs text-ink-mute">{a.requestedDocuments.includes(t) ? "Demandée au candidat" : "Pièce requise manquante"}</span></span>
              </div>
            ))}
          </div>
        </section>

        {/* Décision + historique */}
        <div className="flex flex-col gap-5">
          <section className="card flex flex-col gap-4 rounded-[22px] border-2 border-[#e3dbff] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-[17px] font-extrabold"><Gavel size={18} className="text-[#6a3df0]" />Décision</h2><StatusBadge status={a.status} /></div>
            {allowed.length === 0 ? (
              <p className="text-sm text-ink-mute">{a.status === "acceptee" || a.status === "refusee" ? "La décision a été notifiée au candidat." : a.status === "desistee" ? "Le candidat s'est désisté." : "Aucune action n'est possible à ce stade."}{a.decisionNote && <span className="mt-2 block rounded-xl bg-[#f6f8fe] p-3 italic">« {a.decisionNote} »</span>}</p>
            ) : (
              <>
                <div className="flex flex-col gap-2" role="radiogroup" aria-label="Nouvelle étape du dossier">
                  {allowed.map((st) => {
                    const o = OPTION[st]!;
                    const on = choice === st;
                    return (
                      <button key={st} role="radio" aria-checked={on} onClick={() => pick(st)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${on ? "border-2 border-[#0f8a46] bg-[#effbf3]" : "border-slate-200 hover:border-[#b9a6fb]"}`}>
                        <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-[#0f8a46]" : "border-slate-300"}`}>{on && <span className="h-2 w-2 rounded-full bg-[#0f8a46]" />}</span>
                        <o.icon size={17} className={`shrink-0 ${o.color}`} />
                        <span className="flex flex-col"><b className="text-sm">{o.label}</b><span className="text-xs text-ink-mute">{o.hint}</span></span>
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {choice && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-col gap-3 overflow-hidden">
                      <Field label="Message au candidat" hint="Visible par le candidat (et ses parents liés) dans sa notification.">{(fid) => <Textarea id={fid} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="Message facultatif…" />}</Field>
                      <FormError error={act.error} />
                      <Button onClick={submit} loading={act.pending} icon={Send} className={choice === "refusee" ? "!bg-[#d42a50] hover:!bg-[#b81f43]" : choice === "acceptee" ? "!bg-[#0f8a46] hover:!bg-[#0b6b37]" : ""}>Valider et notifier</Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </section>

          <Panel title="Échanges avec le candidat" icon={MessageCircle}>
            {convs.loading ? <Loading /> : conv ? (
              <Link href={`/messages/${conv.id}`} className="btn-ghost w-full"><MessageCircle size={17} />Ouvrir la conversation{conv.unread > 0 && <span className="rounded-full bg-sun-400 px-2 text-xs font-bold text-ink">{conv.unread}</span>}</Link>
            ) : (
              <p className="text-sm text-ink-mute">Aucune conversation pour ce dossier. Sur Navigoal, c&apos;est le candidat qui ouvre l&apos;échange depuis sa candidature ; vous serez notifié à son premier message.{s.email && <> En attendant, vous pouvez lui écrire à <a className="font-bold text-brand-600" href={`mailto:${s.email}`}>{s.email}</a>.</>}</p>
            )}
          </Panel>

          <Panel title="Historique" icon={Hourglass}>
            {steps.length ? <Timeline steps={steps} /> : <p className="text-sm text-ink-mute">Aucun événement.</p>}
          </Panel>
        </div>
      </div>

      <RequestDialog open={askOpen} onClose={() => { setAskOpen(false); act.setError(null); }} pending={act.pending} error={act.error} defaults={missing}
        onSend={(docs, n) => send({ status: "piece_demandee", requestedDocuments: docs, note: n || undefined })} />

      <Dialog open={confirm} onClose={() => setConfirm(false)} title={choice === "acceptee" ? "Confirmer l'admission" : "Confirmer le refus"}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-soft">{choice === "acceptee" ? <>Vous allez <b>admettre {name}</b> en {p.title}. Le candidat et ses parents liés seront notifiés par e-mail et SMS, et l&apos;attestation d&apos;admission deviendra disponible.</> : <>Vous allez <b>refuser la candidature de {name}</b>. Cette décision est définitive et sera notifiée par e-mail et SMS.</>}</p>
          {note && <blockquote className="rounded-xl bg-[#f6f8fe] p-3 text-sm italic text-ink-soft">« {note} »</blockquote>}
          <FormError error={act.error} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="quiet" onClick={() => setConfirm(false)}>Annuler</Button>
            <Button variant={choice === "refusee" ? "danger" : "primary"} loading={act.pending} onClick={() => choice && send({ status: choice, note: note.trim() || undefined })}>{choice === "acceptee" ? "Confirmer l'admission" : "Confirmer le refus"}</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function RequestDialog({ open, onClose, onSend, pending, error, defaults }: { open: boolean; onClose: () => void; onSend: (docs: string[], note: string) => void; pending: boolean; error: string | null; defaults: string[] }) {
  const [docs, setDocs] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const sel = touched ? docs : defaults;
  return (
    <Dialog open={open} onClose={onClose} title="Demander une pièce complémentaire" wide>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (sel.length) onSend(sel, note.trim()); }}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-bold">Pièces à fournir <span className="text-[#d42a50]">*</span></legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SCHOOL_DOC_TYPES.map(([v, l]) => <Check key={v} checked={sel.includes(v)} onChange={(c) => { setTouched(true); setDocs(c ? [...sel, v] : sel.filter((x) => x !== v)); }}>{l}</Check>)}
          </div>
          {touched && !sel.length && <span className="text-xs font-semibold text-[#d42a50]">Sélectionnez au moins une pièce.</span>}
        </fieldset>
        <Field label="Précisions pour le candidat">{(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="Ex. : relevé de notes du 2e trimestre, certifié conforme." />}</Field>
        <Alert tone="info">Le dossier passe au statut « Pièce demandée ». Le candidat est notifié par e-mail et SMS et pourra déposer la pièce depuis son espace.</Alert>
        <FormError error={error} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="quiet" onClick={onClose}>Annuler</Button>
          <Button type="submit" icon={FilePlus2} loading={pending} disabled={!sel.length}>Envoyer la demande</Button>
        </div>
      </form>
    </Dialog>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-3"><dt className="text-ink-mute">{k}</dt><dd className="text-right font-bold">{v}</dd></div>;
function NavBtn({ href, label, children }: { href?: string | false; label: string; children: React.ReactNode }) {
  if (!href) return <span className="flex h-8 w-8 items-center justify-center rounded-lg opacity-30" aria-hidden>{children}</span>;
  return <Link href={href} aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink hover:bg-[#f1edff]">{children}</Link>;
}
