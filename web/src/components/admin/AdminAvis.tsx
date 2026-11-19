"use client";
import { BadgeCheck, Flag, MessageSquareQuote, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "@/components/ui/Link";
import { Alert, Button, Chip, Empty, Kpi, Loading, PageHeader, Panel, Tabs, dateFr, money, useToast } from "@/components/app/kit";
import { FormError, Input, Select } from "@/components/app/form";
import { Etoiles } from "@/components/shared/AvisNavigoal";
import { useAction, useApi } from "@/hooks/useApi";
import { api, apiUrl } from "@/lib/api";

type Auteur = { id: string; firstName: string; lastName: string; email: string; country: string | null; affiche: string; role?: string };
type Temoignage = { id: string; note: number; temoignage: string | null; publier: boolean; statut: string; motif: string | null; updatedAt: string; auteur: Auteur };
type Service = { stats: Record<string, number>; lignes: Temoignage[] };
type Notes = Record<"enseignement" | "encadrement" | "accueil" | "campus" | "insertion" | "prix", number>;
type AvisE = { id: string; etablissementId: string; ecole: string; annee: string; formation: string | null; campus: string | null; notes: Notes; note: number; recommande: boolean; pointsForts: string; pointsFaibles: string; fraisDeclares: number | null; verification: string; justificatifId: string | null; statut: string; motif: string | null; reponse: string | null; reponseStatut: string | null; updatedAt: string; auteur: Auteur; signalements: { id: string; motif: string; createdAt: string }[] };
const STATUT: Record<string, [string, "grey" | "sun" | "green" | "rose"]> = { sans_temoignage: ["Note seule", "grey"], en_attente: ["À relire", "sun"], publie: ["Publié", "green"], refuse: ["Refusé", "rose"], retire: ["Retiré", "rose"] };

/** Back-office : relecture des témoignages sur Navigoal et des avis d'étudiants sur les écoles. */
export function AdminAvis() {
  const [onglet, setOnglet] = useState<"service" | "ecoles">(useSearchParams().get("onglet") === "ecoles" ? "ecoles" : "service");
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Avis et témoignages" sub="Relecture avant publication : ni injure, ni nom de personne, ni donnée personnelle, ni publicité. Un refus ou un retrait est motivé : le motif est envoyé à l'auteur." crumbs={[["Back-office", "/admin"], ["Avis et témoignages"]]} />
      <Tabs value={onglet} onChange={setOnglet} items={[["service", "Notes et témoignages Navigoal"], ["ecoles", "Avis sur les écoles"]]} />
      {onglet === "service" ? <Temoignages /> : <AvisEcoles />}
    </div>
  );
}

function Moderation({ onDone, chemin, retirer }: { onDone: () => void; chemin: string; retirer?: boolean }) {
  const [motif, setMotif] = useState("");
  const a = useAction();
  const toast = useToast();
  const go = async (statut: string) => { if (await a.run(() => api(chemin, { method: "POST", body: { statut, motif: motif || undefined } }))) { toast(statut === "publie" ? "Publié" : "Enregistré, l'auteur est prévenu"); onDone(); } };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {!retirer && <Button size="sm" onClick={() => go("publie")} loading={a.pending}>Publier</Button>}
        <Input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Motif (obligatoire pour refuser ou retirer)" className="min-w-[220px] flex-1" maxLength={500} aria-label="Motif" />
        <Button size="sm" variant="ghost" onClick={() => go(retirer ? "retire" : "refuse")} disabled={!motif.trim()}>{retirer ? "Retirer" : "Refuser"}</Button>
      </div>
      <FormError error={a.error} />
    </div>
  );
}

