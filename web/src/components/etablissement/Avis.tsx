"use client";
import { BadgeCheck, MessageSquareQuote } from "lucide-react";
import { useState } from "react";
import Link from "@/components/ui/Link";
import { Alert, Button, Chip, Empty, Loading, PageHeader, Panel, dateFr, useToast } from "@/components/app/kit";
import { FormError, Textarea } from "@/components/app/form";
import { Etoiles } from "@/components/shared/AvisNavigoal";
import { SignalerAvis } from "@/components/ui/SignalerAvis";
import { useAction, useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { useEcole } from "./EcoleContext";

type Notes = Record<"enseignement" | "encadrement" | "accueil" | "campus" | "insertion" | "prix", number>;
type Avis = { id: string; annee: string; formation: string | null; campus: string | null; notes: Notes; recommande: boolean; pointsForts: string; pointsFaibles: string; verification: string; publieLe: string | null; reponse: string | null; reponseStatut: string | null };
const moy = (n: Notes) => Math.round((Object.values(n).reduce((a, b) => a + b, 0) / 6) * 10) / 10;
const REP: Record<string, [string, "sun" | "green" | "rose"]> = { en_attente: ["Réponse en relecture", "sun"], publie: ["Réponse publiée", "green"], refuse: ["Réponse non publiée", "rose"] };

/** Espace école : avis publiés sur la fiche, réponse publique (relue par l'équipe), signalement. */
export function AvisEcoleEspace() {
  const { eid, etab } = useEcole();
  const { data, loading, error, reload } = useApi<Avis[]>(`/ecole/${eid}/avis`);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [texte, setTexte] = useState("");
  const a = useAction();
  const toast = useToast();
  if (loading) return <Loading />;
  if (error || !data) return <Alert tone="error">{error?.message ?? "Erreur de chargement."}</Alert>;
  const note = data.length >= 3 ? Math.round((data.reduce((s, x) => s + moy(x.notes), 0) / data.length) * 10) / 10 : null;
  const envoyer = async (id: string) => {
    if (await a.run(() => api(`/ecole/avis/${id}/reponse`, { method: "POST", body: { texte } }))) { toast("Réponse envoyée : publiée après relecture par l'équipe."); setOuvert(null); setTexte(""); reload(); }
  };
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Avis d'étudiants" sub="Avis d'étudiants dont l'inscription chez vous est vérifiée, relus par Navigoal avant publication. Vous pouvez répondre publiquement à chacun ; un avis ne peut être ni retiré ni modifié par l'école." crumbs={[["Établissement", "/etablissement"], ["Avis"]]}
        actions={<Link href={`/etablissements/${eid}/#avis`} className="btn-ghost min-h-[44px] px-4 text-[14px]">Voir sur ma fiche</Link>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel><b className="text-2xl">{data.length}</b><p className="text-sm text-ink-mute">avis publiés</p></Panel>
        <Panel><b className="text-2xl">{note ? `${note.toLocaleString("fr-FR")} / 5` : "—"}</b><p className="text-sm text-ink-mute">{note ? "note moyenne affichée" : "note affichée dès 3 avis"}</p></Panel>
        <Panel><b className="text-2xl">{data.length ? `${Math.round((data.filter((x) => x.recommande).length / data.length) * 100)} %` : "—"}</b><p className="text-sm text-ink-mute">recommandent {etab.sigle || "l'école"}</p></Panel>
      </div>
      {!data.length ? <Empty icon={MessageSquareQuote} title="Aucun avis publié pour l'instant" text="Les étudiants admis via Navigoal sont invités à donner leur avis en mars et en juillet. Confirmer les inscriptions de vos admis permet à leurs avis d'être vérifiés d'office." /> : data.map((x) => (
        <Panel key={x.id}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Etoiles value={Math.round(moy(x.notes))} taille={16} /><b>{moy(x.notes).toLocaleString("fr-FR")}</b><span className="text-sm text-ink-mute">· {[x.formation, x.campus, x.annee].filter(Boolean).join(" · ")}</span></span>
              <span className="flex items-center gap-1 text-xs font-bold text-[#0b7a3d]"><BadgeCheck size={14} />{x.verification === "navigoal" ? "Inscrit via Navigoal" : "Inscription vérifiée"} · {dateFr(x.publieLe)}</span>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2"><div><b className="text-[#0b7a3d]">Points forts</b><p className="mt-1 whitespace-pre-line text-ink-soft">{x.pointsForts}</p></div><div><b className="text-[#a55a00]">Points à améliorer</b><p className="mt-1 whitespace-pre-line text-ink-soft">{x.pointsFaibles}</p></div></div>
            {x.reponse && <div className="rounded-2xl bg-[#f6f8fe] p-3 text-sm"><div className="mb-1 flex items-center gap-2"><b>Votre réponse</b>{x.reponseStatut && <Chip tone={REP[x.reponseStatut]?.[1]}>{REP[x.reponseStatut]?.[0]}</Chip>}</div><p className="whitespace-pre-line text-ink-soft">{x.reponse}</p></div>}
            {ouvert === x.id ? (
              <div className="flex flex-col gap-2">
                <Textarea value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={1500} placeholder="Remerciez, apportez votre éclairage, expliquez ce qui change. Réponse publique, relue par l'équipe : restez courtois et ne citez aucune donnée personnelle." />
                <FormError error={a.error} />
                <div className="flex gap-2"><Button onClick={() => envoyer(x.id)} loading={a.pending} disabled={texte.trim().length < 20}>Envoyer la réponse</Button><Button variant="ghost" onClick={() => setOuvert(null)}>Annuler</Button></div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3"><Button variant="ghost" onClick={() => { setOuvert(x.id); setTexte(x.reponse ?? ""); }}>{x.reponse ? "Modifier ma réponse" : "Répondre publiquement"}</Button><SignalerAvis id={x.id} /></div>
            )}
          </div>
        </Panel>
      ))}
    </div>
  );
}
