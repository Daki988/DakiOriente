"use client";
import { BadgeCheck, CalendarClock, Copy, Landmark, ShieldAlert, Wallet } from "lucide-react";
import { useState } from "react";
import { Alert, Button, Chip, Panel, dateFr, money, useToast } from "@/components/app/kit";
import { FileDrop, FormError, Input, Select } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

export type Ligne = { id: string; libelle: string; montant: number; echeance: string; etat: "payee" | "declaree" | "a_payer" | "en_retard"; confirme: number; declare: number; reste: number };
export type Moyen = { id: string; type: string; libelle: string; details: string; devise: string; statut: string };
export type Paiement = { id: string; ligneId: string; montant: number; devise: string; reference: string | null; statut: string; motif: string | null; createdAt: string; payeur: { firstName: string; lastName: string; role: string } };
export type Echeancier = { id: string; devise: string; lignes: Ligne[]; total: number; paye: number; remboursement: string | null; inscriptionConfirmee: string | null; moyens: Moyen[]; paiements: Paiement[] };
export const ETAT: Record<Ligne["etat"], [string, "green" | "blue" | "grey" | "rose"]> = { payee: ["Payée", "green"], declaree: ["Preuve envoyée, en attente de l'école", "blue"], a_payer: ["À payer", "grey"], en_retard: ["En retard", "rose"] };
const PAI: Record<string, [string, "green" | "blue" | "rose"]> = { declare: ["En attente de l'école", "blue"], confirme: ["Reçu par l'école", "green"], refuse: ["Non reçu par l'école", "rose"] };