function Temoignages() {
  const [statut, setStatut] = useState("en_attente");
  const { data, loading, error, reload } = useApi<Service>(`/admin/avis-service${statut ? `?statut=${statut}` : ""}`);
  if (loading && !data) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur."}</Alert>;
  const s = data.stats;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Notes reçues" value={s.nombre ?? 0} icon={Star} />
        <Kpi label="Note moyenne" value={s.moyenne ? `${s.moyenne.toLocaleString("fr-FR")} / 5` : "—"} tone="sun" sub={`5★ ${s.n5 ?? 0} · 4★ ${s.n4 ?? 0} · 3★ ${s.n3 ?? 0} · 2★ ${s.n2 ?? 0} · 1★ ${s.n1 ?? 0}`} />
        <Kpi label="Témoignages à relire" value={s.a_relire ?? 0} tone="rose" icon={MessageSquareQuote} />
        <Kpi label="Témoignages publiés" value={s.publies ?? 0} tone="green" sub={<Link href="/pourquoi/" className="text-brand-600">Voir sur /pourquoi</Link>} />
      </div>
      <Select value={statut} onChange={(e) => setStatut(e.target.value)} options={[["en_attente", "À relire"], ["publie", "Publiés"], ["refuse", "Refusés"], ["sans_temoignage", "Notes seules"], ["", "Tout"]]} aria-label="Filtrer" className="sm:max-w-xs" />
      {!data.lignes.length ? <Empty title="Rien ici" /> : data.lignes.map((t) => (
        <Panel key={t.id}>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2"><Etoiles value={t.note} taille={16} /><Link href={`/admin/utilisateurs/${t.auteur.id}`} className="font-bold">{t.auteur.firstName} {t.auteur.lastName}</Link><span className="text-sm text-ink-mute">({t.auteur.role}) · affiché « {t.auteur.affiche} »</span></span><span className="flex items-center gap-2"><Chip tone={STATUT[t.statut]?.[1]}>{STATUT[t.statut]?.[0]}</Chip><span className="text-xs text-ink-mute">{dateFr(t.updatedAt, true)}</span></span></div>
            {t.temoignage && <p className="whitespace-pre-line rounded-2xl bg-[#f6f8fe] p-3 text-[14.5px]">{t.temoignage}</p>}
            {t.temoignage && !t.publier && <span className="text-xs text-ink-mute">L&apos;auteur n&apos;a pas accepté la publication : témoignage interne seulement.</span>}
            {t.motif && <span className="text-sm text-[#b8213f]">Motif : {t.motif}</span>}
            {t.temoignage && t.publier && <Moderation chemin={`/admin/avis-service/${t.id}`} onDone={reload} />}
          </div>
        </Panel>
      ))}
    </>
  );
}

