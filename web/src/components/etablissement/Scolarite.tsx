"use client";
import { BadgeCheck, CalendarPlus, CheckCircle2, Landmark, Plus, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { Alert, Button, Chip, Empty, Loading, PageHeader, Panel, dateFr, money, useToast } from "@/components/app/kit";
import { FormError, Input, Select, Textarea } from "@/components/app/form";
import { useAction, useApi } from "@/hooks/useApi";
import { api, apiUrl } from "@/lib/api";
import { useEcole } from "./EcoleContext";
import type { AppRow } from "./shared";
import type { Echeancier } from "@/components/espace/ScolaritePaiement";

type Moyen = { id: string; type: string; libelle: string; details: string; devise: string; statut: string };
type Tableau = {
  aConfirmer: { id: string; montant: number; devise: string; reference: string | null; preuveId: string | null; createdAt: string; ligne: string; programme: string; applicationId: string; eleve: { firstName: string; lastName: string }; payeur: { firstName: string; lastName: string; role: string } }[];
  echeanciers: { applicationId: string; eleve: { firstName: string; lastName: string }; programme: string; devise: string; total: number; paye: number; inscriptionConfirmee: string | null; prochaine: { libelle: string; echeance: string; etat: string } | null }[];
};
const STATUT_MOYEN: Record<string, [string, "sun" | "green" | "rose"]> = { a_verifier: ["En vérification par Navigoal", "sun"], verifie: ["Vérifié, affiché aux familles", "green"], refuse: ["Refusé", "rose"] };
const DEVISES: [string, string][] = [["MAD", "Dirham (MAD)"], ["XAF", "F CFA (XAF)"], ["XOF", "F CFA (XOF)"], ["EUR", "Euro"], ["USD", "Dollar US"]];

/** Espace école : moyens de paiement officiels, échéanciers des admis, confirmation des paiements déclarés. */
export function ScolariteEcole() {
  const { eid } = useEcole();
  const t = useApi<Tableau>(`/ecole/${eid}/scolarite`);
  const moyens = useApi<Moyen[]>(`/ecole/${eid}/moyens-paiement`);
  const admis = useApi<AppRow[]>(`/ecole/${eid}/candidatures?statut=acceptee`);
  const [editeur, setEditeur] = useState<AppRow | null>(null);
  if (t.loading || moyens.loading || admis.loading) return <Loading />;
  if (t.error || !t.data) return <Alert tone="error">{t.error?.message ?? "Erreur de chargement."}</Alert>;
  const sansEcheancier = (admis.data ?? []).filter((r) => !t.data!.echeanciers.some((e) => e.applicationId === r.a.id));
  const recharger = () => { t.reload(); admis.reload(); };
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Scolarité et paiements" sub="Fixez les frais et les échéances de vos admis ; les familles vous paient directement avec vos moyens de paiement officiels, puis déposent leur preuve. Confirmez la réception : la première confirmation vaut inscription définitive. Navigoal n'encaisse rien." crumbs={[["Établissement", "/etablissement"], ["Scolarité et paiements"]]} />
      {editeur && <Editeur row={editeur} onClose={() => { setEditeur(null); recharger(); }} />}
      <Panel title={`Paiements à confirmer (${t.data.aConfirmer.length})`} icon={CheckCircle2}>
        {t.data.aConfirmer.length ? <div className="flex flex-col gap-3">{t.data.aConfirmer.map((p) => <AConfirmer key={p.id} p={p} onDone={recharger} />)}</div> : <p className="text-sm text-ink-soft">Aucun paiement en attente de confirmation.</p>}
      </Panel>
      <Moyens eid={eid} liste={moyens.data ?? []} reload={moyens.reload} />
      <Panel title="Échéanciers des admis" icon={Wallet}>
        <div className="flex flex-col gap-3">
          {!!sansEcheancier.length && <Alert tone="warn" title={`${sansEcheancier.length} admis sans échéancier`}>Indiquez-leur ce qu&apos;ils doivent payer et quand : sans cela, ils ne peuvent pas confirmer leur inscription.</Alert>}
          {sansEcheancier.map((r) => <div key={r.a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-slate-300 p-3"><span><b>{r.s.firstName} {r.s.lastName}</b> <span className="text-sm text-ink-mute">· {r.p.title}</span></span><Button size="sm" icon={CalendarPlus} onClick={() => { setEditeur(r); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Fixer l&apos;échéancier</Button></div>)}
          {t.data.echeanciers.map((e) => (
            <div key={e.applicationId} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 p-3">
              <span className="min-w-0"><b>{e.eleve.firstName} {e.eleve.lastName}</b> <span className="text-sm text-ink-mute">· {e.programme}</span>
                <span className="block text-xs text-ink-mute">{money(e.paye, e.devise)} reçus sur {money(e.total, e.devise)}{e.prochaine ? ` · prochaine : ${e.prochaine.libelle}, ${dateFr(e.prochaine.echeance)}` : " · tout est réglé"}</span></span>
              <span className="flex items-center gap-2">{e.inscriptionConfirmee ? <Chip tone="green">Inscrit·e</Chip> : <Chip tone="grey">Inscription à confirmer</Chip>}
                <Button size="sm" variant="ghost" onClick={() => { const r = (admis.data ?? []).find((x) => x.a.id === e.applicationId); if (r) { setEditeur(r); window.scrollTo({ top: 0, behavior: "smooth" }); } }}>Modifier</Button></span>
            </div>
          ))}
          {!sansEcheancier.length && !t.data.echeanciers.length && <Empty title="Aucun admis pour l'instant" text="Les échéanciers se fixent une fois la candidature acceptée." />}
        </div>
      </Panel>
    </div>
  );
}

function AConfirmer({ p, onDone }: { p: Tableau["aConfirmer"][number]; onDone: () => void }) {
  const [motif, setMotif] = useState("");
  const a = useAction();
  const toast = useToast();
  const go = async (statut: string) => { if (await a.run(() => api(`/ecole/paiements-scolarite/${p.id}`, { method: "POST", body: { statut, motif: motif || undefined } }))) { toast(statut === "confirme" ? "Réception confirmée : la famille est prévenue" : "Paiement signalé comme non reçu"); onDone(); } };
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-[#f6f8fe] p-3.5">
      <span className="flex flex-wrap items-center justify-between gap-2"><b>{p.eleve.firstName} {p.eleve.lastName} · {p.ligne}</b><b>{money(p.montant, p.devise)}</b></span>
      <span className="text-xs text-ink-mute">{p.programme} · déclaré le {dateFr(p.createdAt)} par {p.payeur.firstName} {p.payeur.lastName}{p.payeur.role === "parent" ? " (parent)" : ""}{p.reference ? ` · réf. ${p.reference}` : ""}</span>
      {p.preuveId && <a href={apiUrl(`/documents/${p.preuveId}/fichier`)} target="_blank" rel="noreferrer" className="self-start text-sm font-bold text-brand-600 underline">Ouvrir la preuve de paiement</a>}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => go("confirme")} loading={a.pending}>Montant reçu</Button>
        <Input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif si non reçu" className="min-w-[200px] flex-1" maxLength={500} aria-label="Motif" />
        <Button size="sm" variant="ghost" onClick={() => go("refuse")} disabled={!motif.trim()}>Non reçu</Button>
      </div>
      <FormError error={a.error} />
    </div>
  );
}

function Moyens({ eid, liste, reload }: { eid: string; liste: Moyen[]; reload: () => void }) {
  const vide = { type: "virement", libelle: "", details: "", devise: "MAD" };
  const [f, setF] = useState<(typeof vide & { id?: string }) | null>(null);
  const a = useAction();
  const toast = useToast();
  const enregistrer = async () => {
    if (!f) return;
    const { id, ...body } = f;
    if (await a.run(() => api(`/ecole/${eid}/moyens-paiement${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body }))) { toast("Enregistré : l'équipe Navigoal le vérifie avant de l'afficher aux familles."); setF(null); reload(); }
  };
  const retirer = async (id: string) => { if (await a.run(() => api(`/ecole/${eid}/moyens-paiement/${id}`, { method: "DELETE" }))) reload(); };
  return (
    <Panel title="Moyens de paiement officiels" icon={Landmark} action={!f ? <Button size="sm" variant="ghost" icon={Plus} onClick={() => setF(vide)}>Ajouter</Button> : undefined}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-soft">RIB, lien de paiement en ligne de l&apos;école ou paiement sur place. Chaque moyen est vérifié par l&apos;équipe Navigoal avant d&apos;être affiché (protection contre les faux RIB) ; toute modification repasse en vérification et les familles concernées sont prévenues.</p>
        {liste.map((m) => (
          <div key={m.id} className="flex flex-col gap-1 rounded-2xl border border-slate-200 p-3 text-sm">
            <span className="flex flex-wrap items-center justify-between gap-2"><b>{m.libelle} <span className="font-normal text-ink-mute">({m.devise})</span></b><Chip tone={STATUT_MOYEN[m.statut]?.[1]}>{m.statut === "verifie" && <BadgeCheck size={13} />}{STATUT_MOYEN[m.statut]?.[0]}</Chip></span>
            <p className="whitespace-pre-line break-words font-mono text-[13px] text-ink-soft">{m.details}</p>
            <span className="flex gap-3"><button type="button" className="text-xs font-bold text-brand-600" onClick={() => setF({ id: m.id, type: m.type, libelle: m.libelle, details: m.details, devise: m.devise })}>Modifier</button><button type="button" className="flex items-center gap-1 text-xs font-bold text-[#b8213f]" onClick={() => retirer(m.id)}><Trash2 size={12} />Retirer</button></span>
          </div>
        ))}
        {!liste.length && !f && <p className="text-sm text-[#a55a00]">Aucun moyen de paiement : vos admis ne savent pas comment vous payer.</p>}
        {f && (
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-brand-200 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} options={[["virement", "Virement bancaire"], ["lien", "Lien de paiement en ligne"], ["especes", "Paiement sur place"], ["autre", "Autre"]]} aria-label="Type" />
              <Input value={f.libelle} onChange={(e) => setF({ ...f, libelle: e.target.value })} placeholder="Ex. : Virement — Attijariwafa bank" maxLength={120} aria-label="Libellé" />
              <Select value={f.devise} onChange={(e) => setF({ ...f, devise: e.target.value })} options={DEVISES} aria-label="Devise" />
            </div>
            <Textarea value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} maxLength={1500} placeholder={"Titulaire, banque, RIB / IBAN, code SWIFT, mention à indiquer (nom de l'étudiant)…\nOu le lien officiel de paiement, ou l'adresse et les horaires de la caisse."} aria-label="Coordonnées" />
            <FormError error={a.error} />
            <div className="flex gap-2"><Button onClick={enregistrer} loading={a.pending} disabled={f.libelle.trim().length < 3 || f.details.trim().length < 5}>Envoyer en vérification</Button><Button variant="ghost" onClick={() => setF(null)}>Annuler</Button></div>
          </div>
        )}
      </div>
    </Panel>
  );
}

type LigneF = { id?: string; libelle: string; montant: string; echeance: string };
function Editeur({ row, onClose }: { row: AppRow; onClose: () => void }) {
  const { data, loading } = useApi<{ echeancier: Echeancier | null }>(`/ecole/candidatures/${row.a.id}/echeancier`);
  const [f, setF] = useState<{ devise: string; lignes: LigneF[]; remboursement: string } | null>(null);
  const a = useAction();
  const toast = useToast();
  if (loading) return <Loading />;
  const e = data?.echeancier;
  const v = f ?? (e ? { devise: e.devise, lignes: e.lignes.map((l) => ({ id: l.id, libelle: l.libelle, montant: String(l.montant), echeance: l.echeance })), remboursement: e.remboursement ?? "" }
    : { devise: "MAD", lignes: [{ libelle: "Frais d'inscription", montant: "", echeance: "" }, { libelle: "Scolarité — 1re tranche", montant: "", echeance: "" }], remboursement: "" });
  const maj = (n: typeof v) => setF(n);
  const payee = (id?: string) => !!id && !!e?.lignes.find((l) => l.id === id && (l.confirme > 0 || l.declare > 0));
  const valide = v.lignes.length > 0 && v.lignes.every((l) => l.libelle.trim().length >= 3 && Number(l.montant) > 0 && /^\d{4}-\d{2}-\d{2}$/.test(l.echeance));
  const enregistrer = async () => {
    if (await a.run(() => api(`/ecole/candidatures/${row.a.id}/echeancier`, { method: "PUT", body: { devise: v.devise, remboursement: v.remboursement || null, lignes: v.lignes.map((l) => ({ id: l.id, libelle: l.libelle, montant: Number(l.montant), echeance: l.echeance })) } }))) { toast("Échéancier envoyé à l'étudiant et à ses parents"); onClose(); }
  };
  return (
    <Panel title={`Échéancier de ${row.s.firstName} ${row.s.lastName} · ${row.p.title}`} icon={CalendarPlus}>
      <div className="flex flex-col gap-3">
        <Select value={v.devise} onChange={(x) => maj({ ...v, devise: x.target.value })} options={DEVISES} aria-label="Devise" className="sm:max-w-xs" />
        {v.lignes.map((l, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_160px_170px_auto] sm:items-center">
            <Input value={l.libelle} disabled={payee(l.id)} onChange={(x) => maj({ ...v, lignes: v.lignes.map((y, j) => j === i ? { ...y, libelle: x.target.value } : y) })} placeholder="Libellé" aria-label="Libellé" />
            <Input inputMode="numeric" value={l.montant} disabled={payee(l.id)} onChange={(x) => maj({ ...v, lignes: v.lignes.map((y, j) => j === i ? { ...y, montant: x.target.value.replace(/\D/g, "") } : y) })} placeholder="Montant" aria-label="Montant" />
            <Input type="date" value={l.echeance} onChange={(x) => maj({ ...v, lignes: v.lignes.map((y, j) => j === i ? { ...y, echeance: x.target.value } : y) })} aria-label="Échéance" />
            {payee(l.id) ? <span className="text-xs text-ink-mute">Payée : figée</span> : <button type="button" onClick={() => maj({ ...v, lignes: v.lignes.filter((_, j) => j !== i) })} className="text-xs font-bold text-[#b8213f]" aria-label="Retirer la ligne"><Trash2 size={15} /></button>}
          </div>
        ))}
        <Button size="sm" variant="ghost" icon={Plus} className="self-start" onClick={() => maj({ ...v, lignes: [...v.lignes, { libelle: "", montant: "", echeance: "" }] })}>Ajouter une échéance</Button>
        <label className="flex flex-col gap-1.5 text-sm"><span className="font-bold">Conditions de remboursement (refus de visa, désistement)</span><Textarea value={v.remboursement} onChange={(x) => maj({ ...v, remboursement: x.target.value })} maxLength={1500} placeholder="Affichées à la famille avant tout paiement." /></label>
        <p className="text-sm text-ink-soft">Total : <b>{money(v.lignes.reduce((s, l) => s + (Number(l.montant) || 0), 0), v.devise)}</b></p>
        <FormError error={a.error} />
        <div className="flex gap-2"><Button onClick={enregistrer} loading={a.pending} disabled={!valide}>Enregistrer et prévenir la famille</Button><Button variant="ghost" onClick={onClose}>Fermer</Button></div>
      </div>
    </Panel>
  );
}
