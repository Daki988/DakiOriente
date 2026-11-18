"use client";
// Suivi de Navi : volume, coût, rapidité, refus et erreurs, part du petit modèle et du cache, outils, conversations.
import { AlertTriangle, Bot, ChevronDown, Clock, Coins, Database, MessageSquareText, Search, ThumbsDown, ThumbsUp, Zap } from "lucide-react";
import { useState } from "react";
import { Kpi, Loading, Panel } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { AdminHeader, LoadError, ROLE_LABEL, nf } from "./shared";

type Ligne = { id: string; at: string; role: string | null; page: string | null; question: string; route: string; modele: string | null; statut: string; coutUsd: number; dureeMs: number; outils: string[]; cartes: number; avis: string | null };
type Tableau = {
  chiffres: { questions: number; cout: number; coutMoyen: number; dureeMed: number; duree90: number; refus: number; erreurs: number; simple: number; cache: number; sansReponse: number; connectes: number; utiles: number; inutiles: number; partCacheConsignes: number };
  parJour: { jour: string; questions: number; cout: number }[];
  outils: { outil: string; n: number }[];
  modeles: { modele: string | null; questions: number; cout: number }[];
  dernieres: Ligne[];
};
type Detail = Ligne & { reponse: string; tours: number; entree: number; sortie: number; cacheLu: number; cacheEcrit: number };

