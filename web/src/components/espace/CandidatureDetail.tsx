"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Download, FileText, KeyRound, ListChecks, MessageCircle, Paperclip, Printer, Upload, UsersRound } from "lucide-react";
import { useState } from "react";
import { EtabLogo } from "@/components/ui/EtabLogo";
import { EtabPhoto } from "@/components/ui/EtabPhoto";
import { Alert, Button, Loading, PageHeader, Panel, StatusBadge, Timeline, dateFr, money, statusLabel, useToast } from "@/components/app/kit";
import { docLabel } from "@/components/app/form";
import { api, apiUrl } from "@/lib/api";
import { useAction, useApi } from "@/hooks/useApi";
import { PAYS_NOM, etabById, type PaysCode } from "@/lib/data";
import { ConversationThread } from "./Conversation";
import type { AppDetail, Payment } from "./types";

const FLOW = ["brouillon", "soumise", "paiement_confirme", "en_verification", "complet", "en_traitement"];
type Conv = { id: string; contextKind: string | null; contextId: string | null; unread: number }[];
type Housing = { id: string; title: string; quartier: string | null; rent: number; currency: string; verification: string; nearEstablishments: { id: string; minutes: number }[] }[];

export function CandidatureDetail({ id, asParent = false }: { id: string; asParent?: boolean }) {
  const toast = useToast();
  const params = useSearchParams();
  const d = useApi<AppDetail>(`/candidatures/${id}`);
  const convs = useApi<Conv>("/conversations");
  const pays = useApi<Payment[]>("/paiements");
  const a = useAction();
  const [firstMsg, setFirstMsg] = useState("");
  const conv = convs.data?.find((c) => c.contextKind === "application" && c.contextId === id);
  const etabId = d.data?.establishment.id;
  const near = useApi<Housing>(d.data?.application.status === "acceptee" && etabId ? `/logements?etablissement=${etabId}` : null);
  if (d.error) return <Alert tone="error" title="Candidature introuvable">{d.error.message}</Alert>;
  if (!d.data) return <Loading />;
  const { application: app, program: p, establishment: e, events, documents, missing } = d.data;
  const fee = (pays.data ?? []).find((x) => x.applicationId === id);
  const final = ["acceptee", "refusee", "desistee"].includes(app.status);
  const reached = new Set(events.map((x) => x.status));
  const steps = [
    ...FLOW.filter((s) => s !== "paiement_confirme" || p.applicationFee > 0).map((s) => {
      const ev = [...events].reverse().find((x) => x.status === s);
      const isCurrent = !final && app.status === s;
      return { title: statusLabel(s), date: ev ? dateFr(ev.createdAt, true) : undefined, note: ev?.note, state: (reached.has(s) ? (isCurrent ? "current" : "done") : "todo") as "done" | "current" | "todo" };
    }),
    final ? { title: statusLabel(app.status), date: dateFr(app.decidedAt ?? app.updatedAt, true), note: app.decisionNote, state: (app.status === "acceptee" ? "done" : "bad") as "done" | "bad" } : { title: "Décision", state: "todo" as const },
  ];
  const startConv = () => a.run(async () => { await api("/conversations", { body: { candidature: id, texte: firstMsg } }); setFirstMsg(""); await convs.reload(); toast("Message envoyé à l'établissement"); });
  const withdraw = () => { if (confirm("Te désister de cette candidature ?")) a.run(async () => { await api(`/candidatures/${id}/desister`, { method: "POST" }); await d.reload(); }); };

  return (
    <>
      <PageHeader crumbs={asParent ? [["Vue d'ensemble", "/parent"], [`#${app.number}`]] : [["Mes candidatures", "/espace/candidatures"], [`#${app.number}`]]}
        title={<span className="flex items-center gap-4"><EtabLogo e={etabById[e.id] ?? e} size={56} /><span>{p.title}</span></span>} badge={<StatusBadge status={app.status} />}
        sub={`${e.nom} · ${e.ville.split("/")[0].trim()}, ${PAYS_NOM[e.pays as PaysCode]} · candidature #${app.number}`}
        actions={<><Button variant="ghost" icon={Printer} onClick={() => window.print()}>Imprimer</Button>{app.submittedAt && <a href={apiUrl(`/candidatures/${id}/bordereau.pdf`)} target="_blank" className="btn-ghost"><Download size={16} />Bordereau PDF</a>}</>} />
      {params.get("paiement") === "parent" && <div className="mb-5"><Alert tone="info" title="Demande de paiement envoyée à ton parent">Ton dossier est enregistré ; il passera au statut « Paiement confirmé » dès que ton parent aura réglé les frais.</Alert></div>}
      {app.status === "piece_demandee" && (
        <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-5">
          <Alert tone="error" title={`Pièce demandée par ${e.sigle} : ${app.requestedDocuments.map(docLabel).join(", ")}`} action={asParent ? undefined : <Link href={`/espace/candidatures/nouvelle?id=${id}`} className="btn bg-[#d42a50] py-2.5 text-white"><Upload size={16} />Déposer la pièce</Link>}>
            {app.decisionNote ?? "Ajoute la pièce puis renvoie ton dossier pour poursuivre l'étude de ta candidature."}
          </Alert>
        </motion.div>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1fr_360px]">
        <Panel title="Suivi du dossier" icon={ListChecks} action={<span className="chip bg-[#e8f8ef] text-[#0f8a46]">{steps.filter((s) => s.state === "done").length} / {steps.length} étapes</span>}>
          <Timeline steps={steps} />
          {!asParent && !final && app.status !== "brouillon" && <button onClick={withdraw} className="self-start text-xs font-bold text-ink-mute underline">Me désister</button>}
        </Panel>
        <div className="flex flex-col gap-6">
          <Panel title="Pièces jointes" icon={Paperclip} action={<Link href="/espace/documents" className="text-[13px] font-bold text-brand-600">Gérer</Link>}>
            {documents.map((doc) => (
              <a key={doc.id} href={apiUrl(`/documents/${doc.id}/fichier`)} target="_blank" className="flex items-center gap-3 rounded-2xl border border-[#eef1f8] p-3 hover:border-brand-200">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><FileText size={18} /></span>
                <span className="min-w-0 flex-1"><b className="block text-sm">{docLabel(doc.type)}</b><span className="block truncate text-xs text-ink-mute">{doc.fileName} · {(doc.size / 1024).toFixed(0)} Ko</span></span>
                <StatusBadge status={doc.status} />
              </a>
            ))}
            {missing.map((t) => <div key={t} className="flex items-center gap-3 rounded-2xl border border-[#ffd0d9] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffecef] text-[#d42a50]"><AlertCircle size={18} /></span><b className="flex-1 text-sm">{docLabel(t)}</b><span className="chip bg-[#ffecef] text-[#d42a50]">Manquante</span></div>)}
            {!documents.length && !missing.length && <p className="text-sm text-ink-mute">Aucune pièce jointe.</p>}
          </Panel>
          <Panel title={`Messages avec ${e.sigle}`} icon={MessageCircle}>
            {conv ? <ConversationThread id={conv.id} compact /> : asParent ? <p className="text-sm text-ink-mute">Aucun échange avec l&apos;établissement pour l&apos;instant.</p> : app.status === "brouillon" ? <p className="text-sm text-ink-mute">Envoie ta candidature pour pouvoir échanger avec l&apos;établissement.</p> : (
              <div className="flex flex-col gap-2">
                <textarea value={firstMsg} onChange={(ev) => setFirstMsg(ev.target.value)} className="input min-h-[90px]" placeholder={`Une question pour ${e.sigle} sur ta candidature ?`} aria-label="Premier message" />
                <Button onClick={startConv} loading={a.pending} disabled={!firstMsg.trim()} className="self-end">Envoyer</Button>
              </div>
            )}
          </Panel>
        </div>
        <div className="flex flex-col gap-6">
          <section className="card flex flex-col gap-3 rounded-[22px] p-5">
            <div className="flex items-center gap-3"><EtabLogo e={etabById[e.id] ?? e} size={44} /><span><b className="block">{e.sigle}</b><span className="text-xs text-ink-mute">{e.ville.split("/")[0].trim()}</span></span></div>
            {etabById[e.id] && <EtabPhoto e={etabById[e.id]} className="h-36" />}
            {[["Formation", p.title], ["Durée", p.durationYears ? `${p.durationYears} ans` : "—"], ["Rentrée", p.startDate ?? "Septembre"], ["Frais de dossier", p.applicationFee ? `${money(p.applicationFee, p.currency)}${fee ? ` · ${statusLabel(fee.status).toLowerCase()}` : ""}` : "Aucun"]].map(([k, v]) => <div key={k} className="flex justify-between gap-3 text-[13px]"><span className="text-ink-mute">{k}</span><b className="text-right">{v}</b></div>)}
            {fee && fee.status === "en_attente" && <Link href={`/paiement/${fee.reference}`} className="btn-primary py-2.5">Finaliser le paiement</Link>}
          </section>
          {app.status === "acceptee" && (
            <Panel tone="green" title="Tu es admis·e ! 🎉" icon={CheckCircle2}>
              <span className="text-[13px] text-ink-mute">Décision du {dateFr(app.decidedAt)}{app.decisionNote ? ` · « ${app.decisionNote} »` : ""}</span>
              <a href={apiUrl(`/candidatures/${id}/attestation.pdf`)} target="_blank" className="btn-primary py-2.5"><Download size={16} />Attestation d&apos;admission</a>
              {!asParent && <Link href="/espace/profil#parent" className="btn-ghost py-2.5"><UsersRound size={16} />Partager avec mon parent</Link>}
            </Panel>
          )}
          {app.status === "acceptee" && (
            <Panel tone="sun" title="Logements Navilease proches" icon={KeyRound}>
              {(near.data ?? []).slice(0, 3).map((h) => <Link key={h.id} href={`/navilease/logements/${h.id}`} className="flex flex-col rounded-2xl bg-white p-3 text-[13px] hover:shadow-card"><b>{h.title}</b><span className="text-ink-mute">{h.nearEstablishments.find((n) => n.id === e.id)?.minutes ?? "—"} min · {money(h.rent, h.currency)} / mois</span></Link>)}
              {near.data && !near.data.length && <p className="text-[13px] text-ink-mute">De nouveaux logements vérifiés arrivent près de {e.sigle}. Crée une alerte pour être prévenu·e.</p>}
              <Link href={`/navilease/logements?etablissement=${e.id}`} className="btn-primary py-2.5">Voir tous les logements</Link>
            </Panel>
          )}
        </div>
      </div>
      {a.error && <p className="mt-3 text-sm font-semibold text-[#d42a50]">{a.error}</p>}
    </>
  );
}