/** Candidature acceptée : échéancier fixé par l'école, moyens de paiement officiels vérifiés, déclaration d'un paiement avec preuve. */
export function ScolaritePaiement({ applicationId, ecole }: { applicationId: string; ecole: string }) {
  const { data, reload } = useApi<{ echeancier: Echeancier | null }>(`/candidatures/${applicationId}/scolarite`);
  const [ligne, setLigne] = useState<Ligne | null>(null);
  const [f, setF] = useState({ montant: "", moyenId: "", reference: "", preuveId: "", preuveNom: "" });
  const a = useAction();
  const toast = useToast();
  const e = data?.echeancier;
  if (!data) return null;
  if (!e) return (
    <Panel title="Inscription définitive et paiement" icon={Wallet}>
      <p className="text-sm text-ink-soft">{ecole} va indiquer ici les frais d&apos;inscription et de scolarité, leurs échéances et ses moyens de paiement officiels. Vous serez prévenu·e dès que c&apos;est fait.</p>
    </Panel>
  );
  const ouvrir = (l: Ligne) => { setLigne(l); setF({ montant: String(l.reste), moyenId: e.moyens.length === 1 ? e.moyens[0].id : "", reference: "", preuveId: "", preuveNom: "" }); };
  const envoyer = async () => {
    if (!ligne) return;
    const r = await a.run(() => api(`/candidatures/${applicationId}/scolarite/paiements`, { method: "POST", body: { ligneId: ligne.id, montant: Number(f.montant.replace(/\D/g, "")), moyenId: f.moyenId, reference: f.reference || null, preuveId: f.preuveId } }));
    if (r) { toast(`Preuve envoyée à ${ecole}, qui va confirmer la réception.`); setLigne(null); reload(); }
  };
  const copier = (t: string) => { navigator.clipboard?.writeText(t).then(() => toast("Copié")).catch(() => {}); };
  return (
    <div id="scolarite" className="scroll-mt-24">
      <Panel title="Inscription définitive et paiement" icon={Wallet} action={e.inscriptionConfirmee ? <Chip tone="green">Inscription confirmée le {dateFr(e.inscriptionConfirmee)}</Chip> : undefined}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <span className="text-sm text-ink-soft">Payé et confirmé par {ecole} : <b className="text-ink">{money(e.paye, e.devise)}</b> sur {money(e.total, e.devise)}</span>
            <span className="h-2 min-w-[160px] flex-1 overflow-hidden rounded-full bg-[#eef1f8] sm:max-w-xs"><span className="block h-full rounded-full bg-[#14a34a]" style={{ width: `${e.total ? Math.min(100, (e.paye / e.total) * 100) : 0}%` }} /></span>
          </div>
          <ul className="flex flex-col divide-y divide-slate-100 rounded-2xl border border-slate-200">{e.lignes.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5">
              <span className="min-w-0"><b className="block">{l.libelle}</b><span className="flex items-center gap-1 text-xs text-ink-mute"><CalendarClock size={13} />Avant le {dateFr(l.echeance)}</span></span>
              <span className="flex flex-wrap items-center gap-3"><b>{money(l.montant, e.devise)}</b><Chip tone={ETAT[l.etat][1]}>{ETAT[l.etat][0]}</Chip>
                {l.reste > 0 && !!e.moyens.length && <Button size="sm" onClick={() => ouvrir(l)}>J&apos;ai payé : envoyer la preuve</Button>}</span>
            </li>
          ))}</ul>
          {e.moyens.length ? (
            <div className="flex flex-col gap-2">
              <b className="flex items-center gap-2 text-sm"><Landmark size={16} className="text-brand-600" />Moyens de paiement officiels de {ecole}</b>
              {e.moyens.map((m) => (
                <div key={m.id} className="flex flex-col gap-1 rounded-2xl bg-[#f6f8fe] p-3.5 text-sm">
                  <span className="flex flex-wrap items-center justify-between gap-2"><b>{m.libelle}</b><span className="flex items-center gap-1 text-xs font-bold text-[#0b7a3d]"><BadgeCheck size={14} />Vérifié par Navigoal</span></span>
                  <p className="whitespace-pre-line break-words font-mono text-[13px] text-ink-soft">{m.details}</p>
                  <button type="button" onClick={() => copier(m.details)} className="flex items-center gap-1 self-start text-xs font-bold text-brand-600"><Copy size={13} />Copier</button>
                </div>
              ))}
              <p className="flex gap-2 text-xs text-ink-mute"><ShieldAlert size={15} className="shrink-0 text-[#a55a00]" />Payez uniquement avec ces coordonnées, vérifiées par l&apos;équipe Navigoal. Si quelqu&apos;un vous en donne d&apos;autres (e-mail, WhatsApp), ne payez pas et prévenez-nous. Navigoal n&apos;encaisse rien : vous payez l&apos;école directement.</p>
            </div>
          ) : <Alert tone="warn">Les coordonnées de paiement de {ecole} sont en cours de vérification par l&apos;équipe Navigoal. Attendez qu&apos;elles s&apos;affichent ici avant de payer.</Alert>}
          {e.remboursement && <details className="text-sm"><summary className="cursor-pointer font-bold">Conditions de remboursement de l&apos;école (refus de visa, désistement)</summary><p className="mt-2 whitespace-pre-line text-ink-soft">{e.remboursement}</p></details>}
          {ligne && (
            <div className="flex flex-col gap-3 rounded-2xl border-2 border-brand-200 p-4">
              <b>Déclarer un paiement : {ligne.libelle}</b>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Montant payé ({e.devise})</span><Input inputMode="numeric" value={f.montant} onChange={(x) => setF({ ...f, montant: x.target.value.replace(/[^\d ]/g, "") })} /></label>
                <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Moyen utilisé</span><Select value={f.moyenId} onChange={(x) => setF({ ...f, moyenId: x.target.value })} options={e.moyens.map((m) => [m.id, m.libelle])} placeholder="Choisir" aria-label="Moyen de paiement" /></label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Référence du virement ou du reçu <span className="font-normal text-ink-mute">(facultatif)</span></span><Input value={f.reference} onChange={(x) => setF({ ...f, reference: x.target.value })} maxLength={120} /></label>
              <div className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Preuve de paiement (reçu, avis de virement)</span>
                {f.preuveId ? <span className="flex items-center gap-2 font-semibold text-[#0b7a3d]"><BadgeCheck size={16} />{f.preuveNom}</span> : <FileDrop type="autre" libelle={`Preuve de paiement — ${ligne.libelle}`} compact onUploaded={(d) => setF({ ...f, preuveId: d.id, preuveNom: d.fileName })} />}</div>
              <FormError error={a.error} />
              <div className="flex gap-2"><Button onClick={envoyer} loading={a.pending} disabled={!f.preuveId || !f.moyenId || !Number(f.montant.replace(/\D/g, ""))}>Envoyer à {ecole}</Button><Button variant="ghost" onClick={() => setLigne(null)}>Annuler</Button></div>
            </div>
          )}
          {!!e.paiements.length && (
            <div className="flex flex-col gap-2"><b className="text-sm">Historique</b>
              {e.paiements.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>{dateFr(p.createdAt)} · {money(p.montant, p.devise)} · {e.lignes.find((l) => l.id === p.ligneId)?.libelle} · par {p.payeur.firstName}{p.reference ? ` · réf. ${p.reference}` : ""}</span>
                  <span className="flex items-center gap-2"><Chip tone={PAI[p.statut]?.[1]}>{PAI[p.statut]?.[0]}</Chip>{p.motif && <span className="text-xs text-[#b8213f]">{p.motif}</span>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