const PERIODES: [string, string][] = [["jour", "24 h"], ["7j", "7 jours"], ["30j", "30 jours"], ["90j", "90 jours"]];
const ROUTE: Record<string, [string, string]> = { simple: ["Petit modèle", "bg-[#e8f8ef] text-[#0b7a3d]"], complet: ["Modèle principal", "bg-brand-50 text-brand-800"], cache: ["Cache", "bg-[#fff7dd] text-[#8a4b00]"] };
const STATUT: Record<string, [string, string]> = { ok: ["", ""], refus: ["Refus", "bg-[#fff7dd] text-[#8a4b00]"], erreur: ["Erreur", "bg-[#ffecef] text-[#b8213f]"] };
const OUTIL: Record<string, string> = { chercher_formations: "Formations", chercher_etablissements: "Établissements", fiche_etablissement: "Fiche école", chercher_metiers: "Métiers", estimer_cout: "Estimation de coût", infos_pays_origine: "Pays de départ", chercher_logements: "Logements", campagnes_en_cours: "Campagnes", mon_espace: "Mon espace", afficher: "Cartes", condensation: "Réponse raccourcie" };
const usd = (n: number, d = 2) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d })} $`;
const pc = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");
const sec = (ms: number) => `${(ms / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} s`;

function Conversation({ id }: { id: string }) {
  const d = useApi<Detail>(`/admin/navi/${id}`);
  if (d.error) return <LoadError error={d.error} reload={d.reload} />;
  if (!d.data) return <Loading />;
  const x = d.data;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#f6f8fe] p-4 text-[13px]">
      <div><p className="text-xs font-bold uppercase text-ink-mute">Question</p><p className="whitespace-pre-wrap">{x.question}</p></div>
      <div><p className="text-xs font-bold uppercase text-ink-mute">Réponse affichée</p><p className="whitespace-pre-wrap">{x.reponse || <i className="text-ink-mute">Aucune réponse affichée.</i>}</p></div>
      <p className="text-xs text-ink-mute">
        {x.modele ?? "Cache"} · {x.tours} appel{x.tours > 1 ? "s" : ""} au modèle · {sec(x.dureeMs)} · {usd(x.coutUsd, 4)} · jetons : {nf(x.entree)} en entrée, {nf(x.cacheLu)} lus en cache, {nf(x.sortie)} en sortie
        {x.outils.length > 0 && <> · outils : {x.outils.map((o) => OUTIL[o] ?? o).join(", ")}</>}
      </p>
    </div>
  );
}

export function AdminNavi() {
  const [periode, setPeriode] = useState("7j");
  const [route, setRoute] = useState("");
  const [statut, setStatut] = useState("");
  const [avis, setAvis] = useState("");
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState<string | null>(null);
  const s = useApi<Tableau>(`/admin/navi?periode=${periode}&route=${route}&statut=${statut}&avis=${avis}&q=${encodeURIComponent(q)}`);
  if (s.error) return <LoadError error={s.error} reload={s.reload} />;
  const d = s.data;
  const c = d?.chiffres;
  const maxJ = Math.max(1, ...(d?.parJour.map((x) => x.questions) ?? [1]));
  const maxO = Math.max(1, ...(d?.outils.map((x) => x.n) ?? [1]));

  return (
    <>
      <AdminHeader title="Navi" sub="Ce que Navi répond, ce qu'il coûte et à quelle vitesse. Conversations conservées 90 jours." />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {PERIODES.map(([v, l]) => <button key={v} onClick={() => setPeriode(v)} className={`chip px-3 py-2 text-[13px] ${periode === v ? "bg-ink text-white" : "border border-slate-200 bg-white text-ink-soft"}`}>{l}</button>)}
      </div>
      {!d || !c ? <Loading /> : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi label="Questions" value={nf(c.questions)} icon={MessageSquareText} sub={`${pc(c.connectes, c.questions)} de comptes connectés`} />
            <Kpi label="Coût" value={usd(c.cout)} icon={Coins} tone="sun" sub={`${usd(c.coutMoyen, 4)} par question`} />
            <Kpi label="Temps de réponse" value={sec(c.dureeMed)} icon={Clock} tone="violet" sub={`9 sur 10 en moins de ${sec(c.duree90)}`} />
            <Kpi label="Refus et erreurs" value={nf(c.refus + c.erreurs)} icon={AlertTriangle} tone="rose" sub={`${nf(c.refus)} refus · ${nf(c.erreurs)} erreur${c.erreurs > 1 ? "s" : ""} · ${nf(c.sansReponse)} sans réponse`} />
            <Kpi label="Avis des utilisateurs" value={c.utiles + c.inutiles ? pc(c.utiles, c.utiles + c.inutiles) : "–"} icon={ThumbsUp} tone="green" sub={`${nf(c.utiles)} utile${c.utiles > 1 ? "s" : ""} · ${nf(c.inutiles)} pas utile${c.inutiles > 1 ? "s" : ""}`} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Panel title="Questions par jour" icon={MessageSquareText}>
              {d.parJour.length ? (
                <div className="flex h-36 items-end gap-1" role="img" aria-label="Questions par jour">
                  {d.parJour.map((x) => (
                    <div key={x.jour} className="flex flex-1 flex-col items-center justify-end" title={`${new Date(x.jour).toLocaleDateString("fr-FR")} : ${x.questions} questions, ${usd(x.cout ?? 0)}`}>
                      <div className="w-full rounded-t-md bg-brand-600/80" style={{ height: `${Math.max(4, (x.questions / maxJ) * 130)}px` }} />
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-ink-mute">Aucune question sur cette période.</p>}
            </Panel>
            <Panel title="Économies" icon={Zap} tone="green">
              <ul className="space-y-2 text-sm">
                <li><b>{pc(c.simple, c.questions)}</b> des questions traitées par le petit modèle (discussion), environ 20 fois moins cher.</li>
                <li><b>{pc(c.cache, c.questions)}</b> servies depuis le cache des questions fréquentes, sans appel au modèle.</li>
                <li><b>{Math.round(c.partCacheConsignes * 100)} %</b> des consignes relues depuis le cache de l&apos;API (10 fois moins cher).</li>
              </ul>
              {d.modeles.length > 0 && (
                <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 text-[13px]">
                  {d.modeles.map((m) => <div key={m.modele ?? "cache"} className="flex justify-between gap-3"><span className="flex items-center gap-1.5">{m.modele ? <Bot size={14} /> : <Database size={14} />}{m.modele ?? "Cache"}</span><span className="text-ink-mute">{nf(m.questions)} · {usd(m.cout ?? 0)}</span></div>)}
                </div>
              )}
            </Panel>
          </div>
          <Panel title="Recherches lancées par Navi" icon={Search}>
            {d.outils.length ? d.outils.map((o) => (
              <div key={o.outil} className="flex items-center gap-3 text-[13px]">
                <span className="w-40 truncate">{OUTIL[o.outil] ?? o.outil}</span>
                <div className="h-2 flex-1 rounded-full bg-[#eef1f8]"><div className="h-2 rounded-full bg-brand-600" style={{ width: `${(o.n / maxO) * 100}%` }} /></div>
                <span className="w-12 text-right text-ink-mute">{nf(o.n)}</span>
              </div>
            )) : <p className="text-sm text-ink-mute">Aucune recherche sur cette période.</p>}
          </Panel>
          <Panel title="Dernières questions" icon={MessageSquareText}>
            <div className="flex flex-wrap gap-2">
              <input className="input min-w-0 flex-1 py-2 text-[13px]" placeholder="Rechercher dans les questions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher dans les questions" />
              <select className="input w-auto py-2 text-[13px]" value={route} onChange={(e) => setRoute(e.target.value)} aria-label="Traitement">
                <option value="">Tous les traitements</option><option value="simple">Petit modèle</option><option value="complet">Modèle principal</option><option value="cache">Cache</option>
              </select>
              <select className="input w-auto py-2 text-[13px]" value={statut} onChange={(e) => setStatut(e.target.value)} aria-label="Résultat">
                <option value="">Tous les résultats</option><option value="ok">Répondues</option><option value="refus">Refus</option><option value="erreur">Erreurs</option>
              </select>
              <select className="input w-auto py-2 text-[13px]" value={avis} onChange={(e) => setAvis(e.target.value)} aria-label="Avis">
                <option value="">Tous les avis</option><option value="utile">Jugées utiles</option><option value="inutile">Jugées pas utiles</option>
              </select>
            </div>
            {d.dernieres.length ? (
              <ul className="divide-y divide-slate-100">
                {d.dernieres.map((x) => (
                  <li key={x.id} className="py-2.5">
                    <button type="button" onClick={() => setOuvert(ouvert === x.id ? null : x.id)} className="flex w-full items-start gap-3 text-left" aria-expanded={ouvert === x.id}>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-semibold">{x.question}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-mute">
                          {new Date(x.at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} · {x.role ? ROLE_LABEL[x.role] ?? x.role : "Visiteur"} · {sec(x.dureeMs)} · {usd(x.coutUsd, 4)}
                          <span className={`chip px-2 py-0.5 ${ROUTE[x.route]?.[1] ?? ""}`}>{ROUTE[x.route]?.[0] ?? x.route}</span>
                          {STATUT[x.statut]?.[0] && <span className={`chip px-2 py-0.5 ${STATUT[x.statut][1]}`}>{STATUT[x.statut][0]}</span>}
                          {x.avis === "utile" && <span className="chip bg-[#e8f8ef] px-2 py-0.5 text-[#0b7a3d]"><ThumbsUp size={12} />Utile</span>}
                          {x.avis === "inutile" && <span className="chip bg-[#ffecef] px-2 py-0.5 text-[#b8213f]"><ThumbsDown size={12} />Pas utile</span>}
                        </span>
                      </span>
                      <ChevronDown size={16} className={`mt-1 shrink-0 text-ink-mute transition ${ouvert === x.id ? "rotate-180" : ""}`} />
                    </button>
                    {ouvert === x.id && <div className="mt-3"><Conversation id={x.id} /></div>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-mute">Aucune question ne correspond.</p>}
          </Panel>
        </div>
      )}
    </>
  );
}