function AvisEcoles() {
  const { data, loading, error, reload } = useApi<AvisE[]>("/admin/avis-ecoles");
  const [filtre, setFiltre] = useState("a_traiter");
  const a = useAction();
  const toast = useToast();
  if (loading && !data) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur."}</Alert>;
  const aTraiter = (x: AvisE) => x.statut === "en_attente" || x.reponseStatut === "en_attente" || x.signalements.length > 0;
  const lignes = data.filter((x) => filtre === "a_traiter" ? aTraiter(x) : filtre ? x.statut === filtre : true);
  const reponse = async (id: string, statut: string) => { if (await a.run(() => api(`/admin/avis-ecoles/${id}/reponse`, { method: "POST", body: { statut } }))) { toast("Réponse traitée"); reload(); } };
  const classer = async (id: string) => { if (await a.run(() => api(`/admin/avis-ecoles/${id}/classer`, { method: "POST" }))) { toast("Signalement classé"); reload(); } };
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Avis à relire" value={data.filter((x) => x.statut === "en_attente").length} tone="sun" />
        <Kpi label="Réponses d'écoles à relire" value={data.filter((x) => x.reponseStatut === "en_attente").length} tone="violet" />
        <Kpi label="Signalements ouverts" value={data.reduce((s, x) => s + x.signalements.length, 0)} tone="rose" icon={Flag} />
        <Kpi label="Avis publiés" value={data.filter((x) => x.statut === "publie").length} tone="green" />
      </div>
      <Select value={filtre} onChange={(e) => setFiltre(e.target.value)} options={[["a_traiter", "À traiter"], ["en_attente", "Avis à relire"], ["publie", "Publiés"], ["refuse", "Refusés"], ["retire", "Retirés"], ["", "Tout"]]} aria-label="Filtrer" className="sm:max-w-xs" />
      <FormError error={a.error} />
      {!lignes.length ? <Empty title="Rien à traiter" /> : lignes.map((x) => (
        <Panel key={x.id}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex flex-wrap items-center gap-2"><Link href={`/etablissements/${x.etablissementId}/#avis`} className="font-extrabold">{x.ecole}</Link><Etoiles value={Math.round(x.note)} taille={15} /><b>{x.note.toLocaleString("fr-FR")}</b><span className="text-sm text-ink-mute">· {x.annee} · {x.recommande ? "recommande" : "ne recommande pas"}</span></span>
              <Chip tone={STATUT[x.statut]?.[1]}>{STATUT[x.statut]?.[0] ?? x.statut}</Chip>
            </div>
            <span className="text-sm text-ink-soft"><Link href={`/admin/utilisateurs/${x.auteur.id}`} className="font-bold">{x.auteur.firstName} {x.auteur.lastName}</Link> · affiché « {x.auteur.affiche} » · {[x.formation, x.campus].filter(Boolean).join(" · ")}{x.fraisDeclares ? ` · scolarité déclarée ${money(x.fraisDeclares)}` : ""}</span>
            <span className="flex flex-wrap items-center gap-2 text-sm">{x.verification === "navigoal" ? <span className="flex items-center gap-1 font-bold text-[#0b7a3d]"><BadgeCheck size={15} />Inscription confirmée via Navigoal</span> : <>
              <span className="font-bold text-[#a55a00]">À vérifier : attestation de scolarité {x.annee}</span>
              {x.justificatifId && <a href={apiUrl(`/documents/${x.justificatifId}/fichier`)} target="_blank" rel="noreferrer" className="font-bold text-brand-600 underline">Ouvrir le justificatif</a>}</>}</span>
            <div className="grid gap-3 text-sm sm:grid-cols-2"><div><b className="text-[#0b7a3d]">Points forts</b><p className="mt-1 whitespace-pre-line">{x.pointsForts}</p></div><div><b className="text-[#a55a00]">Points à améliorer</b><p className="mt-1 whitespace-pre-line">{x.pointsFaibles}</p></div></div>
            <span className="text-xs text-ink-mute">{Object.entries(x.notes).map(([k, v]) => `${k} ${v}`).join(" · ")} · mis à jour le {dateFr(x.updatedAt, true)}</span>
            {x.motif && <span className="text-sm text-[#b8213f]">Motif : {x.motif}</span>}
            {x.statut === "en_attente" && <Moderation chemin={`/admin/avis-ecoles/${x.id}`} onDone={reload} />}
            {x.statut === "publie" && (x.signalements.length > 0 || filtre !== "a_traiter") && <Moderation chemin={`/admin/avis-ecoles/${x.id}`} onDone={reload} retirer />}
            {x.signalements.map((s) => <div key={s.id} className="rounded-2xl border border-[#ffd6dd] bg-[#fff6f7] p-3 text-sm"><b className="flex items-center gap-1 text-[#b8213f]"><Flag size={14} />Signalement du {dateFr(s.createdAt)}</b><p className="mt-1">{s.motif}</p></div>)}
            {x.signalements.length > 0 && <Button size="sm" variant="ghost" onClick={() => classer(x.id)}>Classer sans suite (l&apos;avis reste publié)</Button>}
            {x.reponse && x.reponseStatut === "en_attente" && (
              <div className="flex flex-col gap-2 rounded-2xl bg-[#f1edff] p-3 text-sm"><b>Réponse de l&apos;école à relire</b><p className="whitespace-pre-line">{x.reponse}</p>
                <div className="flex gap-2"><Button size="sm" onClick={() => reponse(x.id, "publie")}>Publier la réponse</Button><Button size="sm" variant="ghost" onClick={() => reponse(x.id, "refuse")}>Refuser</Button></div></div>
            )}
          </div>
        </Panel>
      ))}
    </>
  );
}
