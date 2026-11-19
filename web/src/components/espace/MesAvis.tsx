"use client";
import { BadgeCheck, MessageSquareQuote, ShieldCheck } from "lucide-react";
import { useState } from "react";
import Link from "@/components/ui/Link";
import { Alert, Button, Chip, Loading, PageHeader, Panel, dateFr, useToast } from "@/components/app/kit";
import { Check, FileDrop, FormError, Input, Select, Textarea } from "@/components/app/form";
import { Etoiles } from "@/components/shared/AvisNavigoal";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";

type Notes = { enseignement: number; encadrement: number; accueil: number; campus: number; insertion: number; prix: number };
type Ecole = { applicationId: string; etablissementId: string; nom: string; formation: string; campus: string | null; inscriptionConfirmee: boolean };
type MonAvis = { id: string; etablissementId: string; annee: string; statut: string; motif: string | null; createdAt: string; notes: Notes; recommande: boolean; pointsForts: string; pointsFaibles: string; formation: string | null; campus: string | null; fraisDeclares: number | null; affichage: "prenom" | "anonyme"; verification: string; reponse: string | null; reponseStatut: string | null };
type Donnees = { annee: string; ecoles: Ecole[]; mesAvis: MonAvis[]; catalogue: { id: string; nom: string }[] };

const CRITERES: [keyof Notes, string, string][] = [
  ["enseignement", "Qualité de l'enseignement", "Cours, enseignants, niveau"], ["encadrement", "Encadrement et disponibilité", "Suivi, administration, réponses aux questions"],
  ["accueil", "Accueil des étudiants étrangers", "Arrivée, démarches, intégration"], ["campus", "Vie de campus et locaux", "Salles, matériel, bibliothèque, vie associative"],
  ["insertion", "Stages et insertion", "Aide aux stages, entreprises partenaires, débouchés"], ["prix", "Rapport qualité-prix", "Ce que vous payez au regard de ce que vous recevez"],
];
const STATUT: Record<string, [string, "grey" | "sun" | "green" | "rose"]> = { en_attente: ["En relecture", "sun"], publie: ["Publié", "green"], refuse: ["Non publié", "rose"], retire: ["Retiré", "rose"] };
const vide = { enseignement: 0, encadrement: 0, accueil: 0, campus: 0, insertion: 0, prix: 0 };
type Form = { etablissementId: string; applicationId: string | null; formation: string; campus: string; notes: Notes; recommande: boolean | null; pointsForts: string; pointsFaibles: string; frais: string; affichage: "prenom" | "anonyme"; justificatifId: string | null; justificatifNom: string | null; verifiee: boolean; certifie: boolean };

