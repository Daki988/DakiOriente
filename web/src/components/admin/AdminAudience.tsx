"use client";
// Tableau d'audience (maquette « Dossier et audience », écran 6) : visiteurs, pages vues, pays, pages, provenance, appareils, services.
import { Download, Eye, Layers, Monitor, Radio, Smartphone, Tablet, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Kpi, Loading, Panel } from "@/components/app/kit";
import { useApi } from "@/hooks/useApi";
import { apiUrl } from "@/lib/api";
import { nomPays } from "@/lib/pays-origine";
import { SERVICES } from "@/lib/services";
import { AdminHeader, LoadError } from "./shared";

type Stats = {
  periode: string; depuis: string;
  kpi: { visiteurs: number; vues: number; pagesParVisite: number; inscriptions: number; enLigne: number; evolution: { visiteurs: number | null; vues: number | null } };
  parJour: { jour: string; vues: number; visiteurs: number }[]; pays: { code: string | null; visiteurs: number }[]; pages: { chemin: string; vues: number }[];
  sources: { source: string; n: number }[]; appareils: { appareil: string; visiteurs: number }[]; services: { service: string; vues: number }[];
};
const nf = (n: number) => n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
const PERIODES: [string, string][] = [["jour", "Aujourd'hui"], ["7j", "7 jours"], ["30j", "30 jours"], ["12m", "12 mois"]];
const SOURCES: Record<string, string> = { direct: "Direct", google: "Recherche Google", "autres moteurs": "Autres moteurs", facebook: "Facebook", instagram: "Instagram", whatsapp: "WhatsApp", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn", x: "X (Twitter)" };
const APP: Record<string, [string, typeof Smartphone]> = { mobile: ["Téléphone", Smartphone], ordinateur: ["Ordinateur", Monitor], tablette: ["Tablette", Tablet] };
const TITRES: [RegExp, string][] = [[/^\/$/, "Accueil"], [/^\/orientation\/$/, "Test d'orientation"], [/^\/etablissements\/$/, "Établissements"], [/^\/formations\/$/, "Formations"], [/^\/metiers\/$/, "Métiers"], [/^\/navilease\/$/, "Navilease"], [/^\/navilease\/residences\/$/, "Résidences universitaires"], [/^\/navitravel\/$/, "NaviTravel"], [/^\/devis\/$/, "Devis parents"], [/^\/parents\/$/, "Parents"], [/^\/pourquoi\/$/, "Pourquoi Navigoal"], [/^\/inscription\/$/, "Inscription"], [/^\/connexion\/$/, "Connexion"], [/^\/espace\//, "Espace élève"]];
const titre = (c: string) => TITRES.find(([r]) => r.test(c))?.[1] ?? decodeURIComponent(c.replace(/\/$/, "").split("/").pop() ?? c).replace(/-/g, " ");

export function AdminAudience() {
  const [periode, setPeriode] = useState("30j");
  const [service, setService] = useState("tous");
  const [pays, setPays] = useState("tous");
  const qs = `periode=${periode}&service=${service}&pays=${pays}`;
  const s = useApi<Stats>(`/admin/audience?${qs}`);
  if (s.error) return <LoadError error={s.error} reload={s.reload} />;
  const d = s.data;
  const maxPays = Math.max(1, ...(d?.pays.map((x) => x.visiteurs) ?? [1]));
  const totSources = Math.max(1, (d?.sources ?? []).reduce((a, x) => a + x.n, 0));
  const totApp = Math.max(1, (d?.appareils ?? []).reduce((a, x) => a + x.visiteurs, 0));
  const totServ = Math.max(1, (d?.services ?? []).reduce((a, x) => a + x.vues, 0));
  const pts = d?.parJour ?? [];
  const maxJ = Math.max(1, ...pts.map((x) => x.visiteurs));
  const W = 700, H = 160;
  const ligne = pts.map((x, i) => `${pts.length > 1 ? (i * W) / (pts.length - 1) : W / 2},${H - (x.visiteurs / maxJ) * (H - 10)}`).join(" ");

  return (
    <>
      <AdminHeader title="Audience" sub="Mesure intégrée, sans cookie ni service tiers : l'adresse IP n'est jamais conservée."
        actions={<a href={apiUrl(`/admin/audience/export.csv?${qs}`)} className="btn-ghost"><Download size={16} />Export CSV</a>} />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {d && <span className="chip bg-[#e8f8ef] text-[#0f8a46]"><Radio size={13} />{d.kpi.enLigne} visiteur{d.kpi.enLigne > 1 ? "s" : ""} en ce moment</span>}
        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          {PERIODES.map(([v, l]) => <button key={v} onClick={() => setPeriode(v)} className={`chip px-3 py-2 text-[13px] ${periode === v ? "bg-ink text-white" : "border border-slate-200 bg-white text-ink-soft"}`}>{l}</button>)}
        </div>
        <select value={service} onChange={(e) => setService(e.target.value)} className="input w-auto py-2 text-[13px]" aria-label="Service">
          <option value="tous">Tous les services</option>{Object.values(SERVICES).map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}
        </select>
        <select value={pays} onChange={(e) => setPays(e.target.value)} className="input w-auto py-2 text-[13px]" aria-label="Pays">
          <option value="tous">Tous les pays</option>{(d?.pays ?? []).filter((x) => x.code).map((x) => <option key={x.code} value={x.code!}>{nomPays(x.code)}</option>)}
        </select>
      </div>
      {!d ? <Loading /> : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Visiteurs" value={nf(d.kpi.visiteurs)} icon={Users} trend={d.kpi.evolution.visiteurs} />
            <Kpi label="Pages vues" value={nf(d.kpi.vues)} icon={Eye} tone="violet" trend={d.kpi.evolution.vues} />
            <Kpi label="Pages par visite" value={d.kpi.pagesParVisite.toLocaleString("fr-FR")} icon={Layers} tone="sun" />
            <Kpi label="Inscriptions" value={nf(d.kpi.inscriptions)} icon={UserPlus} tone="green" sub={d.kpi.visiteurs ? `${((d.kpi.inscriptions / d.kpi.visiteurs) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % des visiteurs` : undefined} />
          </div>
          <Panel title="Visiteurs par jour">
            {pts.length ? (
              <svg viewBox={`0 0 ${W} ${H + 4}`} className="h-[180px] w-full" preserveAspectRatio="none" role="img" aria-label="Visiteurs par jour">
                <polygon points={`0,${H} ${ligne} ${W},${H}`} fill="#1a47f5" fillOpacity=".08" />
                <polyline points={ligne} fill="none" stroke="#1a47f5" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              </svg>
            ) : <p className="text-sm text-ink-mute">Pas encore de visites sur cette période.</p>}
            {pts.length > 0 && <div className="flex justify-between text-xs text-ink-mute"><span>{new Date(pts[0].jour).toLocaleDateString("fr-FR")}</span><span>{new Date(pts[pts.length - 1].jour).toLocaleDateString("fr-FR")}</span></div>}
          </Panel>
          <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr_0.8fr]">
            <Panel title="Pays des visiteurs">
              {d.pays.map((x) => (
                <div key={x.code ?? "?"} className="flex items-center gap-3 text-[13px]">
                  <span className="chip w-9 justify-center bg-[#eef1f8] px-1 text-ink-soft">{x.code ?? "?"}</span>
                  <span className="w-28 truncate">{x.code ? nomPays(x.code) : "Inconnu"}</span>
                  <span className="relative h-1.5 flex-1 rounded-full bg-[#e6eaf3]"><span className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: `${(x.visiteurs / maxPays) * 100}%` }} /></span>
                  <b className="w-12 text-right">{nf(x.visiteurs)}</b>
                </div>
              ))}
              {!d.pays.length && <p className="text-sm text-ink-mute">Aucune donnée.</p>}
            </Panel>
            <Panel title="Pages les plus visitées">
              {d.pages.map((x) => (
                <div key={x.chemin} className="flex items-center justify-between gap-3 border-b border-[#eef1f8] pb-2 text-[13px] last:border-0">
                  <a href={x.chemin} target="_blank" rel="noopener" className="min-w-0"><b className="block truncate first-letter:uppercase">{titre(x.chemin)}</b><span className="block truncate text-xs text-ink-mute">{x.chemin}</span></a>
                  <b>{nf(x.vues)}</b>
                </div>
              ))}
              {!d.pages.length && <p className="text-sm text-ink-mute">Aucune donnée.</p>}
            </Panel>
            <div className="flex flex-col gap-5">
              <Panel title="Provenance">
                {d.sources.map((x) => <div key={x.source} className="flex justify-between gap-3 border-b border-[#eef1f8] pb-1.5 text-[13px] last:border-0"><span className="truncate">{SOURCES[x.source] ?? x.source}</span><b>{Math.round((x.n / totSources) * 100)} %</b></div>)}
                {!d.sources.length && <p className="text-sm text-ink-mute">Aucune donnée.</p>}
              </Panel>
              <Panel title="Appareils">
                {d.appareils.map((x) => { const [l, I] = APP[x.appareil] ?? [x.appareil, Monitor]; return <div key={x.appareil} className="flex items-center justify-between text-[13px]"><span className="flex items-center gap-2"><I size={15} className="text-ink-mute" />{l}</span><b>{Math.round((x.visiteurs / totApp) * 100)} %</b></div>; })}
              </Panel>
            </div>
          </div>
          <Panel title="Par service">
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.values(SERVICES).map((sv) => { const v = d.services.find((x) => x.service === sv.id)?.vues ?? 0; return <div key={sv.id} className="border-l-4 pl-3" style={{ borderColor: sv.c }}><b>{sv.nom}</b><span className="block text-xs text-ink-mute">{nf(v)} pages vues · {Math.round((v / totServ) * 100)} %</span></div>; })}
            </div>
          </Panel>
          <p className="text-xs text-ink-mute">Pays déduit de l&apos;adresse IP par une base installée sur le serveur (DB-IP Lite, CC BY 4.0). Visiteurs comptés par une empreinte anonyme renouvelée chaque jour. Les pages du back-office ne sont pas comptées.</p>
        </div>
      )}
    </>
  );
}