/** Espace élève et étudiant : donner un avis vérifié sur son école (une fois par année universitaire). */
export function MesAvis() {
  const { data, loading, error, reload } = useApi<Donnees>("/moi/avis-ecoles");
  const [f, setF] = useState<Form | null>(null);
  const toast = useToast();
  const a = useAction();
  if (loading) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur de chargement."}</Alert>;
  const nomEcole = (id: string) => data.catalogue.find((c) => c.id === id)?.nom ?? id;
  const ouvrir = (e?: Ecole, avant?: MonAvis) => setF({
    etablissementId: avant?.etablissementId ?? e?.etablissementId ?? "", applicationId: e?.applicationId ?? null, formation: avant?.formation ?? e?.formation ?? "", campus: avant?.campus ?? e?.campus ?? "",
    notes: avant?.notes ?? vide, recommande: avant ? avant.recommande : null, pointsForts: avant?.pointsForts ?? "", pointsFaibles: avant?.pointsFaibles ?? "",
    frais: avant?.fraisDeclares ? String(avant.fraisDeclares) : "", affichage: avant?.affichage ?? "prenom", justificatifId: avant?.verification === "justificatif" ? "deja" : null, justificatifNom: avant?.verification === "justificatif" ? "Attestation déjà déposée" : null, verifiee: !!e?.inscriptionConfirmee, certifie: false,
  });
  const avisDe = (eid: string) => data.mesAvis.find((m) => m.etablissementId === eid && m.annee === data.annee);
  const modifiable = (m: MonAvis) => m.statut !== "retire" && Date.now() - new Date(m.createdAt).getTime() < 30 * 864e5;
  const complet = f && f.etablissementId && Object.values(f.notes).every((n) => n > 0) && f.recommande !== null && f.pointsForts.trim().length >= 50 && f.pointsFaibles.trim().length >= 50 && (f.verifiee || f.justificatifId) && f.certifie;
  const envoyer = async () => {
    if (!f) return;
    const r = await a.run(() => api("/moi/avis-ecoles", { method: "POST", body: {
      etablissementId: f.etablissementId, applicationId: f.applicationId, formation: f.formation || null, campus: f.campus || null, notes: f.notes, recommande: f.recommande,
      pointsForts: f.pointsForts, pointsFaibles: f.pointsFaibles, fraisDeclares: f.frais ? Number(f.frais.replace(/\D/g, "")) : null, affichage: f.affichage, justificatifId: f.justificatifId === "deja" ? null : f.justificatifId,
    } }));
    if (r) { toast("Avis envoyé : l'équipe Navigoal le relit avant publication."); setF(null); reload(); }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Mes avis sur les écoles" sub={`Votre expérience aide les futurs étudiants à choisir. Un avis par école et par année universitaire (${data.annee}), relu par l'équipe avant publication.`} crumbs={[["Mon espace", "/espace"], ["Mes avis"]]} />
      {!f && (
        <>
          <Panel title="Les écoles où vous êtes inscrit·e" icon={BadgeCheck}>
            {data.ecoles.length ? (
              <ul className="flex flex-col divide-y divide-slate-100">{data.ecoles.map((e) => {
                const m = avisDe(e.etablissementId);
                return (
                  <li key={e.applicationId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0"><b className="block">{e.nom}</b><span className="text-sm text-ink-mute">{e.formation}{e.campus ? ` · ${e.campus}` : ""}</span>
                      <span className="mt-1 block text-xs">{e.inscriptionConfirmee ? <span className="font-bold text-[#0b7a3d]">Inscription confirmée via Navigoal : avis vérifié d&apos;office</span> : <span className="text-ink-mute">Inscription non encore confirmée : une attestation de scolarité vous sera demandée</span>}</span></div>
                    {m ? (modifiable(m) ? <Button variant="ghost" onClick={() => ouvrir(e, m)}>Modifier mon avis</Button> : <Chip tone={STATUT[m.statut]?.[1]}>{STATUT[m.statut]?.[0]}</Chip>) : <Button icon={MessageSquareQuote} onClick={() => ouvrir(e)}>Donner mon avis</Button>}
                  </li>
                );
              })}</ul>
            ) : <p className="text-sm text-ink-soft">Aucune admission via Navigoal pour l&apos;instant. Vous étudiez déjà dans une école ? Donnez votre avis avec votre attestation de scolarité de cette année.</p>}
            <div className="mt-4 border-t border-slate-100 pt-4"><Button variant="ghost" onClick={() => ouvrir()}>Donner un avis sur une autre école (avec attestation)</Button></div>
          </Panel>
          {!!data.mesAvis.length && (
            <Panel title="Mes avis déposés">
              <ul className="flex flex-col divide-y divide-slate-100">{data.mesAvis.map((m) => (
                <li key={m.id} className="flex flex-col gap-1.5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><b>{nomEcole(m.etablissementId)} <span className="font-normal text-ink-mute">· {m.annee}</span></b><Chip tone={STATUT[m.statut]?.[1]}>{STATUT[m.statut]?.[0] ?? m.statut}</Chip></div>
                  <span className="text-xs text-ink-mute">Déposé le {dateFr(m.createdAt)}{modifiable(m) ? ` · modifiable jusqu'au ${dateFr(new Date(new Date(m.createdAt).getTime() + 30 * 864e5))}` : ""}</span>
                  {m.motif && m.statut !== "publie" && <span className="text-sm text-[#b8213f]">Motif : {m.motif}</span>}
                  {m.statut === "publie" && <Link href={`/etablissements/${m.etablissementId}/#avis`} className="text-sm font-bold text-brand-600">Voir sur la fiche de l&apos;école</Link>}
                  {m.reponse && m.reponseStatut === "publie" && <span className="text-sm text-ink-soft">L&apos;école a répondu à votre avis.</span>}
                </li>
              ))}</ul>
            </Panel>
          )}
          <Alert title="Nos règles">Avis relus par l&apos;équipe : ni injure, ni nom de personne, ni donnée personnelle. L&apos;école peut répondre publiquement mais ne peut ni retirer ni modifier votre avis. Votre nom s&apos;affiche selon votre choix (prénom et initiale, ou anonyme).</Alert>
        </>
      )}
      {f && (
        <Panel title={f.etablissementId ? `Mon avis sur ${nomEcole(f.etablissementId)}` : "Mon avis sur une école"} icon={MessageSquareQuote}>
          <div className="flex flex-col gap-5">
            {!f.applicationId && (
              <label className="flex flex-col gap-1.5"><span className="text-sm font-bold">École</span>
                <Select value={f.etablissementId} onChange={(e) => setF({ ...f, etablissementId: e.target.value })} options={data.catalogue.map((c) => [c.id, c.nom])} placeholder="Choisir l'école" aria-label="École" /></label>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className="text-sm font-bold">Formation suivie</span><Input value={f.formation} onChange={(e) => setF({ ...f, formation: e.target.value })} maxLength={200} placeholder="Ex. : Licence en management" /></label>
              <label className="flex flex-col gap-1.5"><span className="text-sm font-bold">Campus <span className="font-normal text-ink-mute">(facultatif)</span></span><Input value={f.campus} onChange={(e) => setF({ ...f, campus: e.target.value })} maxLength={80} placeholder="Ex. : Casablanca" /></label>
            </div>
            <fieldset className="grid gap-4 sm:grid-cols-2">
              <legend className="mb-2 text-sm font-bold">Vos notes, de 1 à 5 étoiles</legend>
              {CRITERES.map(([k, l, d]) => (
                <div key={k} className="flex flex-col gap-1 rounded-2xl bg-[#f6f8fe] p-3"><b className="text-sm">{l}</b><span className="text-xs text-ink-mute">{d}</span><Etoiles value={f.notes[k]} taille={24} onChange={(n) => setF({ ...f, notes: { ...f.notes, [k]: n } })} /></div>
              ))}
            </fieldset>
            <div className="flex flex-col gap-2"><b className="text-sm">Recommanderiez-vous cette école à un ami ?</b>
              <div className="flex gap-2" role="radiogroup" aria-label="Recommandation">{([[true, "Oui"], [false, "Non"]] as const).map(([v, l]) => (
                <button key={l} type="button" role="radio" aria-checked={f.recommande === v} onClick={() => setF({ ...f, recommande: v })} className={`min-h-[44px] rounded-full border px-5 text-sm font-bold ${f.recommande === v ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white"}`}>{l}</button>
              ))}</div>
            </div>
            {([["pointsForts", "Points forts"], ["pointsFaibles", "Points à améliorer"]] as const).map(([k, l]) => (
              <label key={k} className="flex flex-col gap-1.5"><span className="text-sm font-bold">{l}</span>
                <Textarea value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} maxLength={1500} placeholder={k === "pointsForts" ? "Ce qui vous plaît vraiment : cours, enseignants, ambiance, accompagnement…" : "Ce qui pourrait être mieux : organisation, matériel, suivi, coûts cachés…"} />
                <span className={`self-end text-xs ${f[k].trim().length < 50 ? "text-[#a55a00]" : "text-ink-mute"}`}>{f[k].trim().length} / 50 caractères minimum</span></label>
            ))}
            <label className="flex flex-col gap-1.5 sm:max-w-sm"><span className="text-sm font-bold">Scolarité payée cette année, en dirhams <span className="font-normal text-ink-mute">(facultatif)</span></span>
              <Input inputMode="numeric" value={f.frais} onChange={(e) => setF({ ...f, frais: e.target.value.replace(/[^\d ]/g, "") })} placeholder="Ex. : 45 000" />
              <span className="text-xs text-ink-mute">Aide Navigoal à vérifier les tarifs affichés ; jamais publié avec votre nom.</span></label>
            <div className="flex flex-col gap-2"><b className="text-sm">Affichage de votre nom</b>
              <div className="flex flex-wrap gap-2 text-sm" role="radiogroup" aria-label="Affichage du nom">{([["prenom", "Prénom et initiale du nom"], ["anonyme", "Anonyme (pays seulement)"]] as const).map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={f.affichage === k} onClick={() => setF({ ...f, affichage: k })} className={`min-h-[40px] rounded-full border px-4 font-semibold ${f.affichage === k ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white"}`}>{l}</button>
              ))}</div>
            </div>
            {f.verifiee ? (
              <p className="flex items-center gap-2 rounded-2xl bg-[#e8f8ef] p-3 text-sm font-semibold text-[#0b7a3d]"><ShieldCheck size={18} />Inscription confirmée via Navigoal : votre avis portera la mention « Inscrit via Navigoal ».</p>
            ) : (
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-3.5">
                <b className="text-sm">Attestation ou certificat de scolarité {"de l'année en cours"}</b>
                <span className="text-xs text-ink-mute">Vue seulement par l&apos;équipe Navigoal pour vérifier que vous êtes bien étudiant·e de cette école, jamais publiée ni transmise à l&apos;école.</span>
                {f.justificatifId ? <span className="flex items-center gap-2 text-sm font-semibold text-[#0b7a3d]"><BadgeCheck size={16} />{f.justificatifNom} <button type="button" className="text-xs font-normal text-ink-mute underline" onClick={() => setF({ ...f, justificatifId: null, justificatifNom: null })}>changer</button></span>
                  : <FileDrop type="attestation_scolarite" compact onUploaded={(d) => setF({ ...f, justificatifId: d.id, justificatifNom: d.fileName })} />}
              </div>
            )}
            <Check checked={f.certifie} onChange={(v) => setF({ ...f, certifie: v })}>Je certifie que cet avis reflète mon expérience personnelle et sincère.</Check>
            <FormError error={a.error} />
            <div className="flex flex-wrap gap-2"><Button onClick={envoyer} loading={a.pending} disabled={!complet}>Envoyer mon avis</Button><Button variant="ghost" onClick={() => setF(null)}>Annuler</Button></div>
          </div>
        </Panel>
      )}
    </div>
  );
}
